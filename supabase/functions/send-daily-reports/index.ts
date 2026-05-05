import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Interface mock para simular o serviço de email (ex: SendGrid, Resend)
async function sendEmailMock(options: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL SENT] To: ${options.to} | Subject: ${options.subject}`)
  return true
}

async function calculateAggregatedMetrics(supabase: any, dateRange: any) {
  try {
    const { data: createdProps } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'property_created')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: createdDemands } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'demand_created')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: closedDeals } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('event_type', 'property_deal_closed')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const totalProperties = createdProps?.length || 0
    const totalDemands = createdDemands?.length || 0
    const totalClosed = closedDeals?.length || 0

    const { data: users } = await supabase
      .from('users')
      .select('id')
      .in('role', ['captador', 'sdr', 'corretor'])
      .eq('status', 'ativo')

    const totalUsers = users?.length || 0
    const avgConversionRate = totalProperties > 0 ? (totalClosed / totalProperties) * 100 : 0

    return {
      totalProperties,
      totalDemands,
      totalClosed,
      totalUsers,
      avgConversionRate: Math.round(avgConversionRate),
      dateRange,
    }
  } catch (err) {
    console.error('[calculateAggregatedMetrics] Erro:', err)
    return null
  }
}

async function getCaptadoresData(supabase: any, dateRange: any) {
  const { data: users } = await supabase
    .from('users')
    .select('id, email, nome')
    .eq('role', 'captador')
    .eq('status', 'ativo')

  const captadores = []

  for (const user of users || []) {
    const { data: created } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'property_created')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: linked } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'property_linked')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: closed } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'property_deal_closed')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const total = created?.length || 0
    const linkedCount = linked?.length || 0
    const closedCount = closed?.length || 0
    const conversionRate = total > 0 ? (closedCount / total) * 100 : 0

    captadores.push({
      id: user.id,
      name: user.nome || 'Sem nome',
      email: user.email,
      totalCaptured: total,
      linkedProperties: linkedCount,
      freeProperties: total - linkedCount,
      closedDeals: closedCount,
      conversionRate: Math.round(conversionRate),
    })
  }

  return captadores.sort((a, b) => b.totalCaptured - a.totalCaptured).slice(0, 3)
}

async function getCorretoresData(supabase: any, dateRange: any) {
  const { data: users } = await supabase
    .from('users')
    .select('id, email, nome')
    .in('role', ['sdr', 'corretor'])
    .eq('status', 'ativo')

  const corretores = []

  for (const user of users || []) {
    const { data: created } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'demand_created')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: linked } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'demand_linked')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: visited } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'visit_scheduled')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const { data: closed } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('event_type', 'deal_closed')
      .gte('created_at', dateRange.start)
      .lt('created_at', dateRange.end)

    const total = created?.length || 0
    const linkedCount = linked?.length || 0
    const visitedCount = visited?.length || 0
    const closedCount = closed?.length || 0
    const conversionRate = total > 0 ? (closedCount / total) * 100 : 0

    corretores.push({
      id: user.id,
      name: user.nome || 'Sem nome',
      email: user.email,
      totalDemands: total,
      linkedDemands: linkedCount,
      visitedProperties: visitedCount,
      closedDeals: closedCount,
      conversionRate: Math.round(conversionRate),
    })
  }

  return corretores.sort((a, b) => b.totalDemands - a.totalDemands).slice(0, 3)
}

function generateUnifiedEmailHTML(
  aggregated: any,
  captadores: any[],
  corretores: any[],
  baseUrl: string,
): string {
  const dashboardUrl = `${baseUrl}/app/analytics`
  const yesterdayDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')

  const captadoresTableHTML =
    captadores.length > 0
      ? `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Captador</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Captados</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Sob Demanda</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Livres</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Fechados</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Taxa</th>
        </tr>
      </thead>
      <tbody>
        ${captadores
          .map(
            (c, idx) => `
          <tr style="border-bottom: 1px solid #e5e5e5; ${idx === 0 ? 'background: #f0f9ff;' : ''}">
            <td style="padding: 12px;"><strong>${c.name}</strong></td>
            <td style="padding: 12px; text-align: center;">${c.totalCaptured}</td>
            <td style="padding: 12px; text-align: center; color: #22c55e;">${c.linkedProperties}</td>
            <td style="padding: 12px; text-align: center;">${c.freeProperties}</td>
            <td style="padding: 12px; text-align: center; color: #22c55e;"><strong>${c.closedDeals}</strong></td>
            <td style="padding: 12px; text-align: center;">${c.conversionRate}%</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `
      : '<p style="color: #999;">Nenhuma atividade de captadores no dia anterior.</p>'

  const corretoresTableHTML =
    corretores.length > 0
      ? `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
      <thead>
        <tr style="background: #f3f4f6;">
          <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Corretor/SDR</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Demandas</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Vinculadas</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Visitas</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Fechados</th>
          <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e5e5e5; font-weight: 600;">Taxa</th>
        </tr>
      </thead>
      <tbody>
        ${corretores
          .map(
            (c, idx) => `
          <tr style="border-bottom: 1px solid #e5e5e5; ${idx === 0 ? 'background: #f0f9ff;' : ''}">
            <td style="padding: 12px;"><strong>${c.name}</strong></td>
            <td style="padding: 12px; text-align: center;">${c.totalDemands}</td>
            <td style="padding: 12px; text-align: center; color: #22c55e;">${c.linkedDemands}</td>
            <td style="padding: 12px; text-align: center;">${c.visitedProperties}</td>
            <td style="padding: 12px; text-align: center; color: #22c55e;"><strong>${c.closedDeals}</strong></td>
            <td style="padding: 12px; text-align: center;">${c.conversionRate}%</td>
          </tr>
        `,
          )
          .join('')}
      </tbody>
    </table>
  `
      : '<p style="color: #999;">Nenhuma atividade de corretores/SDRs no dia anterior.</p>'

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; }
        .container { max-width: 900px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 20px 0; }
        .kpi-card { background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6; }
        .kpi-value { font-size: 24px; font-weight: bold; color: #1f2937; }
        .kpi-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
        .section-title { font-size: 18px; font-weight: 600; color: #1f2937; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid #e5e5e5; padding-bottom: 10px; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; margin-top: 20px; }
        .alert { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 10px 0; border-radius: 4px; color: #991b1b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>📊 Relatório Diário - GoScape</h1>
          <p>Consolidado de ${yesterdayDate}</p>
        </div>
        <div class="content">
          <p>Olá <strong>Marlon</strong>,</p>
          <p>Aqui está o resumo consolidado das atividades do sistema GoScape de ontem:</p>

          <!-- ✅ KPIs Principais -->
          <div class="kpi-grid" style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
            <div class="kpi-card" style="flex: 1; min-width: 120px; background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6;">
              <div class="kpi-value" style="font-size: 24px; font-weight: bold; color: #1f2937;">${aggregated.totalProperties}</div>
              <div class="kpi-label" style="font-size: 12px; color: #6b7280; margin-top: 5px;">Imóveis Captados</div>
            </div>
            <div class="kpi-card" style="flex: 1; min-width: 120px; background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6;">
              <div class="kpi-value" style="font-size: 24px; font-weight: bold; color: #1f2937;">${aggregated.totalDemands}</div>
              <div class="kpi-label" style="font-size: 12px; color: #6b7280; margin-top: 5px;">Demandas Cadastradas</div>
            </div>
            <div class="kpi-card" style="flex: 1; min-width: 120px; background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6;">
              <div class="kpi-value" style="font-size: 24px; font-weight: bold; color: #1f2937;">${aggregated.totalClosed}</div>
              <div class="kpi-label" style="font-size: 12px; color: #6b7280; margin-top: 5px;">Negócios Fechados</div>
            </div>
            <div class="kpi-card" style="flex: 1; min-width: 120px; background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6;">
              <div class="kpi-value" style="font-size: 24px; font-weight: bold; color: #1f2937;">${aggregated.avgConversionRate}%</div>
              <div class="kpi-label" style="font-size: 12px; color: #6b7280; margin-top: 5px;">Taxa Média Conversão</div>
            </div>
            <div class="kpi-card" style="flex: 1; min-width: 120px; background: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; border-left: 4px solid #3b82f6;">
              <div class="kpi-value" style="font-size: 24px; font-weight: bold; color: #1f2937;">${aggregated.totalUsers}</div>
              <div class="kpi-label" style="font-size: 12px; color: #6b7280; margin-top: 5px;">Usuários Ativos</div>
            </div>
          </div>

          <!-- ✅ Seção Captadores -->
          <div class="section-title">🏠 Captadores - Top 3 Performance do Dia</div>
          ${captadoresTableHTML}

          <!-- ✅ Seção Corretores/SDRs -->
          <div class="section-title">💼 Corretores/SDRs - Top 3 Performance do Dia</div>
          ${corretoresTableHTML}

          <!-- ✅ Alertas -->
          <div class="section-title">⚠️ Alertas e Oportunidades</div>
          ${captadores.length === 0 ? '<div class="alert">Nenhuma atividade de captadores no dia anterior.</div>' : ''}
          ${corretores.length === 0 ? '<div class="alert">Nenhuma atividade de corretores/SDRs no dia anterior.</div>' : ''}
          ${aggregated.totalProperties > 0 && aggregated.totalClosed === 0 ? '<div class="alert">Nenhum negócio foi fechado ontem. Verifique se há imóveis em visita ou demandas pendentes.</div>' : ''}

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Ver Dashboard Completo</a>
          </div>

          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Este é um relatório automático gerado às ${new Date().toLocaleTimeString('pt-BR')}. 
            Para mais detalhes, acesse o dashboard de analytics no sistema.
          </p>
        </div>
        <div class="footer">
          <p>© 2026 GoScape - Ética Imóveis. Todos os direitos reservados.</p>
          <p>Relatório enviado para: marlon@eticimoveis.com.br</p>
          <p><a href="${dashboardUrl}/unsubscribe" style="color: #3b82f6; text-decoration: none;">Gerenciar preferências de email</a></p>
        </div>
      </div>
    </body>
    </html>
  `
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('[sendUnifiedDailyReport] Iniciando envio de relatório unificado diário')
    const baseUrl = 'https://etic-captacao-inteligente-86800.goskip.app'

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
    const today = new Date()

    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    )
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

    const dateRange = {
      start: startOfYesterday.toISOString(),
      end: startOfToday.toISOString(),
    }

    const aggregated = await calculateAggregatedMetrics(supabase, dateRange)
    if (!aggregated) {
      throw new Error('Falha ao calcular métricas agregadas')
    }

    const captadores = await getCaptadoresData(supabase, dateRange)
    const corretores = await getCorretoresData(supabase, dateRange)

    const htmlContent = generateUnifiedEmailHTML(aggregated, captadores, corretores, baseUrl)
    const targetEmail = 'marlon@eticimoveis.com.br'

    await sendEmailMock({
      to: targetEmail,
      subject: `📊 Relatório Diário GoScape - ${new Date().toLocaleDateString('pt-BR')}`,
      html: htmlContent,
    })

    // Get an admin user ID for logging purposes since user_id is required in analytics_email_logs
    const { data: adminUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', targetEmail)
      .limit(1)
      .single()

    const logUserId = adminUser?.id

    if (logUserId) {
      await supabase.from('analytics_email_logs').insert([
        {
          user_id: logUserId,
          status: 'sent',
          metrics_data: {
            aggregated,
            captadores_count: captadores.length,
            corretores_count: corretores.length,
          },
        },
      ])
    } else {
      console.warn(
        'Admin user marlon@eticimoveis.com.br not found. Could not insert email log due to not-null user_id constraint.',
      )
    }

    console.log(`[sendUnifiedDailyReport] Concluído. Email enviado para ${targetEmail}`)

    return new Response(
      JSON.stringify({
        success: true,
        results: {
          target: targetEmail,
          captadores: captadores.length,
          corretores: corretores.length,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    console.error('[sendUnifiedDailyReport] Erro geral:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
