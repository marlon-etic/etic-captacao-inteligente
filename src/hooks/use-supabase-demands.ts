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

        const { data: userData } = await supabase.auth.getUser()
        if (!userData.user) return

        const { data: usersData } = await supabase.from('users').select('id, nome, role')
        const userMap = new Map((usersData || []).map((u) => [u.id, u.nome]))
        const currentUserProfile = (usersData || []).find((u) => u.id === userData.user.id)

        const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

        let query = supabase
          .from(table)
          .select('*, imoveis_captados(*)')
          .order('created_at', { ascending: false })

        // Explicit filter to guarantee SDR/Corretores only see their own demands
        // and avoid RLS caching issues on client-side real-time sync
        if (currentUserProfile?.role === 'sdr' && type === 'Aluguel') {
          query = query.eq('sdr_id', userData.user.id)
        } else if (currentUserProfile?.role === 'corretor' && type === 'Venda') {
          query = query.eq('corretor_id', userData.user.id)
        }

        const { data, error } = await query

        if (error) throw error

        if (data) {
          setDemands(
            data.map((d) => ({
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
            })),
          )
        }
      } catch (err: any) {
        console.error(err)
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
      }, 300)
    },
    [fetchDemands],
  )

  useEffect(() => {
    let mounted = true
    if (mounted) fetchDemands()

    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

    const channel = supabase
      .channel(`demands_changes_${type}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, () => debouncedFetch(true))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imoveis_captados' }, () =>
        debouncedFetch(true),
      )
      .subscribe()

    const handleEvent = () => debouncedFetch(true)
    window.addEventListener('demanda-created', handleEvent)
    window.addEventListener('demanda-updated', handleEvent)

    return () => {
      mounted = false
      supabase.removeChannel(channel)
      window.removeEventListener('demanda-created', handleEvent)
      window.removeEventListener('demanda-updated', handleEvent)
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current)
    }
  }, [fetchDemands, debouncedFetch, type])

  return { demands, loading, refresh: () => fetchDemands(false) }
}
