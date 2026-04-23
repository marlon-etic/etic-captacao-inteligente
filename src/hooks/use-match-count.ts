import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { getTiposVisiveis } from '@/lib/roleFilters'

export function useMatchCount(type: 'imovel' | 'demanda', id: string) {
  const { role } = useUserRole()
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadMatchCount = async () => {
      try {
        if (!id) return

        const tipos = getTiposVisiveis(role)
        const column = type === 'imovel' ? 'imovel_id' : 'demanda_id'

        const { count: exactCount, error } = await supabase
          .from('matches_sugestoes')
          .select('id, imoveis_captados!inner(id, tipo)', { count: 'exact', head: true })
          .eq(column, id)
          .eq('status', 'pendente')
          .in('imoveis_captados.tipo', tipos)

        if (!error && isMounted) {
          setCount(exactCount || 0)
        }
      } catch (err) {
        console.error('[MATCH COUNT] Erro:', err)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadMatchCount()
    const interval = setInterval(loadMatchCount, 30000)

    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [id, type, role])

  return { count, loading }
}
