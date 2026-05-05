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

export function initializeCronJobs() {
  console.log(
    '[CronJobs] O agendamento de e-mails é gerenciado ativamente via Supabase pg_cron + Edge Functions.',
  )
}
