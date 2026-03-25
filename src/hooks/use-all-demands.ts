import { useCallback, useMemo } from 'react'
import { useSupabaseDemands } from '@/hooks/use-supabase-demands'

export function useAllDemands() {
  const locacao = useSupabaseDemands('Aluguel')
  const venda = useSupabaseDemands('Venda')

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
