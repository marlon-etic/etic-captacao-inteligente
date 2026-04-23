import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useUserRole } from '@/hooks/use-user-role'
import { getTiposVisiveis, normalizeTipo } from '@/lib/roleFilters'
import useAppStore from '@/stores/useAppStore'
import { useConsolidatedSync } from '@/hooks/useSmartSync'

export interface UltimoImovel {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  valor: number
  dormitorios: number
  vagas: number
  captador_nome: string
  created_at: string
  tipo: string
  has_demanda: boolean
  is_minha_demanda: boolean
  demanda_tipo: string | null
}

export function useUltimosImoveis(
  periodo: '24h' | '7d' | '30d' | 'todos',
  tipoFiltro: 'todos' | 'meus',
) {
  const [imoveis, setImoveis] = useState<UltimoImovel[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { role } = useUserRole()
  const { currentUser, users } = useAppStore()

  const fetchImoveis = useCallback(async () => {
    try {
      setLoading(true)
      const tiposVisiveis = getTiposVisiveis(role)

      let query = supabase
        .from('imoveis_captados')
        .select(
          '*, demanda_locacao:demandas_locacao(sdr_id), demanda_venda:demandas_vendas(corretor_id)',
        )
        .order('created_at', { ascending: false })
        .limit(100)

      if (periodo !== 'todos') {
        const date = new Date()
        if (periodo === '24h') date.setHours(date.getHours() - 24)
        if (periodo === '7d') date.setDate(date.getDate() - 7)
        if (periodo === '30d') date.setDate(date.getDate() - 30)
        query = query.gte('created_at', date.toISOString())
      }

      const { data, error } = await query

      if (error) throw error

      let result = (data || []).map((item) => {
        const d_loc = item.demanda_locacao
        const d_ven = item.demanda_venda
        const userMap = new Map((users || []).map((u: any) => [u.id, u.name]))

        const tipo = normalizeTipo(item.tipo, item.preco, item.valor)
        const isMinhaDemanda =
          (d_loc && (d_loc as any).sdr_id === currentUser?.id) ||
          (d_ven && (d_ven as any).corretor_id === currentUser?.id)

        return {
          id: item.id,
          codigo_imovel: item.codigo_imovel,
          endereco: item.endereco,
          preco: item.preco || 0,
          valor: item.valor || 0,
          dormitorios: item.dormitorios || 0,
          vagas: item.vagas || 0,
          captador_nome: userMap.get(item.user_captador_id || item.captador_id) || 'Captador',
          created_at: item.created_at,
          tipo,
          has_demanda: !!(d_loc || d_ven),
          is_minha_demanda: !!isMinhaDemanda,
          demanda_tipo: d_loc ? 'Aluguel' : d_ven ? 'Venda' : null,
        } as UltimoImovel
      })

      // Exibe apenas os imóveis condizentes com o Role
      result = result.filter((item) => tiposVisiveis.includes(item.tipo))

      if (tipoFiltro === 'meus') {
        result = result.filter((item) => item.is_minha_demanda)
      }

      setImoveis(result)
    } catch (error) {
      console.error('Error fetching ultimos imoveis:', error)
    } finally {
      setLoading(false)
    }
  }, [periodo, tipoFiltro, role, currentUser, users])

  useEffect(() => {
    fetchImoveis()
  }, [fetchImoveis])

  useConsolidatedSync({
    channelName: `ultimos_imoveis_realtime_${periodo}_${tipoFiltro}`,
    setupRealtime: (channel) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            console.log('[REALTIME] INSERT imoveis_captados (useUltimosImoveis):', payload)
            setSyncing(true)
            fetchImoveis().finally(() => {
              setTimeout(() => setSyncing(false), 500)
            })
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            console.log('[REALTIME] UPDATE imoveis_captados (useUltimosImoveis):', payload)
            setSyncing(true)
            fetchImoveis().finally(() => {
              setTimeout(() => setSyncing(false), 500)
            })
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            console.log('[REALTIME] DELETE imoveis_captados (useUltimosImoveis):', payload)
            setSyncing(true)
            fetchImoveis().finally(() => {
              setTimeout(() => setSyncing(false), 500)
            })
          },
        )
    },
    onFallbackPoll: () => fetchImoveis(),
  })

  return { imoveis, loading, syncing, refresh: fetchImoveis }
}
