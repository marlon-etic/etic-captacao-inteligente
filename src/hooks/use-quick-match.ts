import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export function useQuickMatchCount(propertyParams: {
  preco?: number
  endereco?: string
  tipo?: string
  tipo_imovel?: string
  dormitorios?: number
  vagas?: number
}) {
  const [count, setCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMatches() {
      if (!propertyParams.preco || !propertyParams.tipo || !propertyParams.tipo_imovel) {
        setCount(0)
        return
      }

      setLoading(true)
      try {
        let totalCount = 0

        const checkType = async (table: 'demandas_vendas' | 'demandas_locacao') => {
          let q = supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .in('status_demanda', ['aberta', 'em_andamento'])

          if (propertyParams.tipo_imovel) {
            q = q.ilike('tipo_imovel', `%${propertyParams.tipo_imovel}%`)
          }

          q = q.gte('valor_maximo', propertyParams.preco)

          if (propertyParams.dormitorios) {
            q = q.lte('dormitorios', propertyParams.dormitorios)
          }

          const { count, error } = await q
          if (error) {
            console.error('[useQuickMatchCount] Query Error:', error)
          }
          return count || 0
        }

        if (propertyParams.tipo === 'Venda' || propertyParams.tipo === 'Ambos') {
          totalCount += await checkType('demandas_vendas')
        }
        if (propertyParams.tipo === 'Locação' || propertyParams.tipo === 'Ambos') {
          totalCount += await checkType('demandas_locacao')
        }

        setCount(totalCount)
      } catch (e) {
        console.error('Error fetching match count', e)
        setCount(0)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(fetchMatches, 600)
    return () => clearTimeout(timer)
  }, [
    propertyParams.preco,
    propertyParams.endereco,
    propertyParams.tipo,
    propertyParams.tipo_imovel,
    propertyParams.dormitorios,
    propertyParams.vagas,
  ])

  return { count, loading }
}
