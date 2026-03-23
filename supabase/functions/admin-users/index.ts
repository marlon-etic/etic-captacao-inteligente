import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser(token)

    if (authError || !user) {
      throw new Error('Unauthorized')
    }

    const { data: profile } = await supabaseClient
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'admin' && profile?.role !== 'gestor') {
      throw new Error('Forbidden')
    }

    const body = await req.json()
    const { action, payload } = body

    if (action === 'createUser') {
      const { email, password, name, role, status } = payload

      const { data: authData, error: createAuthError } = await supabaseClient.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: true,
          user_metadata: { name, role },
        },
      )

      if (createAuthError) throw createAuthError

      const { error: dbError } = await supabaseClient.from('users').insert({
        id: authData.user.id,
        email,
        nome: name,
        role,
        status: status || 'ativo',
      })

      if (dbError) {
        await supabaseClient.auth.admin.deleteUser(authData.user.id)
        throw dbError
      }

      return new Response(JSON.stringify({ user: authData.user, id: authData.user.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    if (action === 'updateUser') {
      const { id, email, password, name, role, status } = payload

      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password
      if (name || role) authUpdates.user_metadata = { name, role }

      if (status === 'inativo' || status === 'bloqueado') {
        authUpdates.ban_duration = '876000h'
      } else if (status === 'ativo') {
        authUpdates.ban_duration = 'none'
      }

      const { data: authData, error: updateAuthError } =
        await supabaseClient.auth.admin.updateUserById(id, authUpdates)
      if (updateAuthError) throw updateAuthError

      const { error: dbError } = await supabaseClient
        .from('users')
        .update({
          email,
          nome: name,
          role,
          status,
        })
        .eq('id', id)

      if (dbError) throw dbError

      return new Response(JSON.stringify({ user: authData.user }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error('Invalid action')
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
