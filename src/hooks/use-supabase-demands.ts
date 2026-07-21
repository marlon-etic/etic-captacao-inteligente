import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { toast } from '@/hooks/use-toast'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'

export interface SupabaseCapturedProperty {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  user_captador_id: string
  created_at: string
  updated_at?: string
  status_captacao: string
  captador_nome?: string
  etapa_funil?: string
  data_visita?: string
  data_fechamento?: string
  dormitorios?: number
  vagas?: number
  observacoes?: string
}

export interface SupabasePrazo {
  id: string
  prazo_resposta: string
  prorrogacoes_usadas: number
  status: string
  captador_id?: string
}

export interface SupabaseDemand {
  id: string
  nome_cliente: string
  bairros: string[]
  valor_minimo: number
  valor_maximo: number
  nivel_urgencia: string
  status_demanda: string
  db_status_demanda?: string
  created_at: string
  updated_at?: string
  tipo: 'Aluguel' | 'Venda'
  imoveis_captados: SupabaseCapturedProperty[]
  respostas_captador?: any[]
  prazos_captacao?: SupabasePrazo[]
  telefone?: string
  email?: string
  dormitorios?: number
  vagas_estacionamento?: number
  observacoes?: string
  tipo_imovel?: string
  is_prioritaria?: boolean
  sdr_id?: string
  corretor_id?: string
  vinculacao_captador_id?: string
  captadores_busca?: any[]
  links_sugeridos?: string[]
}

