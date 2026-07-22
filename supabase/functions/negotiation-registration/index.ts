import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

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
    const { property_link_id, negotiation_status, notes, valor_fechado } = body

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

    if (
      negotiation_status === 'negotiated' &&
      (valor_fechado === undefined ||
        valor_fechado === null ||
        isNaN(Number(valor_fechado)) ||
        Number(valor_fechado) <= 0)
    ) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bad Request',
          message:
            'valor_fechado is required and must be a positive number when negotiation_status is "negotiated"',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    const { data: linkData, error: linkError } = await supabaseAdmin
      .from('imovel_demand_match')
      .select('id, imovel_id, demanda_id, tipo_demanda, captador_id')
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

    const now = new Date().toISOString()
    const { data: newNegotiation, error: insertError } = await supabaseAdmin
      .from('negotiation_records')
      .insert({
        property_link_id,
        negotiated_by_user_id: user.id,
        negotiation_status,
        notes: notes || null,
        valor_fechado: negotiation_status === 'negotiated' ? Number(valor_fechado) : 0,
        negotiation_date: now,
        created_at: now,
        updated_at: now,
      })
      .select('id, negotiation_date')
      .single()

    if (insertError) {
      throw insertError
    }

    if (linkData?.imovel_id) {
      const { data: imovelData } = await supabaseAdmin
        .from('imoveis_captados')
        .select('captador_id, user_captador_id, endereco, localizacao_texto, codigo_imovel')
        .eq('id', linkData.imovel_id)
        .maybeSingle()

      const captadorId =
        linkData.captador_id || imovelData?.user_captador_id || imovelData?.captador_id

      if (captadorId) {
        const propertyCode = imovelData?.codigo_imovel
        const propertyAddress = imovelData?.endereco || imovelData?.localizacao_texto || 'imóvel'
        const propertyInfo = propertyCode ? `${propertyCode} - ${propertyAddress}` : propertyAddress
        const statusText =
          negotiation_status === 'negotiated' ? 'Negócio fechado' : 'Negociação falhou'
        const valorFormatado =
          negotiation_status === 'negotiated' && Number(valor_fechado) > 0
            ? ` no valor de R$ ${Number(valor_fechado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : ''

        try {
          await supabaseAdmin.from('notificacoes').insert({
            usuario_id: captadorId,
            tipo: 'negociacao_registrada',
            titulo: 'Negociação Registrada',
            mensagem: `${statusText}${valorFormatado} para o imóvel "${propertyInfo}".`,
            dados_relacionados: {
              negotiation_id: newNegotiation.id,
              imovel_id: linkData.imovel_id,
              demanda_id: linkData.demanda_id,
              negotiation_status,
              property_code: imovelData?.codigo_imovel || null,
              property_address: imovelData?.endereco || imovelData?.localizacao_texto || null,
              valor_fechado: negotiation_status === 'negotiated' ? Number(valor_fechado) : 0,
              sdr_name: userData.nome,
            },
            prioridade: negotiation_status === 'negotiated' ? 'alta' : 'normal',
            lido: false,
          })
        } catch (notifErr) {
          console.error('[negotiation-registration] Notification insert failed:', notifErr)
        }
      }
    }

    try {
      await supabaseAdmin.from('audit_log').insert({
        usuario_id: user.id,
        acao: 'INSERT',
        tabela: 'negotiation_records',
        registro_id: newNegotiation.id,
        dados_novos: {
          property_link_id,
          negotiated_by_user_id: user.id,
          negotiation_status,
          valor_fechado: negotiation_status === 'negotiated' ? Number(valor_fechado) : 0,
          notes: notes || null,
          sdr_name: userData.nome,
        },
      })
    } catch (auditErr) {
      console.error('[negotiation-registration] Audit log insert failed:', auditErr)
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
