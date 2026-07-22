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
    const {
      property_link_id,
      notes,
      visited_at,
      imovel_id,
      demanda_id,
      tipo_demanda,
      valor_aluguel,
      manual_property_ref,
    } = body

    const normalizedTipo =
      tipo_demanda === 'Aluguel' || tipo_demanda === 'Locação' ? 'Locação' : 'Venda'
    const visitTimestamp = visited_at
      ? new Date(visited_at).toISOString()
      : new Date().toISOString()
    const visitDateOnly = visitTimestamp.split('T')[0]
    const parsedValorAluguel = valor_aluguel ? Number(valor_aluguel) : 0

    let resolvedImovelId = imovel_id || null

    if (!resolvedImovelId && manual_property_ref) {
      const { data: propByCode } = await supabaseAdmin
        .from('imoveis_captados')
        .select('id')
        .eq('codigo_imovel', manual_property_ref.trim())
        .maybeSingle()
      if (propByCode) {
        resolvedImovelId = propByCode.id
      }
    }

    let matchId = property_link_id

    if (!matchId && resolvedImovelId && demanda_id) {
      const { data: existingMatch } = await supabaseAdmin
        .from('imovel_demand_match')
        .select('id')
        .eq('imovel_id', resolvedImovelId)
        .eq('demanda_id', demanda_id)
        .maybeSingle()

      if (existingMatch) {
        matchId = existingMatch.id
      } else {
        const { data: newMatch, error: matchError } = await supabaseAdmin
          .from('imovel_demand_match')
          .insert({
            imovel_id: resolvedImovelId,
            demanda_id,
            tipo_demanda: normalizedTipo,
            tipo_vinculacao: 'manual',
            compatibilidade_pct: 0,
          })
          .select('id')
          .single()

        if (matchError) {
          const { data: retryMatch } = await supabaseAdmin
            .from('imovel_demand_match')
            .select('id')
            .eq('imovel_id', resolvedImovelId)
            .eq('demanda_id', demanda_id)
            .maybeSingle()
          if (retryMatch) matchId = retryMatch.id
        } else {
          matchId = newMatch.id
        }
      }
    }

    if (demanda_id) {
      await supabaseAdmin.from('visitas_imovel').insert({
        demanda_id,
        tipo_demanda: normalizedTipo,
        imovel_id: resolvedImovelId || null,
        user_sdr_id: user.id,
        data_visita: visitTimestamp,
        qtd_imoveis_visitados: 1,
      })
    }

    if (!matchId && !demanda_id) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Bad Request',
          message: 'property_link_id or (imovel_id + demanda_id) or demanda_id is required',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    if (matchId) {
      const { data: linkData, error: linkError } = await supabaseAdmin
        .from('imovel_demand_match')
        .select('id, imovel_id, demanda_id, tipo_demanda, captador_id')
        .eq('id', matchId)
        .single()

      if (linkError || !linkData) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Not Found',
            message: 'Property link not found',
          }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      const { data: existingVisit } = await supabaseAdmin
        .from('visit_records')
        .select('id')
        .eq('property_link_id', matchId)
        .eq('sdr_user_id', user.id)
        .eq('visited_date', visitDateOnly)
        .maybeSingle()

      if (existingVisit) {
        return new Response(
          JSON.stringify({
            success: false,
            error: 'Visit already recorded',
            message: 'A visit has already been recorded for this property on this date.',
          }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          },
        )
      }

      const { data: newVisit, error: insertError } = await supabaseAdmin
        .from('visit_records')
        .insert({
          property_link_id: matchId,
          sdr_user_id: user.id,
          notes: notes || null,
          visited_at: visitTimestamp,
          visited_date: visitDateOnly,
          valor_aluguel: parsedValorAluguel || null,
          created_at: visitTimestamp,
          updated_at: visitTimestamp,
        })
        .select('id, visited_at')
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Visit already recorded',
              message: 'A visit has already been recorded for this property on this date.',
            }),
            {
              status: 400,
              headers: { 'Content-Type': 'application/json', ...corsHeaders },
            },
          )
        }
        throw insertError
      }

      if (linkData?.imovel_id) {
        const { data: imovelData } = await supabaseAdmin
          .from('imoveis_captados')
          .select('captador_id, user_captador_id, endereco, localizacao_texto')
          .eq('id', linkData.imovel_id)
          .maybeSingle()

        const captadorId =
          linkData.captador_id || imovelData?.user_captador_id || imovelData?.captador_id

        if (captadorId) {
          const propertyInfo = imovelData?.endereco || imovelData?.localizacao_texto || 'imóvel'
          const visitDateFormatted = new Date(visitTimestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })
          const valorInfo =
            parsedValorAluguel > 0
              ? ` | Valor: R$ ${parsedValorAluguel.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : ''

          try {
            await supabaseAdmin.from('notificacoes').insert({
              usuario_id: captadorId,
              tipo: 'visita_registrada',
              titulo: 'Visita Registrada',
              mensagem: `Uma visita foi registrada para o imóvel "${propertyInfo}" em ${visitDateFormatted}${valorInfo}.`,
              dados_relacionados: {
                visit_id: newVisit?.id || null,
                imovel_id: linkData.imovel_id,
                demanda_id: linkData.demanda_id,
                sdr_name: userData.nome,
                visited_at: visitTimestamp,
                valor_aluguel: parsedValorAluguel || null,
              },
              prioridade: 'normal',
              lido: false,
            })
          } catch (notifErr) {
            console.error('[visit-registration] Notification insert failed:', notifErr)
          }
        }
      }

      try {
        await supabaseAdmin.from('audit_log').insert({
          usuario_id: user.id,
          acao: 'INSERT',
          tabela: 'visit_records',
          registro_id: newVisit.id,
          dados_novos: {
            property_link_id: matchId,
            sdr_user_id: user.id,
            visited_at: visitTimestamp,
            notes: notes || null,
            valor_aluguel: parsedValorAluguel || null,
            sdr_name: userData.nome,
          },
        })
      } catch (auditErr) {
        console.error('[visit-registration] Audit log insert failed:', auditErr)
      }

      return new Response(
        JSON.stringify({
          success: true,
          visit_id: newVisit.id,
          visited_at: newVisit.visited_at,
          sdr_name: userData.nome,
          valor_aluguel: parsedValorAluguel || null,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        },
      )
    }

    try {
      await supabaseAdmin.from('audit_log').insert({
        usuario_id: user.id,
        acao: 'INSERT',
        tabela: 'visitas_imovel',
        registro_id: demanda_id,
        dados_novos: {
          demanda_id,
          tipo_demanda: normalizedTipo,
          imovel_id: resolvedImovelId || null,
          user_sdr_id: user.id,
          data_visita: visitTimestamp,
          valor_aluguel: parsedValorAluguel || null,
          manual_property_ref: manual_property_ref || null,
          sdr_name: userData.nome,
        },
      })
    } catch (auditErr) {
      console.error('[visit-registration] Audit log insert failed:', auditErr)
    }

    return new Response(
      JSON.stringify({
        success: true,
        visit_id: null,
        visited_at: visitTimestamp,
        sdr_name: userData.nome,
        message:
          manual_property_ref && !resolvedImovelId
            ? 'Visit recorded for demand. Property reference not found in database.'
            : 'Visit recorded for demand',
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
