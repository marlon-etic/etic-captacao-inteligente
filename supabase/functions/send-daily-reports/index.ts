import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Interface mock para simular o serviço de email (ex: SendGrid, Resend)
async function sendEmailMock(options: { to: string; subject: string; html: string }) {
  console.log(`[EMAIL SENT] To: ${options.to} | Subject: ${options.subject}`);
  return true;
}

async function calculateYesterdayMetrics(supabase: any, userId: string, role: string) {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const today = new Date()

  const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate())

  const dateRange = {
    start: startOfYesterday.toISOString(),
    end: startOfToday.toISOString(),
  }

  const metrics: Record<string, number> = {}

  try {
    if (role === 'captador') {
      const { data: created } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'property_created')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      const { data: linked } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'property_linked')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      const { data: visited } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'property_visit_scheduled')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      const { data: closed } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'property_deal_closed')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      metrics.totalCaptured = created?.length || 0
      metrics.linkedProperties = linked?.length || 0
      metrics.freeProperties = (created?.length || 0) - (linked?.length || 0)
      metrics.visitedProperties = visited?.length || 0
      metrics.closedDeals = closed?.length || 0
      metrics.conversionRate = metrics.totalCaptured > 0 ? (metrics.closedDeals / metrics.totalCaptured) * 100 : 0
    } else if (role === 'sdr' || role === 'corretor') {
      const { data: created } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'demand_created')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      const { data: linked } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'demand_linked')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      const { data: visited } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'visit_scheduled')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      const { data: closed } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('event_type', 'deal_closed')
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      metrics.totalDemands = created?.length || 0
      metrics.linkedDemands = linked?.length || 0
      metrics.visitedProperties = visited?.length || 0
      metrics.closedDeals = closed?.length || 0
      metrics.conversionRate = metrics.totalDemands > 0 ? (metrics.closedDeals / metrics.totalDemands) * 100 : 0
    }
    return metrics
  } catch (err) {
    console.error('[calculateYesterdayMetrics] Error:', err)
    return {}
  }
}

function generateEmailHTML(name: string, role: string, metrics: Record<string, number>, baseUrl: string): string {
  const dashboardUrl = `${baseUrl}/app/analytics`

  let metricsHTML = ''

  if (role === 'captador') {
    metricsHTML = `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Imóveis Captados</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.totalCaptured || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Sob Demanda</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.linkedProperties || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Imóveis Livres</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.freeProperties || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Em Visita</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.visitedProperties || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Fechados</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center; color: #22c55e;">${metrics.closedDeals || 0}</td>
      </tr>
    `
  } else {
    metricsHTML = `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Demandas Cadastradas</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.totalDemands || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Com Imóveis Vinculados</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.linkedDemands || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Visitas Agendadas</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center;">${metrics.visitedProperties || 0}</td>
      </tr>
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5;">Negócios Fechados</td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e5e5; font-weight: bold; text-align: center; color: #22c55e;">${metrics.closedDeals || 0}</td>
      </tr>
    `
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #3b82f6 0%, #1e40af 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: white; padding: 30px; border: 1px solid #e5e5e5; border-radius: 0 0 8px 8px; }
        .metric-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .metric-table th { background: #f3f4f6; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #e5e5e5; }
        .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { background: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #666; border-top: 1px solid #e5e5e5; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Relatório Diário - GoScape</h1>
          <p>Resumo de atividades de ontem</p>
        </div>
        <div class="content">
          <p>Olá <strong>${name}</strong>,</p>
          <p>Aqui está o resumo das suas atividades no sistema GoScape de ontem:</p>
          
          <table class="metric-table">
            <thead>
              <tr>
                <th>Métrica</th>
                <th style="text-align: center;">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${metricsHTML}
            </tbody>
          </table>

          <div style="text-align: center;">
            <a href="${dashboardUrl}" class="button">Ver Detalhes Completos</a>
          </div>

          <p style="color: #666; font-size: 14px;">
            Este é um relatório automático. Para mais detalhes, acesse o dashboard de analytics no sistema.
          </p>
        </div>
        <div class="footer">
          <p>© 2026 GoScape. Todos os direitos reservados.</p>
          <p><a href="${baseUrl}/app/ajuda" style="color: #3b82f6; text-decoration: none;">Desinscrever-se</a></p>
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
        persistSession: false
      }
    })

    console.log('[sendDailyReports] Iniciando envio de relatórios diários')
    const baseUrl = 'https://etic-captacao-inteligente-86800.goskip.app'

    // Buscar usuários ativos
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, nome, role')
      .in('role', ['captador', 'sdr', 'corretor'])
      .eq('status', 'ativo')

    if (usersError) throw usersError

    let successCount = 0
    let failureCount = 0

    // Enviar emails e logar falhas robustamente
    for (const user of users || []) {
      try {
        if (!user.email) {
          console.warn(`[sendDailyReports] Usuário ${user.id} sem email`)
          failureCount++
          continue
        }

        const metrics = await calculateYesterdayMetrics(supabase, user.id, user.role)
        const htmlContent = generateEmailHTML(user.nome || 'Usuário', user.role, metrics, baseUrl)

        // Enviar email
        await sendEmailMock({
          to: user.email,
          subject: 'Relatório Diário - GoScape',
          html: htmlContent,
        })

        // Registrar sucesso
        await supabase.from('analytics_email_logs').insert([{
          user_id: user.id,
          status: 'sent',
          metrics_data: metrics,
        }])

        successCount++
      } catch (err: any) {
        console.error(`[sendDailyReports] Erro ao enviar para ${user.email}:`, err)

        // Registrar falha
        await supabase.from('analytics_email_logs').insert([{
          user_id: user.id,
          status: 'failed',
          error_message: err.message,
        }])

        failureCount++
      }
    }

    console.log(`[sendDailyReports] Concluído. Sucesso: ${successCount}, Falhas: ${failureCount}`)

    return new Response(JSON.stringify({ 
      success: true, 
      results: { successCount, failureCount }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})
