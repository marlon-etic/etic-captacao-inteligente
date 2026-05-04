import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

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

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) throw new Error('Missing Authorization header')

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

    const bodyText = await req.text()
    const body = bodyText ? JSON.parse(bodyText) : {}
    const { action, payload } = body

    const isOwner =
      user.email === 'marlonjmoro@hotmail.com' || user.email === 'marlon@eticimoveis.com.br'
    const isAdmin =
      profile?.role === 'admin' ||
      profile?.role === 'gestor' ||
      user.app_metadata?.role === 'admin' ||
      user.user_metadata?.role === 'admin' ||
      isOwner
    const isSelf = payload?.id && user.id === payload.id

    if (!isAdmin && !isSelf) {
      throw new Error('Forbidden')
    }

    if (action === 'createUser') {
      if (!isAdmin) throw new Error('Forbidden - Admins only')

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

      const { error: dbError } = await supabaseClient.from('users').upsert({
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

      const metaUpdates: any = {}
      if (name) metaUpdates.name = name
      if (role && isAdmin) metaUpdates.role = role

      if (Object.keys(metaUpdates).length > 0) {
        authUpdates.user_metadata = metaUpdates
      }

      if (isAdmin) {
        if (status === 'inativo' || status === 'bloqueado') {
          authUpdates.ban_duration = '876000h'
        } else if (status === 'ativo') {
          authUpdates.ban_duration = 'none'
        }
      }

      const { data: authData, error: updateAuthError } =
        await supabaseClient.auth.admin.updateUserById(id, authUpdates)
      if (updateAuthError) {
        console.error('Auth update error:', updateAuthError.message)
        // Se a requisição apenas atualiza status/role e falha na auth, continua para atualizar a tabela users.
        // Mas se envolver credenciais críticas, rejeita.
        if (email || password) {
          throw updateAuthError
        }
      }

      const dbUpdates: any = {}
      if (email) dbUpdates.email = email
      if (name) dbUpdates.nome = name
      if (role && isAdmin) dbUpdates.role = role
      if (status && isAdmin) dbUpdates.status = status

      if (Object.keys(dbUpdates).length > 0) {
        const { error: dbError } = await supabaseClient.from('users').update(dbUpdates).eq('id', id)
        if (dbError) throw dbError
      }

      return new Response(JSON.stringify({ user: authData?.user || { id } }), {
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
