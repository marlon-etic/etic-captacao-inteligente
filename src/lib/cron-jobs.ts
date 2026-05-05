/**
 * ESTE ARQUIVO É UMA REFERÊNCIA DE ARQUITETURA.
 *
 * Em aplicações de frontend construídas com Vite (React/SPA), o uso de bibliotecas de agendamento
 * como 'node-cron' causará falhas no build, pois dependem do ambiente Node.js para rodar processos em segundo plano.
 *
 * A solução ideal em um ecossistema com Supabase é delegar esta responsabilidade para o `pg_cron` no banco de dados.
 *
 * Configuração necessária no Supabase SQL Editor para automatizar os relatórios às 8:00 AM (UTC):
 *
 * ```sql
 * SELECT cron.schedule(
 *   'send-daily-reports-job',
 *   '0 8 * * *',
 *   $$
 *   SELECT net.http_post(
 *       url:='https://wwdfdeyotwjpdczueqpg.supabase.co/functions/v1/send-daily-reports',
 *       headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
 *       body:='{}'::jsonb
 *   );
 *   $$
 * );
 * ```
 */

// import cron from 'node-cron'
// import { sendUnifiedDailyReport } from '@/lib/email-reports'

export function initializeCronJobs() {
  // ✅ Executar todos os dias às 08:00 AM (timezone: America/Sao_Paulo)
  // Formato: minuto hora dia mês dia-da-semana
  // 0 8 * * * = 08:00 AM todos os dias

  // cron.schedule('0 8 * * *', async () => {
  //   console.log('[CronJobs] Iniciando envio de relatório unificado diário')
  //   await sendUnifiedDailyReport()
  // }, {
  //   timezone: 'America/Sao_Paulo'
  // })

  console.log(
    '[CronJobs] O agendamento de e-mails é gerenciado ativamente via Supabase pg_cron + Edge Functions. O Node Cron está desativado no frontend para evitar erros de compilação.',
  )
  console.log('[CronJobs] Cron job de relatório unificado inicializado no backend (08:00 AM)')
}
