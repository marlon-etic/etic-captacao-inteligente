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
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', message: 'Missing JWT' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const {
      data: { user },
      error: authError,
    } = await supabaseAuthClient.auth.getUser()

    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized', message: 'Invalid JWT' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('nome, role')
      .eq('id', user.id)
      .single()

    if (userError || !userData || !['sdr', 'corretor', 'admin', 'gestor'].includes(userData.role)) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Forbidden',
          message: 'User does not have the required role',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const body = await req.json()
    const { property_link_id, negotiation_status, notes } = body

    if (!property_link_id || !negotiation_status) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'property_link_id and negotiation_status are required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    if (negotiation_status !== 'negotiated' && negotiation_status !== 'failed') {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'negotiation_status must be "negotiated" or "failed"',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // Check if property_link_id exists
    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('imovel_demand_match')
      .select('id')
      .eq('id', property_link_id)
      .single()

    if (linkError || !linkData) {
      return new Response(
        JSON.stringify({ success: false, error: 'Not Found', message: 'Property link not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // Check for duplicate negotiation
    const { data: existingNegotiation, error: checkError } = await supabaseAdmin
      .from('negotiation_records')
      .select('id')
      .eq('property_link_id', property_link_id)
      .maybeSingle()

    if (checkError) {
      throw checkError
    }

    if (existingNegotiation) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Negotiation already recorded',
          message: 'A negotiation has already been recorded for this property.',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    // Insert new negotiation
    const now = new Date().toISOString()
    const { data: newNegotiation, error: insertError } = await supabaseAdmin
      .from('negotiation_records')
      .insert({
        property_link_id,
        negotiated_by_user_id: user.id,
        negotiation_status,
        notes: notes || null,
        negotiation_date: now,
        created_at: now,
        updated_at: now,
      })
      .select('id, negotiation_date')
      .single()

    if (insertError) {
      throw insertError
    }

    return new Response(
      JSON.stringify({
        success: true,
        negotiation_id: newNegotiation.id,
        status: negotiation_status,
        negotiation_date: newNegotiation.negotiation_date,
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  } catch (error: any) {
    return new Response(
      JSON.stringify({ success: false, error: 'Internal Server Error', message: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      },
    )
  }
})
