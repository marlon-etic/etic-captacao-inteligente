import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { getTiposVisiveis } from '@/lib/roleFilters'

export function useBatchedMatchCounts(demandIds: string[]) {
  const { role } = useUserRole()
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const idsRef = useRef<string[]>(demandIds)
  const reloadRef = useRef<() => void>(() => {})

  useEffect(() => {
    idsRef.current = demandIds
  }, [demandIds])

  useEffect(() => {
    let isMounted = true

    const loadCounts = async () => {
      const currentIds = idsRef.current
      if (!currentIds.length) {
        setCounts({})
        setLoading(false)
        return
      }

      try {
        const tipos = getTiposVisiveis(role)
        const { data, error } = await supabase
          .from('matches_sugestoes')
          .select('demanda_id, imoveis_captados!inner(id, tipo)')
          .in('demanda_id', currentIds)
          .eq('status', 'pendente')
          .in('imoveis_captados.tipo', tipos)

        if (!error && isMounted && data) {
          const countMap: Record<string, number> = {}
          for (const row of data as any[]) {
            const did = row.demanda_id
            countMap[did] = (countMap[did] || 0) + 1
          }
          setCounts(countMap)
        }
      } catch (err) {
        console.error('[BATCHED MATCH COUNT] Erro:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    reloadRef.current = loadCounts
    loadCounts()

    const channel = supabase
      .channel('batched_match_counts_shared')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches_sugestoes' }, () => {
        if (isMounted) loadCounts()
      })
      .subscribe()

    const interval = setInterval(loadCounts, 60000)

    return () => {
      isMounted = false
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [role])

  useEffect(() => {
    reloadRef.current()
  }, [demandIds.join(',')])

  return { counts, loading }
}
