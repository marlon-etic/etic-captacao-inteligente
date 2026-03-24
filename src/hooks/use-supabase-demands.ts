import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

export interface SupabaseCapturedProperty {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  user_captador_id: string
  created_at: string
  status_captacao: string
  captador_nome?: string
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
  created_at: string
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
}

export function useSupabaseDemands(type: 'Aluguel' | 'Venda') {
  const [demands, setDemands] = useState<SupabaseDemand[]>([])
  const [loading, setLoading] = useState(true)
  const { users, currentUser } = useAppStore()

  // Use refs to access latest state inside real-time subscriptions without re-subscribing
  const usersRef = useRef(users)
  const currentUserRef = useRef(currentUser)

  useEffect(() => {
    usersRef.current = users
  }, [users])

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  // Atualizador global de prazos a cada 1 minuto (se fallback do cron)
  useEffect(() => {
    const interval = setInterval(() => {
      supabase.rpc('atualizar_prazos_vencidos').catch(() => {})
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  const sortDemands = useCallback((list: SupabaseDemand[]) => {
    return [...list].sort((a, b) => {
      if (a.is_prioritaria && !b.is_prioritaria) return -1
      if (!a.is_prioritaria && b.is_prioritaria) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [])

  const formatData = useCallback(
    (data: any[]) => {
      const userMap = new Map((usersRef.current || []).map((u) => [u.id, u.name]))

      return data.map((d: any) => ({
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
        status_demanda: d.status_demanda || 'aberta',
        is_prioritaria: d.is_prioritaria || false,
        created_at: d.created_at || new Date().toISOString(),
        tipo: type,
        sdr_id: d.sdr_id,
        corretor_id: d.corretor_id,
        respostas_captador: (d.respostas_captador || []).sort(
          (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        ),
        prazos_captacao: d.prazos_captacao || [],
        imoveis_captados: (d.imoveis_captados || [])
          .map((i: any) => ({
            ...i,
            captador_nome: userMap.get(i.user_captador_id || i.captador_id) || 'Captador',
          }))
          .sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          ),
      }))
    },
    [type],
  )

  const fetchDemands = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData?.user) return

        const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

        const { data, error } = await supabase
          .from(table)
          .select('*, imoveis_captados(*), respostas_captador(*), prazos_captacao(*)')
          .order('created_at', { ascending: false })

        if (error) throw error

        if (data) {
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
    [type, formatData, sortDemands],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchDemands()

    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

    // Sincronização Bidirecional em Tempo Real - Atualizações Locais Otimizadas O(1)
    const channel = supabase
      .channel(`realtime_sync_${type}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const d = payload.new
          setDemands((prev) => {
            if (prev.some((x) => x.id === d.id)) return prev
            const newDemand = formatData([
              { ...d, imoveis_captados: [], respostas_captador: [], prazos_captacao: [] },
            ])[0]
            return sortDemands([newDemand, ...prev])
          })
        } else if (payload.eventType === 'UPDATE') {
          const d = payload.new
          setDemands((prev) =>
            sortDemands(
              prev.map((x) =>
                x.id === d.id
                  ? {
                      ...x,
                      ...d,
                      nome_cliente: d.nome_cliente || d.cliente_nome || x.nome_cliente,
                      bairros: d.bairros || d.localizacoes || x.bairros,
                      valor_maximo: d.valor_maximo || d.orcamento_max || x.valor_maximo,
                      observacoes: d.observacoes || d.necessidades_especificas || x.observacoes,
                      nivel_urgencia: d.nivel_urgencia || d.urgencia || x.nivel_urgencia,
                    }
                  : x,
              ),
            ),
          )
        } else if (payload.eventType === 'DELETE') {
          setDemands((prev) => prev.filter((x) => x.id !== payload.old.id))
        }
      })
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          const imv = payload.new
          setDemands((prev) =>
            prev.map((d) => {
              if (d.id === imv.demanda_locacao_id || d.id === imv.demanda_venda_id) {
                if (d.imoveis_captados?.some((i: any) => i.id === imv.id)) return d

                const captador = usersRef.current.find(
                  (u) => u.id === (imv.user_captador_id || imv.captador_id),
                )
                const enrichedImv = { ...imv, captador_nome: captador?.name || 'Captador' }

                const user = currentUserRef.current
                if (user && (d.sdr_id === user.id || d.corretor_id === user.id)) {
                  toast({
                    title: '🏠 Novo Imóvel Captado!',
                    description: `${enrichedImv.captador_nome} encontrou um imóvel para ${d.nome_cliente}.`,
                    className: 'bg-[#10B981] text-white border-none shadow-lg',
                  })
                }

                return {
                  ...d,
                  status_demanda: 'atendida',
                  imoveis_captados: [enrichedImv, ...(d.imoveis_captados || [])],
                }
              }
              return d
            }),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          const imv = payload.new
          setDemands((prev) =>
            prev.map((d) => {
              if (d.id === imv.demanda_locacao_id || d.id === imv.demanda_venda_id) {
                return {
                  ...d,
                  imoveis_captados: (d.imoveis_captados || []).map((i: any) =>
                    i.id === imv.id ? { ...i, ...imv } : i,
                  ),
                }
              }
              return d
            }),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'respostas_captador' },
        (payload) => {
          const resp = payload.new
          setDemands((prev) =>
            prev.map((d) => {
              if (d.id === resp.demanda_locacao_id || d.id === resp.demanda_venda_id) {
                const user = currentUserRef.current
                if (user && (d.sdr_id === user.id || d.corretor_id === user.id)) {
                  const captador = usersRef.current.find((u) => u.id === resp.captador_id)

                  if (resp.resposta === 'nao_encontrei') {
                    toast({
                      title: 'Feedback de Busca',
                      description: `Captador ${captador?.name || 'Desconhecido'} não encontrou imóvel para ${d.nome_cliente} - Motivo: ${resp.motivo}`,
                      className: 'bg-[#F97316] text-white border-none shadow-lg',
                      duration: 5000,
                    })
                  } else {
                    toast({
                      title: '📢 Feedback de Busca',
                      description: `${captador?.name || 'Captador'}: Encontrei!`,
                      className: 'bg-[#10B981] text-white border-none shadow-lg',
                    })
                  }
                }
                return { ...d, respostas_captador: [resp, ...(d.respostas_captador || [])] }
              }
              return d
            }),
          )
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prazos_captacao' },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newP = payload.new
            const oldP = payload.old

            setDemands((prev) =>
              prev.map((d) => {
                if (d.id === newP.demanda_locacao_id || d.id === newP.demanda_venda_id) {
                  const user = currentUserRef.current
                  const isOwner = user && (d.sdr_id === user.id || d.corretor_id === user.id)

                  if (payload.eventType === 'UPDATE' && oldP && isOwner) {
                    if (newP.prorrogacoes_usadas > (oldP.prorrogacoes_usadas || 0)) {
                      toast({
                        title: '⏳ Prazo Prorrogado',
                        description: `O prazo da demanda de ${d.nome_cliente} foi prorrogado (+48h).`,
                        className: 'bg-[#3B82F6] text-white border-none shadow-lg',
                      })
                    }
                    if (
                      (newP.status === 'sem_resposta_24h' ||
                        newP.status === 'sem_resposta_final') &&
                      oldP.status === 'ativo'
                    ) {
                      toast({
                        title: '🚨 Prazo Esgotado',
                        description: `A demanda de ${d.nome_cliente} ficou sem resposta e está parada.`,
                        variant: 'destructive',
                        className: 'border-none shadow-lg',
                      })
                    }
                  }

                  let currentPrazos = d.prazos_captacao || []
                  if (currentPrazos.some((p) => p.id === newP.id)) {
                    currentPrazos = currentPrazos.map((p) => (p.id === newP.id ? newP : p))
                  } else {
                    currentPrazos = [newP, ...currentPrazos]
                  }

                  return { ...d, prazos_captacao: currentPrazos }
                }
                return d
              }),
            )
          }
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [fetchDemands, type, formatData, sortDemands])

  return { demands, loading, refresh: () => fetchDemands(false) }
}
