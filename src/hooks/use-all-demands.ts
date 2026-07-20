import { useCallback, useMemo } from 'react'
import { useSupabaseDemands } from '@/hooks/use-supabase-demands'

export function useAllDemands(options?: {
  dateRange?: 'today' | '7days' | '30days' | 'all'
  statusFilter?: 'active' | 'inactive' | 'all'
}) {
  const locacao = useSupabaseDemands('Aluguel', options)
  const venda = useSupabaseDemands('Venda', options)

  const allDemands = useMemo(() => {
    return [...locacao.demands, ...venda.demands].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  }, [locacao.demands, venda.demands])

  const refresh = useCallback(() => {
    locacao.refresh()
    venda.refresh()
  }, [locacao, venda])

  return {
    demands: allDemands,
    loading: locacao.loading || venda.loading,
    refresh,
  }
}
