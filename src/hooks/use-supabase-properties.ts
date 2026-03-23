import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface SupabaseCapturedPropertyWithDemand {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  user_captador_id: string
  created_at: string
  status_captacao: string
  captador_nome?: string
  bairros?: string[]
  dormitorios?: number
  vagas?: number
  observacoes?: string
  demanda?: any
  tipo?: string
}

export function useSupabaseProperties(filterType?: 'Venda' | 'Aluguel') {
  const [properties, setProperties] = useState<SupabaseCapturedPropertyWithDemand[]>([])
  const [loading, setLoading] = useState(true)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchProperties = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) return

        const { data: usersData } = await supabase.from('users').select('id, nome')
        const userMap = new Map((usersData || []).map((u: any) => [u.id, u.nome]))

        const query = supabase
          .from('imoveis_captados')
          .select(`
          *,
          demanda_locacao:demandas_locacao(*),
          demanda_venda:demandas_vendas(*)
        `)
          .order('created_at', { ascending: false })

        const { data, error } = await query
        if (error) throw error

        if (data) {
          let formatted = data.map((p: any) => {
            const d_loc = p.demanda_locacao
            const d_ven = p.demanda_venda
            const demanda = d_loc || d_ven
            const tipo = d_loc ? 'Aluguel' : d_ven ? 'Venda' : 'Desconhecido'

            return {
              id: p.id,
              codigo_imovel: p.codigo_imovel,
              endereco: p.endereco,
              preco: p.preco || p.valor || 0,
              user_captador_id: p.user_captador_id || p.captador_id,
              captador_nome: userMap.get(p.user_captador_id || p.captador_id) || 'Captador',
              created_at: p.created_at,
              status_captacao: p.status_captacao,
              bairros: demanda?.bairros || [],
              dormitorios: demanda?.dormitorios || 0,
              vagas: demanda?.vagas_estacionamento || 0,
              observacoes: p.localizacao_texto || p.observacoes || '',
              demanda: demanda
                ? {
                    id: demanda.id,
                    clientName: demanda.nome_cliente || demanda.cliente_nome,
                    type: tipo,
                    createdBy: demanda.sdr_id || demanda.corretor_id,
                  }
                : null,
              tipo,
            }
          })

          if (filterType) {
            formatted = formatted.filter((f: any) => f.tipo === filterType)
          }

          setProperties(formatted)
        }
      } catch (err: any) {
        console.error('[useSupabaseProperties]', err)
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [filterType],
  )

  const debouncedFetch = useCallback(
    (isBackground = true) => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = setTimeout(() => {
        fetchProperties(isBackground)
      }, 150) // Reduced to 150ms for near-instant real-time updates (< 1 second)
    },
    [fetchProperties],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchProperties()

    const channel = supabase
      .channel(`properties_realtime_view_${filterType || 'all'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imoveis_captados' }, () => {
        debouncedFetch(true)
      })
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    }
  }, [fetchProperties, debouncedFetch, filterType])

  return { properties, loading, refresh: () => fetchProperties(false) }
}
