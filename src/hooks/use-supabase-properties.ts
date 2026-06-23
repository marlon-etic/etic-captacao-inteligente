import * as React from 'react'
const { useEffect, useState, useCallback, useRef } = React
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'
import { getTiposVisiveis, normalizeTipo, isImovelVisivelParaRole } from '@/lib/roleFilters'
import { toast } from '@/components/ui/use-toast'

export interface SupabaseCapturedPropertyWithDemand {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  valor: number
  user_captador_id: string
  created_at: string
  updated_at?: string
  status_captacao: string
  captador_nome?: string
  bairros?: string[]
  dormitorios?: number
  vagas?: number
  observacoes?: string
  demanda?: any
  tipo?: string
  etapa_funil?: string
  data_visita?: string
  data_fechamento?: string
}

const extractNumber = (str: string): number | null => {
  if (!str) return null
  let val = str.replace(/[R$\s]/g, '')
  let multiplier = 1
  if (val.toLowerCase().includes('k')) {
    multiplier = 1000
    val = val.replace(/k/i, '')
  } else if (val.toLowerCase().includes('m')) {
    multiplier = 1000000
    val = val.replace(/m/i, '')
  }
  val = val.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(val)
  return isNaN(num) ? null : num * multiplier
}

const parsePriceFilter = (label: string) => {
  if (!label || typeof label !== 'string') return null

  const isLocacao = label.startsWith('L:')
  const isVenda = label.startsWith('V:')

  if (!isLocacao && !isVenda) return null

  let cleanLabel = label.replace(/^(L:|V:)\s*/i, '').trim()
  let min = 0
  let max = 999999999

  if (cleanLabel.toLowerCase().includes('até')) {
    const num = extractNumber(cleanLabel.replace(/até/i, ''))
    if (num !== null) max = num
  } else if (cleanLabel.toLowerCase().includes('acima') || cleanLabel.includes('+')) {
    const num = extractNumber(cleanLabel.replace(/acima de/i, '').replace('+', ''))
    if (num !== null) min = num
  } else if (cleanLabel.includes('-')) {
    const parts = cleanLabel.split('-')
    const num1 = extractNumber(parts[0] || '')
    const num2 = extractNumber(parts[1] || '')
    if (num1 !== null) min = num1
    if (num2 !== null) max = num2
  } else {
    const num = extractNumber(cleanLabel)
    if (num !== null) {
      min = num
      max = num
    }
  }

  return { isLocacao, isVenda, min, max }
}

