import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

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
}

export function useSupabaseDemands(type: 'Aluguel' | 'Venda') {
  const [demands, setDemands] = useState<SupabaseDemand[]>([])
  const [loading, setLoading] = useState(true)
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const fetchDemands = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setLoading(true)

        const { data: userData, error: userError } = await supabase.auth.getUser()
        if (userError || !userData?.user) return

        const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

        // RLS safely limits returned rows to the ones the user is allowed to see
        const query = supabase
          .from(table)
          .select('*, imoveis_captados(*)')
          .order('created_at', { ascending: false })

        // Fetch users locally to map captador names without complex joins
        const { data: usersData } = await supabase.from('users').select('id, nome')
        const userMap = new Map((usersData || []).map((u) => [u.id, u.nome]))

        const { data, error } = await query

        if (error) {
          console.error('[useSupabaseDemands] Query error:', error)
          throw error
        }

        if (data) {
          setDemands((prev) => {
            const fetchedFormatted = data.map((d: any) => ({
              id: d.id,
              nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
              bairros: d.bairros || d.localizacoes || [],
              valor_minimo: d.valor_minimo || 0,
              valor_maximo: d.valor_maximo || d.orcamento_max || 0,
              nivel_urgencia: d.nivel_urgencia || d.urgencia || 'Média',
              status_demanda: d.status_demanda || 'aberta',
              created_at: d.created_at || new Date().toISOString(),
              tipo: type,
              imoveis_captados: (d.imoveis_captados || []).map((i: any) => ({
                ...i,
                captador_nome: userMap.get(i.user_captador_id || i.captador_id) || 'Captador',
              })),
            }))

            // Preserva optimistic updates para evitar flicker
            const fetchedIds = new Set(fetchedFormatted.map((f) => f.id))
            const recentLocal = prev.filter(
              (p) => !fetchedIds.has(p.id) && Date.now() - new Date(p.created_at).getTime() < 5000,
            )

            return [...recentLocal, ...fetchedFormatted].sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
            )
          })
        }
      } catch (err: any) {
        if (!isBackground) {
          toast({
            title: 'Erro ao carregar demandas',
            description: err.message,
            variant: 'destructive',
          })
        }
      } finally {
        if (!isBackground) setLoading(false)
      }
    },
    [type],
  )

  const debouncedFetch = useCallback(
    (isBackground = true) => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
      fetchTimeoutRef.current = setTimeout(() => {
        fetchDemands(isBackground)
      }, 800)
    },
    [fetchDemands],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchDemands()

    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

    const channel = supabase
      .channel(`demands_changes_${type}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => {
        if (payload.eventType === 'INSERT') {
          const d = payload.new
          setDemands((prev) => {
            if (prev.some((x) => x.id === d.id)) return prev
            const newDemand: SupabaseDemand = {
              id: d.id,
              nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
              bairros: d.bairros || d.localizacoes || [],
              valor_minimo: d.valor_minimo || 0,
              valor_maximo: d.valor_maximo || d.orcamento_max || 0,
              nivel_urgencia: d.nivel_urgencia || d.urgencia || 'Média',
              status_demanda: d.status_demanda || 'aberta',
              created_at: d.created_at || new Date().toISOString(),
              tipo: type,
              imoveis_captados: [],
            }
            return [newDemand, ...prev]
          })
        } else if (payload.eventType === 'UPDATE') {
          const d = payload.new
          setDemands((prev) =>
            prev.map((x) =>
              x.id === d.id
                ? {
                    ...x,
                    status_demanda: d.status_demanda || x.status_demanda,
                    nome_cliente: d.nome_cliente || d.cliente_nome || x.nome_cliente,
                    bairros: d.bairros || d.localizacoes || x.bairros,
                    valor_minimo: d.valor_minimo || x.valor_minimo,
                    valor_maximo: d.valor_maximo || d.orcamento_max || x.valor_maximo,
                    nivel_urgencia: d.nivel_urgencia || d.urgencia || x.nivel_urgencia,
                  }
                : x,
            ),
          )
        } else if (payload.eventType === 'DELETE') {
          setDemands((prev) => prev.filter((x) => x.id !== payload.old.id))
        }

        // Garante que a relação com imoveis_captados seja consolidada
        debouncedFetch(true)
      })
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const imv = payload.new
            setDemands((prev) =>
              prev.map((d) => {
                if (d.id === imv.demanda_locacao_id || d.id === imv.demanda_venda_id) {
                  const exists = d.imoveis_captados?.some((i: any) => i.id === imv.id)
                  if (exists) return d
                  return {
                    ...d,
                    status_demanda: 'atendida',
                    imoveis_captados: [
                      ...(d.imoveis_captados || []),
                      { ...imv, captador_nome: 'Sincronizando...' },
                    ],
                  }
                }
                return d
              }),
            )
          } else if (payload.eventType === 'UPDATE') {
            const imv = payload.new
            setDemands((prev) =>
              prev.map((d) => {
                if (d.id === imv.demanda_locacao_id || d.id === imv.demanda_venda_id) {
                  return {
                    ...d,
                    status_demanda: d.imoveis_captados?.length > 0 ? 'atendida' : d.status_demanda,
                    imoveis_captados: (d.imoveis_captados || []).map((i: any) =>
                      i.id === imv.id ? { ...i, ...imv } : i,
                    ),
                  }
                }
                return d
              }),
            )
          }

          debouncedFetch(true)
        },
      )
      .subscribe()

    // Optimistic Update: Demanda Criada (0 delay na interface)
    const handleDemandaCreated = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && customEvent.detail.tipo === type) {
        const d = customEvent.detail.data
        if (d) {
          setDemands((prev) => {
            if (prev.some((x) => x.id === d.id)) return prev
            const newDemand: SupabaseDemand = {
              id: d.id,
              nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
              bairros: d.bairros || d.localizacoes || [],
              valor_minimo: d.valor_minimo || 0,
              valor_maximo: d.valor_maximo || d.orcamento_max || 0,
              nivel_urgencia: d.nivel_urgencia || d.urgencia || 'Média',
              status_demanda: d.status_demanda || 'aberta',
              created_at: d.created_at || new Date().toISOString(),
              tipo: type,
              imoveis_captados: [],
            }
            return [newDemand, ...prev]
          })
        }
      }
      debouncedFetch(true)
    }

    // Optimistic Update: Validar/Rejeitar Imóvel
    const handleImovelAction = (e: Event) => {
      const customEvent = e as CustomEvent
      const { propId, status, demandId, tipo } = customEvent.detail
      if (tipo !== type) return

      setDemands((prev) =>
        prev.map((d) => {
          if (d.id === demandId) {
            return {
              ...d,
              status_demanda:
                status === 'fechado'
                  ? 'atendida'
                  : status === 'perdido' && d.imoveis_captados.length <= 1
                    ? 'aberta'
                    : d.status_demanda,
              imoveis_captados: (d.imoveis_captados || []).map((i) =>
                i.id === propId ? { ...i, status_captacao: status } : i,
              ),
            }
          }
          return d
        }),
      )
      debouncedFetch(true)
    }

    window.addEventListener('demanda-created', handleDemandaCreated)
    window.addEventListener('imovel-action', handleImovelAction)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      window.removeEventListener('demanda-created', handleDemandaCreated)
      window.removeEventListener('imovel-action', handleImovelAction)
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    }
  }, [fetchDemands, debouncedFetch, type])

  return { demands, loading, refresh: () => fetchDemands(false) }
}
