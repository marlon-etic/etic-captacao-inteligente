import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, x-supabase-client-platform, apikey, content-type',
}

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

    if (userError || !userData || !['sdr', 'corretor', 'admin', 'gestor'].includes(userData.role)) {
      return new Response(JSON.stringify({ success: false, error: 'Forbidden', message: 'User does not have the required role' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const body = await req.json()
    const { property_link_id, notes, visited_at, imovel_id, demanda_id, tipo_demanda } = body

    const normalizedTipo = (tipo_demanda === 'Aluguel' || tipo_demanda === 'Locação') ? 'Locação' : 'Venda'
    const visitTimestamp = visited_at ? new Date(visited_at).toISOString() : new Date().toISOString()
    const visitDateOnly = visitTimestamp.split('T')[0]

    let matchId = property_link_id

    if (!matchId && imovel_id && demanda_id) {
      const { data: existingMatch } = await supabaseAdmin
        .from('imovel_demand_match')
        .select('id')
        .eq('imovel_id', imovel_id)
        .eq('demanda_id', demanda_id)
        .maybeSingle()

      if (existingMatch) {
        matchId = existingMatch.id
      } else {
        const { data: newMatch, error: matchError } = await supabaseAdmin
          .from('imovel_demand_match')
          .insert({
            imovel_id,
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
            .eq('imovel_id', imovel_id)
            .eq('demanda_id', demanda_id)
            .maybeSingle()
          if (retryMatch) matchId = retryMatch.id
        } else {
          matchId = newMatch.id
        }
      }
    }

    if (demanda_id) {
      await supabaseAdmin
        .from('visitas_imovel')
        .insert({
          demanda_id,
          tipo_demanda: normalizedTipo,
          imovel_id: imovel_id || null,
          user_sdr_id: user.id,
          data_visita: visitTimestamp,
          qtd_imoveis_visitados: 1,
        })
    }

    if (!matchId && !demanda_id) {
      return new Response(JSON.stringify({ success: false, error: 'Bad Request', message: 'property_link_id or (imovel_id + demanda_id) or demanda_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (matchId) {
      const { data: linkData, error: linkError } = await supabaseAdmin
        .from('imovel_demand_match')
        .select('id, imovel_id, demanda_id, tipo_demanda, captador_id')
        .eq('id', matchId)
        .single()

      if (linkError || !linkData) {
        return new Response(JSON.stringify({ success: false, error: 'Not Found', message: 'Property link not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const { data: existingVisit } = await supabaseAdmin
        .from('visit_records')
        .select('id')
        .eq('property_link_id', matchId)
        .eq('sdr_user_id', user.id)
        .eq('visited_date', visitDateOnly)
        .maybeSingle()

      if (existingVisit) {
        return new Response(JSON.stringify({ success: false, error: 'Visit already recorded', message: 'A visit has already been recorded for this property on this date.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        })
      }

      const { data: newVisit, error: insertError } = await supabaseAdmin
        .from('visit_records')
        .insert({
          property_link_id: matchId,
          sdr_user_id: user.id,
          notes: notes || null,
          visited_at: visitTimestamp,
          visited_date: visitDateOnly,
          created_at: visitTimestamp,
          updated_at: visitTimestamp,
        })
        .select('id, visited_at')
        .single()

      if (insertError) throw insertError

      // Notify the captador about the registered visit
      if (linkData?.imovel_id) {
        const { data: imovelData } = await supabaseAdmin
          .from('imoveis_captados')
          .select('captador_id, user_captador_id, endereco, localizacao_texto')
          .eq('id', linkData.imovel_id)
          .maybeSingle()

        const captadorId = linkData.captador_id || imovelData?.user_captador_id || imovelData?.captador_id

        if (captadorId) {
          const propertyInfo = imovelData?.endereco || imovelData?.localizacao_texto || 'imóvel'
          const visitDateFormatted = new Date(visitTimestamp).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })

          await supabaseAdmin
            .from('notificacoes')
            .insert({
              usuario_id: captadorId,
              tipo: 'visita_registrada',
              titulo: 'Visita Registrada',
              mensagem: `Uma visita foi registrada para o imóvel "${propertyInfo}" em ${visitDateFormatted}.`,
              dados_relacionados: {
                visit_id: newVisit?.id || null,
                imovel_id: linkData.imovel_id,
                demanda_id: linkData.demanda_id,
                sdr_name: userData.nome,
                visited_at: visitTimestamp,
              },
              prioridade: 'normal',
              lido: false,
            })
        }
      }

      return new Response(JSON.stringify({
        success: true,
        visit_id: newVisit.id,
        visited_at: newVisit.visited_at,
        sdr_name: userData.nome,
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    return new Response(JSON.stringify({
      success: true,
      visit_id: null,
      visited_at: visitTimestamp,
      sdr_name: userData.nome,
      message: 'Visit recorded for demand',
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