export function useSupabaseDemands(
  type: 'Aluguel' | 'Venda',
  options?: {
    onlyMine?: boolean
    dateRange?: 'today' | '7days' | '30days' | 'all'
    statusFilter?: 'active' | 'inactive' | 'all'
  },
) {
  const [demands, setDemands] = useState<SupabaseDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const { users, currentUser } = useAppStore()
  const { fetchWithResilience } = useSmartSync()

  const PAGE_SIZE = 20
  const offsetRef = useRef(0)
  const usersRef = useRef(users)
  const currentUserRef = useRef(currentUser)
  const userIdRef = useRef<string | null>(null)

  useEffect(() => {
    usersRef.current = users
  }, [users])

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  const sortDemands = useCallback((list: SupabaseDemand[]) => {
    return [...list].sort((a, b) => {
      if (a.is_prioritaria && !b.is_prioritaria) return -1
      if (!a.is_prioritaria && b.is_prioritaria) return 1
      return (
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      )
    })
  }, [])

  const evalStatusDemanda = useCallback((dbStatus: string, respostas: any[]) => {
    let st = dbStatus || 'aberta'
    if (
      currentUserRef.current?.role === 'captador' &&
      (st === 'aberta' || st === 'sem_resposta_24h' || st === 'prioritaria')
    ) {
      const myResp = respostas.find(
        (r: any) =>
          r.captador_id === currentUserRef.current?.id &&
          (r.resposta === 'nao_encontrei' || r.resposta === 'perdido'),
      )
      if (
        myResp &&
        (myResp.resposta === 'perdido' ||
          (myResp.motivo !== 'Buscando outras opções' &&
            !myResp.observacao?.includes('[CONTINUA_BUSCANDO]')))
      ) {
        st = 'localmente_perdida'
      }
    }
    return st
  }, [])

  const formatData = useCallback(
    (data: any[]) => {
      const userMap = new Map((usersRef.current || []).map((u) => [u.id, u.name]))

      return data.map((d: any) => {
        const respostas = (d.respostas_captador || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )

        const dbStatus = d.status_demanda || 'aberta'
        const st = evalStatusDemanda(dbStatus, respostas)

        return {
          id: d.id,
          nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
          telefone: d.telefone || '',
          email: d.email || '',
          bairros: d.bairros || d.localizacoes || [],
          valor_minimo: d.valor_minimo || 0,
          valor_maximo: d.valor_maximo || d.orcamento_max || 0,
          dormitorios: d.dormitorios || 0,
          vagas_estacionamento: d.vagas_estacionamento || 0,
          observacoes: d.observacoes || d.necessidades_especificas || '',
          tipo_imovel: d.tipo_imovel || 'Casa',
          nivel_urgencia: d.nivel_urgencia || d.urgencia || 'Média',
          db_status_demanda: dbStatus,
          status_demanda: st,
          is_prioritaria: d.is_prioritaria || false,
          created_at: d.created_at || new Date().toISOString(),
          updated_at: d.updated_at,
          tipo: type,
          sdr_id: d.sdr_id,
          corretor_id: d.corretor_id,
          vinculacao_captador_id: d.vinculacao_captador_id,
          captadores_busca: d.captadores_busca || [],
          links_sugeridos: (d.links_sugeridos as string[]) || [],
          respostas_captador: respostas,
          prazos_captacao: d.prazos_captacao || [],
          imoveis_captados: (d.imoveis_captados || [])
            .map((i: any) => ({
              ...i,
              captador_nome: userMap.get(i.user_captador_id || i.captador_id) || 'Captador',
              updated_at: i.updated_at,
              etapa_funil: i.etapa_funil || 'capturado',
              data_visita: i.data_visita,
              data_fechamento: i.data_fechamento,
              dormitorios: i.dormitorios,
              vagas: i.vagas,
              observacoes: i.observacoes || i.localizacao_texto,
            }))
            .sort(
              (a: any, b: any) =>
                new Date(b.updated_at || b.created_at).getTime() -
                new Date(a.updated_at || a.created_at).getTime(),
            ),
        }
      })
    },
    [type, evalStatusDemanda],
  )

  const fetchDemands = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData?.user) return

        userIdRef.current = userData.user.id

        // Prevent SDR from loading Venda, and Corretor from loading Aluguel
        const role = currentUserRef.current?.role
        if (role === 'sdr' && type === 'Venda') {
          setDemands([])
          setLoading(false)
          return
        }
        if ((role === 'corretor' || role === 'broker') && type === 'Aluguel') {
          setDemands([])
          setLoading(false)
          return
        }

        const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

        const cacheKey = `demands_cache_${type}`
        if (!isBackground) {
          const cached = sessionStorage.getItem(cacheKey)
          if (cached) {
            const parsed = JSON.parse(cached)
            setDemands(sortDemands(formatData(parsed)))
            setLoading(false)
          }
        }

        const data = await fetchWithResilience(`demands_${type}_${options?.onlyMine}`, async () => {
          const selectFields =
            type === 'Aluguel'
              ? 'id, nome_cliente, cliente_nome, telefone, email, bairros, localizacoes, valor_minimo, valor_maximo, orcamento_max, dormitorios, vagas_estacionamento, observacoes, tipo_imovel, nivel_urgencia, urgencia, status_demanda, is_prioritaria, created_at, updated_at, sdr_id, vinculacao_captador_id, captadores_busca, links_sugeridos, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at), respostas_captador(id, captador_id, resposta, motivo, observacao, created_at), prazos_captacao(id, prazo_resposta, prorrogacoes_usadas, status)'
              : 'id, nome_cliente, cliente_nome, telefone, email, bairros, localizacoes, valor_minimo, valor_maximo, orcamento_max, dormitorios, vagas_estacionamento, necessidades_especificas, tipo_imovel, nivel_urgencia, urgencia, status_demanda, is_prioritaria, created_at, updated_at, corretor_id, vinculacao_captador_id, captadores_busca, links_sugeridos, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at), respostas_captador(id, captador_id, resposta, motivo, observacao, created_at), prazos_captacao(id, prazo_resposta, prorrogacoes_usadas, status)'

          let query = supabase
            .from(table)
            .select(selectFields)
            .order('updated_at', { ascending: false, nullsFirst: false })
            .limit(PAGE_SIZE)

          if (options?.onlyMine && userIdRef.current) {
            if (type === 'Aluguel') {
              query = query.eq('sdr_id', userIdRef.current)
            } else {
              query = query.eq('corretor_id', userIdRef.current)
            }
          }

          if (options?.dateRange && options.dateRange !== 'all') {
            const now = new Date()
            let threshold: Date
            if (options.dateRange === 'today') {
              threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            } else if (options.dateRange === '7days') {
              threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            } else {
              threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            }
            query = query.gte('created_at', threshold.toISOString())
          }

          if (options?.statusFilter && options.statusFilter !== 'all') {
            if (options.statusFilter === 'active') {
              query = query.not(
                'status_demanda',
                'in',
                '("perdida","PERDIDA_BAIXA","impossivel","perdido")',
              )
            } else {
              query = query.in('status_demanda', [
                'perdida',
                'PERDIDA_BAIXA',
                'impossivel',
                'perdido',
              ])
            }
          }

          const { data: resData, error } = await query
          if (error) throw error

          if (resData && resData.length > 0) {
            const demandIds = resData.map((d: any) => d.id)
            const { data: matches } = await supabase
              .from('imovel_demand_match')
              .select(
                'demanda_id, imovel_id, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at)',
              )
              .in('demanda_id', demandIds)

            if (matches) {
              matches.forEach((match) => {
                const demand = resData.find((d: any) => d.id === match.demanda_id)
                if (demand && match.imoveis_captados) {
                  demand.imoveis_captados = demand.imoveis_captados || []
                  if (
                    !demand.imoveis_captados.some((i: any) => i.id === match.imoveis_captados.id)
                  ) {
                    demand.imoveis_captados.push(match.imoveis_captados)
                  }
                }
              })
            }
          }

          return resData
        })

        if (data) {
          setHasMore(data.length >= PAGE_SIZE)
          offsetRef.current = PAGE_SIZE
          sessionStorage.setItem(cacheKey, JSON.stringify(data))
          setDemands((prev) => {
            const fetchedFormatted = formatData(data)
            const fetchedIds = new Set(fetchedFormatted.map((f) => f.id))
            const recentLocal = prev.filter(
              (p) => !fetchedIds.has(p.id) && Date.now() - new Date(p.created_at).getTime() < 5000,
            )
            return sortDemands([...recentLocal, ...fetchedFormatted])
          })
        }
      } catch (err: any) {
        if (!isBackground) console.error('Erro ao carregar demandas', err)
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [type, formatData, sortDemands, fetchWithResilience, options?.dateRange, options?.statusFilter],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchDemands()

    const handleGlobalDeleteImovel = (e: CustomEvent) => {
      const deletedId = e.detail?.id
      if (deletedId) {
        setDemands((prev) =>
          prev.map((d) => {
            if (d.imoveis_captados && d.imoveis_captados.some((i: any) => i.id === deletedId)) {
              const newImoveis = d.imoveis_captados.filter((i: any) => i.id !== deletedId)

              let newStatus = d.db_status_demanda || d.status_demanda
              const hasClosed = newImoveis.some((i: any) => i.etapa_funil === 'fechado')
              if (!hasClosed && newStatus === 'ganho') {
                newStatus = newImoveis.length > 0 ? 'atendida' : 'aberta'
              }
              if (newImoveis.length === 0 && newStatus === 'atendida') {
                newStatus = 'aberta'
              }
              const st = evalStatusDemanda(newStatus, d.respostas_captador || [])

              return {
                ...d,
                db_status_demanda: newStatus,
                status_demanda: st,
                imoveis_captados: newImoveis,
              }
            }
            return d
          }),
        )
      }
    }

    const handleForceRefresh = () => {
      fetchDemands(false)
    }

    window.addEventListener('global-delete-imovel', handleGlobalDeleteImovel as EventListener)
    window.addEventListener('force-refresh-data', handleForceRefresh)

    const handleDemandaUpdated = (e: CustomEvent) => {
      if (e.detail?.tipo === type && e.detail?.data) {
        const d = e.detail.data
        setDemands((prev) => {
          if (
            !prev.some((x) => x.id === d.id) &&
            (d.status_demanda === 'aberta' ||
              d.status_demanda === 'prioritaria' ||
              d.status_demanda === 'atendida' ||
              d.status_demanda === 'PERDIDA_BAIXA' ||
              d.status_demanda === 'localmente_perdida')
          ) {
            const newDemand = formatData([
              { ...d, imoveis_captados: [], respostas_captador: [], prazos_captacao: [] },
            ])[0]
            return sortDemands([newDemand, ...prev])
          }

          return sortDemands(
            prev.map((x) => {
              if (x.id === d.id) {
                const newRespostas = d.respostas_captador || x.respostas_captador || []
                const dbStatus =
                  d.db_status_demanda !== undefined
                    ? d.db_status_demanda
                    : d.status_demanda !== undefined && d.status_demanda !== 'localmente_perdida'
                      ? d.status_demanda
                      : x.db_status_demanda || 'aberta'
                const st = evalStatusDemanda(dbStatus, newRespostas)

                return {
                  ...x,
                  ...d,
                  nome_cliente: d.nome_cliente || d.cliente_nome || x.nome_cliente,
                  bairros: d.bairros || d.localizacoes || x.bairros,
                  valor_maximo: d.valor_maximo || d.orcamento_max || x.valor_maximo,
                  observacoes: d.observacoes || d.necessidades_especificas || x.observacoes,
                  nivel_urgencia: d.nivel_urgencia || d.urgencia || x.nivel_urgencia,
                  db_status_demanda: dbStatus,
                  status_demanda: st,
                  respostas_captador: newRespostas,
                  is_prioritaria:
                    d.is_prioritaria !== undefined ? d.is_prioritaria : x.is_prioritaria,
                  vinculacao_captador_id:
                    d.vinculacao_captador_id !== undefined
                      ? d.vinculacao_captador_id
                      : x.vinculacao_captador_id,
                  captadores_busca: d.captadores_busca || x.captadores_busca || [],
                }
              }
              return x
            }),
          )
        })
      }
    }

    window.addEventListener('demanda-updated', handleDemandaUpdated as EventListener)

    return () => {
      mounted = false
      window.removeEventListener('global-delete-imovel', handleGlobalDeleteImovel as EventListener)
      window.removeEventListener('force-refresh-data', handleForceRefresh)
      window.removeEventListener('demanda-updated', handleDemandaUpdated as EventListener)
    }
  }, [fetchDemands, type, formatData, sortDemands, evalStatusDemanda])

  useConsolidatedSync({
    channelName: `realtime_sync_${type}`,
    setupRealtime: (channel) => {
      const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

      channel
        .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
          setSyncing(true)
          if (payload.eventType === 'INSERT') {
            const d = payload.new

            if (options?.onlyMine && currentUserRef.current?.id) {
              if (type === 'Aluguel' && d.sdr_id !== currentUserRef.current.id) return
              if (type === 'Venda' && d.corretor_id !== currentUserRef.current.id) return
            }

            setDemands((prev) => {
              if (prev.some((x) => x.id === d.id)) return prev
              const newDemand = formatData([
                { ...d, imoveis_captados: [], respostas_captador: [], prazos_captacao: [] },
              ])[0]

              if (newDemand.status_demanda === 'aberta' || newDemand.is_prioritaria) {
                toast({
                  title: '📣 Nova demanda disponível',
                  description: `Cliente: ${newDemand.nome_cliente} - ${newDemand.bairros?.join(', ')}`,
                  className: 'bg-[#1A3A52] text-white border-none',
                  duration: 4000,
                })
              }

              return sortDemands([newDemand, ...prev])
            })
          } else if (payload.eventType === 'UPDATE') {
            const d = payload.new

            if (options?.onlyMine && currentUserRef.current?.id) {
              if (type === 'Aluguel' && d.sdr_id !== currentUserRef.current.id) return
              if (type === 'Venda' && d.corretor_id !== currentUserRef.current.id) return
            }

            setDemands((prev) => {
              if (!prev.some((x) => x.id === d.id)) {
                if (
                  d.status_demanda === 'aberta' ||
                  d.status_demanda === 'prioritaria' ||
                  d.status_demanda === 'atendida' ||
                  d.status_demanda === 'sem_resposta_24h' ||
                  d.status_demanda === 'em busca' ||
                  d.status_demanda === 'impossivel' ||
                  d.status_demanda === 'PERDIDA_BAIXA' ||
                  d.status_demanda === 'Perdida' ||
                  d.status_demanda === 'perdida'
                ) {
                  const newDemand = formatData([
                    { ...d, imoveis_captados: [], respostas_captador: [], prazos_captacao: [] },
                  ])[0]
                  return sortDemands([newDemand, ...prev])
                }
                return prev
              }

              return sortDemands(
                prev.map((x) => {
                  if (x.id === d.id) {
                    const newRespostas = x.respostas_captador || []
                    const dbStatus = d.status_demanda || x.db_status_demanda || 'aberta'
                    const st = evalStatusDemanda(dbStatus, newRespostas)
                    return {
                      ...x,
                      ...d,
                      nome_cliente: d.nome_cliente || d.cliente_nome || x.nome_cliente,
                      bairros: d.bairros || d.localizacoes || x.bairros,
                      valor_maximo: d.valor_maximo || d.orcamento_max || x.valor_maximo,
                      observacoes: d.observacoes || d.necessidades_especificas || x.observacoes,
                      nivel_urgencia: d.nivel_urgencia || d.urgencia || x.nivel_urgencia,
                      db_status_demanda: dbStatus,
                      status_demanda: st,
                      respostas_captador: newRespostas,
                      is_prioritaria:
                        d.is_prioritaria !== undefined ? d.is_prioritaria : x.is_prioritaria,
                      vinculacao_captador_id:
                        d.vinculacao_captador_id !== undefined
                          ? d.vinculacao_captador_id
                          : x.vinculacao_captador_id,
                      captadores_busca: d.captadores_busca || x.captadores_busca || [],
                    }
                  }
                  return x
                }),
              )
            })
          } else if (payload.eventType === 'DELETE') {
            setDemands((prev) => prev.filter((x) => x.id !== payload.old.id))
          }
          setTimeout(() => setSyncing(false), 500)
        })
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            const imv = payload.new
            setSyncing(true)
            setDemands((prev) => {
              return prev.map((d) => {
                if (d.id === imv.demanda_locacao_id || d.id === imv.demanda_venda_id) {
                  if (d.imoveis_captados?.some((i: any) => i.id === imv.id)) return d

                  const captador = usersRef.current.find(
                    (u) => u.id === (imv.user_captador_id || imv.captador_id),
                  )
                  const enrichedImv = {
                    ...imv,
                    captador_nome: captador?.name || 'Captador',
                    etapa_funil: imv.etapa_funil || 'capturado',
                    observacoes: imv.observacoes || imv.localizacao_texto,
                  }

                  return {
                    ...d,
                    status_demanda: 'atendida',
                    db_status_demanda: 'atendida',
                    imoveis_captados: [enrichedImv, ...(d.imoveis_captados || [])],
                  }
                }
                return d
              })
            })
            setTimeout(() => setSyncing(false), 500)
          },
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
          (payload) => {
            const imv = payload.new
            setSyncing(true)
            setDemands((prev) => {
              return prev.map((d) => {
                const belongsToThisDemand =
                  d.id === imv.demanda_locacao_id || d.id === imv.demanda_venda_id
                const currentlyHasIt = d.imoveis_captados?.some((i: any) => i.id === imv.id)

                if (belongsToThisDemand) {
                  let newImoveis = d.imoveis_captados || []
                  if (!currentlyHasIt) {
                    const captador = usersRef.current.find(
                      (u) => u.id === (imv.user_captador_id || imv.captador_id),
                    )
                    const enrichedImv = {
                      ...imv,
                      captador_nome: captador?.name || 'Captador',
                      etapa_funil: imv.etapa_funil || 'capturado',
                      observacoes: imv.observacoes || imv.localizacao_texto,
                    }
                    newImoveis = [enrichedImv, ...newImoveis]
                  } else {
                    newImoveis = newImoveis.map((i: any) =>
                      i.id === imv.id
                        ? {
                            ...i,
                            ...imv,
                            etapa_funil: imv.etapa_funil || i.etapa_funil,
                            observacoes: imv.observacoes || imv.localizacao_texto || i.observacoes,
                          }
                        : i,
                    )
                  }

                  let newStatus = d.db_status_demanda || d.status_demanda
                  if (imv.etapa_funil === 'fechado') newStatus = 'ganho'
                  else if (
                    (d.db_status_demanda === 'ganho' || d.status_demanda === 'ganho') &&
                    imv.etapa_funil !== 'fechado'
                  ) {
                    const otherClosed = newImoveis.some(
                      (i: any) => i.id !== imv.id && i.etapa_funil === 'fechado',
                    )
                    if (!otherClosed) newStatus = 'atendida'
                  } else if (!currentlyHasIt && newImoveis.length > 0) {
                    newStatus = 'atendida'
                  }

                  const st = evalStatusDemanda(newStatus, d.respostas_captador || [])
                  return {
                    ...d,
                    db_status_demanda: newStatus,
                    status_demanda: st,
                    imoveis_captados: newImoveis,
                  }
                } else if (currentlyHasIt) {
                  const newImoveis = (d.imoveis_captados || []).filter((i: any) => i.id !== imv.id)
                  let newStatus = d.db_status_demanda || d.status_demanda
                  const hasClosed = newImoveis.some((i: any) => i.etapa_funil === 'fechado')
                  if (!hasClosed && newStatus === 'ganho')
                    newStatus = newImoveis.length > 0 ? 'atendida' : 'aberta'
                  if (newImoveis.length === 0 && newStatus === 'atendida') newStatus = 'aberta'

                  const st = evalStatusDemanda(newStatus, d.respostas_captador || [])
                  return {
                    ...d,
                    db_status_demanda: newStatus,
                    status_demanda: st,
                    imoveis_captados: newImoveis,
                  }
                }
                return d
              })
            })
            setTimeout(() => setSyncing(false), 500)
          },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'respostas_captador' },
          (payload) => {
            const resp = payload.new
            setSyncing(true)
            setDemands((prev) => {
              return prev.map((d) => {
                if (d.id === resp.demanda_locacao_id || d.id === resp.demanda_venda_id) {
                  const newRespostas = [resp, ...(d.respostas_captador || [])]
                  const dbStatus = d.db_status_demanda || 'aberta'
                  const st = evalStatusDemanda(dbStatus, newRespostas)
                  return {
                    ...d,
                    status_demanda: st,
                    respostas_captador: newRespostas,
                  }
                }
                return d
              })
            })
            setTimeout(() => setSyncing(false), 500)
          },
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'imovel_demand_match' },
          async (payload) => {
            const match = payload.new
            setSyncing(true)

            const { data: imv } = await supabase
              .from('imoveis_captados')
              .select(
                'id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at',
              )
              .eq('id', match.imovel_id)
              .single()

            if (!imv) {
              setSyncing(false)
              return
            }

            setDemands((prev) => {
              return prev.map((d) => {
                if (d.id === match.demanda_id) {
                  if (d.imoveis_captados?.some((i: any) => i.id === imv.id)) return d

                  const captador = usersRef.current.find(
                    (u) => u.id === (imv.user_captador_id || imv.captador_id),
                  )
                  const enrichedImv = {
                    ...imv,
                    captador_nome: captador?.name || 'Captador',
                    etapa_funil: imv.etapa_funil || 'capturado',
                    observacoes: imv.observacoes || imv.localizacao_texto,
                  }

                  let newStatus = d.db_status_demanda || d.status_demanda
                  if (newStatus !== 'ganho') newStatus = 'atendida'
                  const st = evalStatusDemanda(newStatus, d.respostas_captador || [])

                  return {
                    ...d,
                    db_status_demanda: newStatus,
                    status_demanda: st,
                    imoveis_captados: [enrichedImv, ...(d.imoveis_captados || [])],
                  }
                }
                return d
              })
            })
            setTimeout(() => setSyncing(false), 500)
          },
        )
        .on(
          'postgres_changes',
          { event: 'DELETE', schema: 'public', table: 'imovel_demand_match' },
          (payload) => {
            const match = payload.old
            setSyncing(true)
            setDemands((prev) => {
              return prev.map((d) => {
                if (d.id === match.demanda_id) {
                  const newImoveis = (d.imoveis_captados || []).filter(
                    (i: any) => i.id !== match.imovel_id,
                  )
                  let newStatus = d.db_status_demanda || d.status_demanda
                  const hasClosed = newImoveis.some((i: any) => i.etapa_funil === 'fechado')
                  if (!hasClosed && newStatus === 'ganho')
                    newStatus = newImoveis.length > 0 ? 'atendida' : 'aberta'
                  if (newImoveis.length === 0 && newStatus === 'atendida') newStatus = 'aberta'

                  const st = evalStatusDemanda(newStatus, d.respostas_captador || [])
                  return {
                    ...d,
                    db_status_demanda: newStatus,
                    status_demanda: st,
                    imoveis_captados: newImoveis,
                  }
                }
                return d
              })
            })
            setTimeout(() => setSyncing(false), 500)
          },
        )
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'prazos_captacao' },
          (payload) => {
            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const newP = payload.new
              setSyncing(true)
              setDemands((prev) => {
                return prev.map((d) => {
                  if (d.id === newP.demanda_locacao_id || d.id === newP.demanda_venda_id) {
                    let currentPrazos = d.prazos_captacao || []
                    if (currentPrazos.some((p) => p.id === newP.id)) {
                      currentPrazos = currentPrazos.map((p) => (p.id === newP.id ? newP : p))
                    } else {
                      currentPrazos = [newP, ...currentPrazos]
                    }

                    return { ...d, prazos_captacao: currentPrazos }
                  }
                  return d
                })
              })
              setTimeout(() => setSyncing(false), 500)
            }
          },
        )
    },
    onFallbackPoll: () => fetchDemands(true),
  })

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return
    const nextOffset = offsetRef.current
    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

    const selectFields =
      type === 'Aluguel'
        ? 'id, nome_cliente, cliente_nome, telefone, email, bairros, localizacoes, valor_minimo, valor_maximo, orcamento_max, dormitorios, vagas_estacionamento, observacoes, tipo_imovel, nivel_urgencia, urgencia, status_demanda, is_prioritaria, created_at, updated_at, sdr_id, vinculacao_captador_id, captadores_busca, links_sugeridos, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at), respostas_captador(id, captador_id, resposta, motivo, observacao, created_at), prazos_captacao(id, prazo_resposta, prorrogacoes_usadas, status)'
        : 'id, nome_cliente, cliente_nome, telefone, email, bairros, localizacoes, valor_minimo, valor_maximo, orcamento_max, dormitorios, vagas_estacionamento, necessidades_especificas, tipo_imovel, nivel_urgencia, urgencia, status_demanda, is_prioritaria, created_at, updated_at, corretor_id, vinculacao_captador_id, captadores_busca, links_sugeridos, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at), respostas_captador(id, captador_id, resposta, motivo, observacao, created_at), prazos_captacao(id, prazo_resposta, prorrogacoes_usadas, status)'

    let query = supabase
      .from(table)
      .select(selectFields)
      .order('updated_at', { ascending: false, nullsFirst: false })
      .range(nextOffset, nextOffset + PAGE_SIZE - 1)

    if (options?.onlyMine && userIdRef.current) {
      if (type === 'Aluguel') {
        query = query.eq('sdr_id', userIdRef.current)
      } else {
        query = query.eq('corretor_id', userIdRef.current)
      }
    }

    if (options?.dateRange && options.dateRange !== 'all') {
      const now = new Date()
      let threshold: Date
      if (options.dateRange === 'today') {
        threshold = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      } else if (options.dateRange === '7days') {
        threshold = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      } else {
        threshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      }
      query = query.gte('created_at', threshold.toISOString())
    }

    if (options?.statusFilter && options.statusFilter !== 'all') {
      if (options.statusFilter === 'active') {
        query = query.not(
          'status_demanda',
          'in',
          '("perdida","PERDIDA_BAIXA","impossivel","perdido")',
        )
      } else {
        query = query.in('status_demanda', ['perdida', 'PERDIDA_BAIXA', 'impossivel', 'perdido'])
      }
    }

    const { data: moreData, error } = await query
    if (error || !moreData) return

    if (moreData.length > 0) {
      const demandIds = moreData.map((d: any) => d.id)
      const { data: matches } = await supabase
        .from('imovel_demand_match')
        .select(
          'demanda_id, imovel_id, imoveis_captados(id, codigo_imovel, user_captador_id, captador_id, etapa_funil, data_visita, data_fechamento, dormitorios, vagas, observacoes, localizacao_texto, created_at, updated_at)',
        )
        .in('demanda_id', demandIds)

      if (matches) {
        matches.forEach((match) => {
          const demand = moreData.find((d: any) => d.id === match.demanda_id)
          if (demand && match.imoveis_captados) {
            demand.imoveis_captados = demand.imoveis_captados || []
            if (!demand.imoveis_captados.some((i: any) => i.id === match.imoveis_captados.id)) {
              demand.imoveis_captados.push(match.imoveis_captados)
            }
          }
        })
      }
    }

    setHasMore(moreData.length >= PAGE_SIZE)
    offsetRef.current = nextOffset + PAGE_SIZE

    setDemands((prev) => {
      const formatted = formatData(moreData)
      const existingIds = new Set(prev.map((d) => d.id))
      const newOnes = formatted.filter((d) => !existingIds.has(d.id))
      return sortDemands([...prev, ...newOnes])
    })
  }, [type, hasMore, loading, formatData, sortDemands, options?.dateRange, options?.statusFilter])

  return { demands, loading, syncing, refresh: () => fetchDemands(false), hasMore, loadMore }
}
