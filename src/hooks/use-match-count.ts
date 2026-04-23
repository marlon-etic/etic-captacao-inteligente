import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useMatchCount(type: 'imovel' | 'demanda', id: string) {
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    const loadMatchCount = async () => {
      try {
        if (!id) return

        const column = type === 'imovel' ? 'imovel_id' : 'demanda_id'
        const { count: exactCount, error } = await supabase
          .from('matches_sugestoes')
          .select('id', { count: 'exact', head: true })
          .eq(column, id)
          .eq('status', 'pendente')

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
  }, [id, type])

  return { count, loading }
}