export function useSupabaseProperties(
  filterType?: 'Venda' | 'Aluguel' | 'Ambos' | string,
  options?: { onlyMine?: boolean; pageSize?: number },
) {
  const [properties, setProperties] = useState<SupabaseCapturedPropertyWithDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const { currentUser } = useAppStore()
  const { fetchWithResilience } = useSmartSync()

  const formatProperty = useCallback((p: any) => {
    const d_loc = p.demanda_locacao
    const d_ven = p.demanda_venda
    const demanda = d_loc || d_ven

    const normalizedTipo = normalizeTipo(p.tipo, p.preco, p.valor)
    const captador_nome = p.captador_rel?.nome || p.captador_rel?.email || 'Captador'

    return {
      id: p.id,
      codigo_imovel: p.codigo_imovel,
      endereco: p.endereco,
      preco: p.preco || 0,
      valor: p.valor || 0,
      user_captador_id: p.user_captador_id || p.captador_id,
      captador_nome: captador_nome,
      created_at: p.created_at,
      updated_at: p.updated_at,
      status_captacao: p.status_captacao,
      bairros: demanda?.bairros || [],
      dormitorios: p.dormitorios || demanda?.dormitorios || 0,
      vagas: p.vagas || demanda?.vagas_estacionamento || 0,
      observacoes: p.observacoes || p.localizacao_texto || '',
      demanda: demanda
        ? {
            id: demanda.id,
            clientName: demanda.nome_cliente || demanda.cliente_nome,
            type: d_loc ? 'Aluguel' : 'Venda',
            createdBy: demanda.sdr_id || demanda.corretor_id,
            status_demanda: demanda.status_demanda,
          }
        : null,
      tipo: normalizedTipo,
      etapa_funil: p.etapa_funil,
      data_visita: p.data_visita,
      data_fechamento: p.data_fechamento,
    }
  }, [])

  const fetchProperties = useCallback(
    async (isBackground = false, currentPage = 1) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) return

        const userRole = currentUser?.role

        let finalData: any[] = []

        const pageSize = options?.pageSize || 20
        const limit = pageSize * currentPage

        let query = supabase
          .from('imoveis_captados')
          .select(
            'id, codigo_imovel, endereco, preco, valor, user_captador_id, captador_id, created_at, updated_at, status_captacao, dormitorios, vagas, observacoes, localizacao_texto, tipo, etapa_funil, data_visita, data_fechamento, demanda_locacao:demandas_locacao(id, nome_cliente, cliente_nome, sdr_id, bairros, dormitorios, vagas_estacionamento, status_demanda), demanda_venda:demandas_vendas(id, nome_cliente, cliente_nome, corretor_id, bairros, dormitorios, vagas_estacionamento, status_demanda), captador_rel:users!fk_imoveis_captador(nome, email)',
            { count: 'exact' },
          )
          .order('updated_at', { ascending: false, nullsFirst: false })

        if (options?.onlyMine && currentUser?.id) {
          query = query.eq('user_captador_id', currentUser.id)
        }

        const priceFilter = filterType ? parsePriceFilter(filterType) : null
        if (priceFilter) {
          if (priceFilter.isLocacao) {
            query = query
              .in('tipo', ['Locação', 'Aluguel', 'Ambos'])
              .gte('valor', priceFilter.min)
              .lte('valor', priceFilter.max)
          } else if (priceFilter.isVenda) {
            query = query
              .in('tipo', ['Venda', 'Ambos'])
              .gte('preco', priceFilter.min)
              .lte('preco', priceFilter.max)
          }
        }

        query = query.range(0, limit - 1)

        const { data: directData, error: directError, count } = await query

        if (!directError && directData) {
          finalData = directData
          setHasMore(count !== null && count > finalData.length)
        } else {
          const res = await fetchWithResilience(
            `properties_${filterType || 'all'}_${currentPage}_${options?.onlyMine}`,
            async () => {
              const fallback = await query
              if (fallback.error) throw fallback.error
              return fallback
            },
          )
          finalData = res?.data || []
          setHasMore(res?.count !== null && res?.count > finalData.length)
        }

        let formatted = finalData.map(formatProperty)

        // Aplica os filtros de perfil (Role Based Visibility)
        formatted = formatted.filter((p) => {
          return isImovelVisivelParaRole(p.tipo, userRole)
        })

        // Aplica o filtro selecionado pelo dropdown na UI (Venda/Aluguel) se existir
        if (filterType && filterType !== ('Todos' as any)) {
          if (priceFilter) {
            formatted = formatted.filter((f: any) => {
              const fTipo = f.tipo ? f.tipo.toLowerCase() : ''
              const isL = fTipo === 'locação' || fTipo === 'aluguel' || fTipo === 'ambos'
              const isV = fTipo === 'venda' || fTipo === 'ambos'

              if (priceFilter.isLocacao && isL) {
                const val = f.valor || 0
                return val >= priceFilter.min && val <= priceFilter.max
              } else if (priceFilter.isVenda && isV) {
                const val = f.preco || 0
                return val >= priceFilter.min && val <= priceFilter.max
              }
              return false
            })
          } else {
            const normalizedFilterType = normalizeTipo(filterType)
            formatted = formatted.filter((f: any) => {
              return f.tipo === normalizedFilterType || f.tipo === 'Ambos'
            })
          }
        }

        setProperties(formatted)
      } catch (err: any) {
        console.error('[useSupabaseProperties] Erro:', err)
        if (
          err.code === 'PGRST301' ||
          err.code === '42501' ||
          err.message?.toLowerCase().includes('permission')
        ) {
          window.dispatchEvent(new CustomEvent('navigate-to', { detail: '/app' }))
          toast({
            title: 'Erro de Permissão',
            description: 'Você não tem acesso a esta visualização. Redirecionando...',
            variant: 'destructive',
          })
        } else if (!isBackground) {
          toast({
            title: 'Erro ao carregar imóveis',
            description: 'Houve uma falha na consulta. Tentando novamente em background...',
            variant: 'destructive',
          })
        }
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [
      filterType,
      formatProperty,
      fetchWithResilience,
      currentUser?.role,
      currentUser?.id,
      options?.onlyMine,
      options?.pageSize,
    ],
  )

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return
    const nextPage = page + 1
    setPage(nextPage)
    fetchProperties(true, nextPage)
  }, [hasMore, loading, page, fetchProperties])

  const fetchSingleProperty = useCallback(
    async (id: string) => {
      try {
        const userRole = currentUser?.role

        const { data: resData, error } = await supabase
          .from('imoveis_captados')
          .select(
            '*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*), captador_rel:users!fk_imoveis_captador(nome, email)',
          )
          .eq('id', id)
          .single()

        let data: any = null

        if (!error && resData) {
          data = resData
        } else {
          data = await fetchWithResilience(`property_${id}`, async () => {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('imoveis_captados')
              .select(
                'id, codigo_imovel, endereco, preco, valor, user_captador_id, captador_id, created_at, updated_at, status_captacao, dormitorios, vagas, observacoes, localizacao_texto, tipo, etapa_funil, data_visita, data_fechamento, demanda_locacao:demandas_locacao(id, nome_cliente, cliente_nome, sdr_id, bairros, dormitorios, vagas_estacionamento, status_demanda), demanda_venda:demandas_vendas(id, nome_cliente, cliente_nome, corretor_id, bairros, dormitorios, vagas_estacionamento, status_demanda), captador_rel:users!fk_imoveis_captador(nome, email)',
              )
              .eq('id', id)
              .single()
            if (fallbackError) throw fallbackError
            return fallbackData
          })
        }

        if (data) {
          const formatted = formatProperty(data)

          if (!isImovelVisivelParaRole(formatted.tipo, userRole)) {
            return
          }

          const priceFilter = filterType ? parsePriceFilter(filterType) : null

          let shouldAdd = false
          if (priceFilter) {
            const fTipo = formatted.tipo ? formatted.tipo.toLowerCase() : ''
            const isL = fTipo === 'locação' || fTipo === 'aluguel' || fTipo === 'ambos'
            const isV = fTipo === 'venda' || fTipo === 'ambos'

            if (priceFilter.isLocacao && isL) {
              const val = formatted.valor || 0
              if (val >= priceFilter.min && val <= priceFilter.max) shouldAdd = true
            } else if (priceFilter.isVenda && isV) {
              const val = formatted.preco || 0
              if (val >= priceFilter.min && val <= priceFilter.max) shouldAdd = true
            }
          } else if (
            !filterType ||
            filterType === ('Todos' as any) ||
            formatted.tipo === filterType ||
            formatted.tipo === 'Ambos'
          ) {
            shouldAdd = true
          }

          if (shouldAdd) {
            setProperties((prev) => {
              const exists = prev.some((p) => p.id === formatted.id)
              if (exists) {
                return prev.map((p) => (p.id === formatted.id ? formatted : p))
              } else {
                return [formatted, ...prev].sort(
                  (a, b) =>
                    new Date(b.updated_at || b.created_at).getTime() -
                    new Date(a.updated_at || a.created_at).getTime(),
                )
              }
            })
          }
        }
      } catch (err) {
        console.error('Error fetching single property', err)
      }
    },
    [filterType, formatProperty, fetchWithResilience, currentUser?.role],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchProperties(false, page)

    const handleGlobalDelete = (e: CustomEvent) => {
      const deletedId = e.detail?.id
      if (deletedId) {
        setProperties((prev) => prev.filter((p) => p.id !== deletedId))
      }
    }

    const handleForceRefresh = () => {
      fetchProperties(false)
    }

    window.addEventListener('global-delete-imovel', handleGlobalDelete as EventListener)
    window.addEventListener('force-refresh-data', handleForceRefresh)

    return () => {
      mounted = false
      window.removeEventListener('global-delete-imovel', handleGlobalDelete as EventListener)
      window.removeEventListener('force-refresh-data', handleForceRefresh)
    }
  }, [fetchProperties])

  useConsolidatedSync({
    channelName: `properties_realtime_${filterType || 'all'}`,
    setupRealtime: (channel) => {
      channel
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            console.log('[REALTIME] INSERT imoveis_captados (useSupabaseProperties):', payload)
            setSyncing(true)
            fetchSingleProperty(payload.new.id).finally(() => {
              setTimeout(() => setSyncing(false), 500)
            })
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            console.log('[REALTIME] UPDATE imoveis_captados (useSupabaseProperties):', payload)
            setSyncing(true)
            if (
              payload.old &&
              (payload.new.demanda_locacao_id !== payload.old.demanda_locacao_id ||
                payload.new.demanda_venda_id !== payload.old.demanda_venda_id)
            ) {
              fetchSingleProperty(payload.new.id).finally(() => {
                setTimeout(() => setSyncing(false), 500)
              })
            } else {
              setProperties((prev) => {
                if (!prev.some((p) => p.id === payload.new.id)) {
                  fetchSingleProperty(payload.new.id)
                  return prev
                }

                return prev.map((p) =>
                  p.id === payload.new.id
                    ? {
                        ...p,
                        codigo_imovel: payload.new.codigo_imovel || p.codigo_imovel,
                        endereco: payload.new.endereco || p.endereco,
                        preco: payload.new.preco || payload.new.valor || p.preco,
                        valor: payload.new.valor || p.valor,
                        dormitorios: payload.new.dormitorios ?? p.dormitorios,
                        vagas: payload.new.vagas ?? p.vagas,
                        observacoes:
                          payload.new.observacoes || payload.new.localizacao_texto || p.observacoes,
                        etapa_funil: payload.new.etapa_funil || p.etapa_funil,
                        data_visita: payload.new.data_visita ?? p.data_visita,
                        data_fechamento: payload.new.data_fechamento ?? p.data_fechamento,
                        status_captacao: payload.new.status_captacao || p.status_captacao,
                        tipo: normalizeTipo(
                          payload.new.tipo || p.tipo,
                          payload.new.preco || p.preco,
                          payload.new.valor || p.valor,
                        ),
                      }
                    : p,
                )
              })
              setTimeout(() => setSyncing(false), 500)
            }
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            console.log('[REALTIME] DELETE imoveis_captados (useSupabaseProperties):', payload)
            setSyncing(true)
            setProperties((prev) => prev.filter((p) => p.id !== payload.old.id))
            setTimeout(() => setSyncing(false), 500)
          },
        )
    },
    onFallbackPoll: () => fetchProperties(true),
  })

  return {
    properties,
    loading,
    syncing,
    refresh: () => fetchProperties(false, page),
    hasMore,
    loadMore,
  }
}
