import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized', message: 'Missing JWT' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ success: false, error: 'Unauthorized', message: 'Invalid JWT' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nome, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || userData.role !== 'sdr') {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden', message: 'User does not have the required sdr role' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const body = await req.json()
    const { property_link_id, notes } = body

    if (!property_link_id) {
      return new Response(JSON.stringify({ success: false, error: 'Bad Request', message: 'property_link_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Check if property_link_id exists
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('imovel_demand_match')
      .select('id')
      .eq('id', property_link_id)
      .single()

    if (linkError || !linkData) {
      return new Response(JSON.stringify({ success: false, error: 'Not Found', message: 'Property link not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Check for duplicate visit today
    const today = new Date().toISOString().split('T')[0]
    const { data: existingVisit, error: checkError } = await supabaseAdmin
      .from('visit_records')
      .select('id')
      .eq('property_link_id', property_link_id)
      .eq('sdr_user_id', user.id)
      .eq('visited_date', today)
      .maybeSingle()

    if (checkError) {
      throw checkError
    }

    if (existingVisit) {
      return new Response(JSON.stringify({ success: false, error: 'Visit already recorded today', message: 'A visit has already been recorded for this property today.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    // Insert new visit
    const now = new Date().toISOString()
    const { data: newVisit, error: insertError } = await supabaseAdmin
      .from('visit_records')
      .insert({
        property_link_id,
        sdr_user_id: user.id,
        notes: notes || null,
        visited_at: now,
        visited_date: today,
        created_at: now,
        updated_at: now
      })
      .select('id, visited_at')
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(JSON.stringify({
      success: true,
      visit_id: newVisit.id,
      visited_at: newVisit.visited_at,
      sdr_name: userData.nome
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ success: false, error: 'Internal Server Error', message: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})
