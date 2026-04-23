import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'
import { getTiposVisiveis, normalizeTipo, isImovelVisivelParaRole } from '@/lib/roleFilters'

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
  etapa_funil?: string
  data_visita?: string
  data_fechamento?: string
}

export function useSupabaseProperties(filterType?: 'Venda' | 'Aluguel') {
  const [properties, setProperties] = useState<SupabaseCapturedPropertyWithDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const { users, currentUser } = useAppStore()
  const { fetchWithResilience } = useSmartSync()
  const usersRef = useRef(users)

  useEffect(() => {
    usersRef.current = users
  }, [users])

  const formatProperty = useCallback((p: any) => {
    const userMap = new Map((usersRef.current || []).map((u: any) => [u.id, u.name]))
    const d_loc = p.demanda_locacao
    const d_ven = p.demanda_venda
    const demanda = d_loc || d_ven

    // ✅ NORMALIZAR TIPO
    let tipo = p.tipo
    if (!tipo || tipo === 'Desconhecido') {
      tipo = d_loc ? 'Aluguel' : d_ven ? 'Venda' : 'Ambos'
    }
    const normalizedTipo = normalizeTipo(tipo)

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
      dormitorios: p.dormitorios || demanda?.dormitorios || 0,
      vagas: p.vagas || demanda?.vagas_estacionamento || 0,
      observacoes: p.observacoes || p.localizacao_texto || '',
      demanda: demanda
        ? {
            id: demanda.id,
            clientName: demanda.nome_cliente || demanda.cliente_nome,
            type: d_loc ? 'Aluguel' : 'Venda',
            createdBy: demanda.sdr_id || demanda.corretor_id,
          }
        : null,
      tipo: normalizedTipo, // ✅ USAR TIPO NORMALIZADO
      etapa_funil: p.etapa_funil,
      data_visita: p.data_visita,
      data_fechamento: p.data_fechamento,
    }
  }, [])

  const fetchProperties = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData } = await supabase.auth.getUser()
        if (!userData?.user) return

        const userRole = currentUser?.role
        const tipos = getTiposVisiveis(userRole)

        console.group('🔍 [FETCH PROPERTIES] Diagnóstico')
        console.log(
          '[FETCH] Role:',
          userRole,
          '| Tipos visíveis:',
          tipos,
          '| FilterType:',
          filterType,
        )

        let finalData: any[] = []

        // ✅ BUSCAR TODOS OS DADOS (SEM FILTRO NA QUERY)
        const { data: directData, error: directError } = await supabase
          .from('imoveis_captados')
          .select('*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*)')
          .order('created_at', { ascending: false })

        if (!directError && directData) {
          console.log('[FETCH] Direct query OK. Total imóveis:', directData.length)
          finalData = directData
        } else {
          console.log('[FETCH] Direct query falhou, usando fallback. Erro:', directError?.message)
          const data = await fetchWithResilience(`properties_${filterType || 'all'}`, async () => {
            const { data: resData, error } = await supabase
              .from('imoveis_captados')
              .select('*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*)')
              .order('created_at', { ascending: false })
            if (error) throw error
            return resData
          })
          finalData = data || []
        }

        console.log('[FETCH] Total imóveis carregados:', finalData.length)
        console.groupEnd()

        // ✅ FORMATAR TODOS OS IMÓVEIS
        let formatted = finalData.map(formatProperty)
        console.log('[FETCH] Imóveis formatados:', formatted.length)

        // ✅ FILTRAR POR ROLE (CRÍTICO!)
        formatted = formatted.filter((p) => {
          const isVisivel = isImovelVisivelParaRole(p.tipo, userRole)
          if (!isVisivel) {
            console.log(
              `[FETCH] ❌ ${p.codigo_imovel}: tipo="${p.tipo}" NÃO visível para role="${userRole}"`,
            )
          }
          return isVisivel
        })
        console.log('[FETCH] Após filtro de role:', formatted.length)

        // ✅ FILTRAR POR TIPO SE ESPECIFICADO
        if (filterType) {
          const normalizedFilterType = normalizeTipo(filterType)
          formatted = formatted.filter((f: any) => {
            const match = f.tipo === normalizedFilterType || f.tipo === 'Ambos'
            if (!match) {
              console.log(
                `[FETCH] ❌ ${f.codigo_imovel}: tipo="${f.tipo}" não corresponde a filterType="${filterType}"`,
              )
            }
            return match
          })
          console.log(`[FETCH] Após filtro de tipo "${filterType}":`, formatted.length)
        }

        setProperties(formatted)
      } catch (err: any) {
        console.error('[useSupabaseProperties] Erro:', err)
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [filterType, formatProperty, fetchWithResilience, currentUser?.role],
  )

  const fetchSingleProperty = useCallback(
    async (id: string) => {
      try {
        const userRole = currentUser?.role

        const { data: resData, error } = await supabase
          .from('imoveis_captados')
          .select('*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*)')
          .eq('id', id)
          .single()

        let data: any = null

        if (!error && resData) {
          data = resData
        } else {
          data = await fetchWithResilience(`property_${id}`, async () => {
            const { data: fallbackData, error: fallbackError } = await supabase
              .from('imoveis_captados')
              .select('*, demanda_locacao:demandas_locacao(*), demanda_venda:demandas_vendas(*)')
              .eq('id', id)
              .single()
            if (fallbackError) throw fallbackError
            return fallbackData
          })
        }

        if (data) {
          const formatted = formatProperty(data)

          // ✅ VALIDAR SE PROPRIEDADE É VISÍVEL PARA O ROLE
          if (!isImovelVisivelParaRole(formatted.tipo, userRole)) {
            console.log('[FETCH SINGLE] ❌ Propriedade não visível para role:', userRole)
            return
          }

          if (!filterType || formatted.tipo === filterType || formatted.tipo === 'Ambos') {
            setProperties((prev) => {
              const exists = prev.some((p) => p.id === formatted.id)
              if (exists) {
                return prev.map((p) => (p.id === formatted.id ? formatted : p))
              } else {
                return [formatted, ...prev].sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
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
    if (mounted) fetchProperties()

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
                        dormitorios: payload.new.dormitorios ?? p.dormitorios,
                        vagas: payload.new.vagas ?? p.vagas,
                        observacoes:
                          payload.new.observacoes || payload.new.localizacao_texto || p.observacoes,
                        etapa_funil: payload.new.etapa_funil || p.etapa_funil,
                        data_visita: payload.new.data_visita ?? p.data_visita,
                        data_fechamento: payload.new.data_fechamento ?? p.data_fechamento,
                        status_captacao: payload.new.status_captacao || p.status_captacao,
                        tipo: normalizeTipo(payload.new.tipo || p.tipo),
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
            console.log('🔴 [REALTIME] DELETE recebido:', payload.old.id)
            setSyncing(true)
            setProperties((prev) => prev.filter((p) => p.id !== payload.old.id))
            setTimeout(() => setSyncing(false), 500)
          },
        )
    },
    onFallbackPoll: () => fetchProperties(true),
  })

  return { properties, loading, syncing, refresh: () => fetchProperties(false) }
}
