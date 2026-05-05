import { supabase } from '@/lib/supabase/client'

/**
 * Dispara manualmente a Edge Function do Supabase responsável por calcular as métricas
 * e enviar os relatórios diários de email para todos os usuários.
 */
export async function triggerDailyReports() {
  try {
    console.log('[triggerDailyReports] Acionando Edge Function de relatórios...')

    const { data, error } = await supabase.functions.invoke('send-daily-reports', {
      method: 'POST',
    })

    if (error) throw error

    console.log('[triggerDailyReports] Sucesso:', data)
    return data
  } catch (err) {
    console.error('[triggerDailyReports] Erro ao acionar relatórios:', err)
    throw err
  }
}
