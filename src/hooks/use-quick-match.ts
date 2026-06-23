import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { calculateMatching, ImovelForMatching } from '@/lib/matching'

export interface QuickMatchClient {
  id: string
  nome: string
}

export function useQuickMatchCount(propertyParams: ImovelForMatching & { tipo?: string }) {
  const [count, setCount] = useState<number | null>(null)
  const [matchedClients, setMatchedClients] = useState<QuickMatchClient[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function fetchMatches() {
      if (!propertyParams.preco || !propertyParams.tipo || !propertyParams.tipo_imovel) {
        setCount(0)
        setMatchedClients([])
        return
      }

      setLoading(true)
      try {
        let clients: QuickMatchClient[] = []

        // Calls the synchronized RPC function that uses the exact same logic as 'Vincular Demanda'
        const { data, error } = await supabase.rpc('get_quick_matches', {
          p_endereco: propertyParams.endereco || '',
          p_preco: propertyParams.preco || 0,
          p_dormitorios: propertyParams.dormitorios || 0,
          p_vagas: propertyParams.vagas || 0,
          p_tipo: propertyParams.tipo || 'Ambos',
          p_tipo_imovel: propertyParams.tipo_imovel || '',
        })

        if (error) {
          console.error('[useQuickMatchCount] RPC Error:', error)
          setCount(0)
          setMatchedClients([])
          return
        }

        // De-duplicate in case a client has multiple demands matching
        const uniqueClients = Array.from(
          new Map((data || []).map((c: any) => [c.id, c])).values(),
        ) as QuickMatchClient[]

        setCount(uniqueClients.length)
        setMatchedClients(uniqueClients)
      } catch (e) {
        console.error('Error fetching match count', e)
        setCount(0)
        setMatchedClients([])
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

  return { count, matchedClients, loading }
}
