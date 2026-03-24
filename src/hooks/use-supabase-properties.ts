import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'

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
  const { users } = useAppStore()
  const usersRef = useRef(users)

  useEffect(() => {
    usersRef.current = users
  }, [users])

  const formatProperty = useCallback((p: any) => {
    const userMap = new Map((usersRef.current || []).map((u: any) => [u.id, u.name]))
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
  }, [])

  const fetchProperties = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) return

        const query = supabase
          .from('imoveis_captados')
          .select('*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*)')
          .order('created_at', { ascending: false })

        const { data, error } = await query
        if (error) throw error

        if (data) {
          let formatted = data.map(formatProperty)
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
    [filterType, formatProperty],
  )

  const fetchSingleProperty = useCallback(
    async (id: string) => {
      try {
        const { data } = await supabase
          .from('imoveis_captados')
          .select('*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*)')
          .eq('id', id)
          .single()

        if (data) {
          const formatted = formatProperty(data)
          if (!filterType || formatted.tipo === filterType) {
            setProperties((prev) => [formatted, ...prev.filter((p) => p.id !== formatted.id)])
          }
        }
      } catch (err) {
        console.error('Error fetching single property', err)
      }
    },
    [filterType, formatProperty],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchProperties()

    // Sincronização Bidirecional Direta (Otimizada sem polling)
    const channel = supabase
      .channel(`properties_realtime_${filterType || 'all'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          fetchSingleProperty(payload.new.id)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          setProperties((prev) =>
            prev.map((p) => (p.id === payload.new.id ? { ...p, ...payload.new } : p)),
          )
          // Refresh relations if demand link changed, though rare
          if (
            payload.old &&
            (payload.new.demanda_locacao_id !== payload.old.demanda_locacao_id ||
              payload.new.demanda_venda_id !== payload.old.demanda_venda_id)
          ) {
            fetchSingleProperty(payload.new.id)
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          setProperties((prev) => prev.filter((p) => p.id !== payload.old.id))
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [fetchProperties, fetchSingleProperty, filterType])

  return { properties, loading, refresh: () => fetchProperties(false) }
}
