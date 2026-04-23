import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { toast } from '@/hooks/use-toast'
import { getTiposVisiveis } from '@/lib/roleFilters'

export interface UltimoImovel {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  bairros: string[]
  dormitorios: number
  vagas: number
  captador_nome: string
  created_at: string
  demanda_id: string | null
  demanda_tipo: string | null
  is_minha_demanda: boolean
  has_demanda: boolean
  fotos: string[]
  observacoes: string
  status_captacao: string
  etapa_funil: string
  tipo: string
}

export function useUltimosImoveis(
  filtroPeriodo: '24h' | '7d' | '30d' | 'todos' = '30d',
  filtroTipo: 'todos' | 'meus' = 'todos',
) {
  const { currentUser } = useAppStore()
  const [imoveis, setImoveis] = useState<UltimoImovel[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  const fetchImoveis = useCallback(
    async (showLoading = true) => {
      if (!currentUser) return
      if (showLoading) setLoading(true)

      let dateLimit = new Date()
      if (filtroPeriodo === '24h') dateLimit.setDate(dateLimit.getDate() - 1)
      else if (filtroPeriodo === '7d') dateLimit.setDate(dateLimit.getDate() - 7)
      else if (filtroPeriodo === '30d') dateLimit.setDate(dateLimit.getDate() - 30)
      else dateLimit = new Date(0)

      const tipos = getTiposVisiveis(currentUser.role)

      const { data, error } = await supabase
        .from('imoveis_captados')
        .select(`
        *,
        demandas_locacao ( id, sdr_id, bairros, dormitorios, vagas_estacionamento ),
        demandas_vendas ( id, corretor_id, bairros, dormitorios, vagas_estacionamento ),
        users!imoveis_captados_user_captador_id_fkey ( nome )
      `)
        .gte('created_at', dateLimit.toISOString())
        .in('tipo', tipos)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error(error)
        if (showLoading) setLoading(false)
        return
      }

      let formatted = data.map((d: any) => {
        const isLocacao = !!d.demandas_locacao
        const demanda = isLocacao ? d.demandas_locacao : d.demandas_vendas
        const is_minha_demanda =
          demanda &&
          (isLocacao ? demanda.sdr_id === currentUser.id : demanda.corretor_id === currentUser.id)

        return {
          id: d.id,
          codigo_imovel: d.codigo_imovel,
          endereco: d.endereco || d.localizacao_texto || '',
          preco: d.preco || d.valor || 0,
          bairros: demanda?.bairros || [],
          dormitorios: d.dormitorios || demanda?.dormitorios || 0,
          vagas: d.vagas || demanda?.vagas_estacionamento || 0,
          captador_nome: d.users?.nome || 'Captador',
          created_at: d.created_at,
          demanda_id: demanda?.id || null,
          demanda_tipo: isLocacao ? 'Aluguel' : d.demandas_vendas ? 'Venda' : null,
          is_minha_demanda: !!is_minha_demanda,
          has_demanda: !!demanda,
          fotos: d.fotos || [],
          observacoes: d.observacoes || d.localizacao_texto || '',
          status_captacao: d.status_captacao || 'pendente',
          etapa_funil: d.etapa_funil || 'capturado',
          tipo: d.tipo || 'Ambos',
        }
      })

      if (filtroTipo === 'meus') {
        formatted = formatted.filter((f) => f.is_minha_demanda)
      }

      setImoveis(formatted)
      if (showLoading) setLoading(false)
    },
    [currentUser, filtroPeriodo, filtroTipo],
  )

  const fetchSingleImovel = useCallback(
    async (id: string) => {
      if (!id || !currentUser) return

      const tipos = getTiposVisiveis(currentUser.role)

      const { data, error } = await supabase
        .from('imoveis_captados')
        .select(`
        *,
        demandas_locacao ( id, sdr_id, bairros, dormitorios, vagas_estacionamento ),
        demandas_vendas ( id, corretor_id, bairros, dormitorios, vagas_estacionamento ),
        users!imoveis_captados_user_captador_id_fkey ( nome )
      `)
        .eq('id', id)
        .in('tipo', tipos)
        .single()

      if (error || !data) return

      setImoveis((prev) => {
        const isLocacao = !!data.demandas_locacao
        const demanda = isLocacao ? data.demandas_locacao : data.demandas_vendas
        const is_minha_demanda =
          demanda &&
          (isLocacao ? demanda.sdr_id === currentUser.id : demanda.corretor_id === currentUser.id)

        const formatted = {
          id: data.id,
          codigo_imovel: data.codigo_imovel,
          endereco: data.endereco || data.localizacao_texto || '',
          preco: data.preco || data.valor || 0,
          bairros: demanda?.bairros || [],
          dormitorios: data.dormitorios || demanda?.dormitorios || 0,
          vagas: data.vagas || demanda?.vagas_estacionamento || 0,
          captador_nome: data.users?.nome || 'Captador',
          created_at: data.created_at,
          demanda_id: demanda?.id || null,
          demanda_tipo: isLocacao ? 'Aluguel' : data.demandas_vendas ? 'Venda' : null,
          is_minha_demanda: !!is_minha_demanda,
          has_demanda: !!demanda,
          fotos: data.fotos || [],
          observacoes: data.observacoes || data.localizacao_texto || '',
          status_captacao: data.status_captacao || 'pendente',
          etapa_funil: data.etapa_funil || 'capturado',
          tipo: data.tipo || 'Ambos',
        }

        if (filtroTipo === 'meus' && !formatted.is_minha_demanda) {
          return prev.filter((p) => p.id !== formatted.id)
        }

        const exists = prev.some((p) => p.id === formatted.id)
        if (exists) {
          return prev.map((p) => (p.id === formatted.id ? formatted : p))
        } else {
          return [...prev, formatted].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )
        }
      })
    },
    [currentUser, filtroTipo],
  )

  useEffect(() => {
    let mounted = true
    fetchImoveis(true)

    const channel = supabase
      .channel('ultimos_imoveis_changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          setSyncing(true)
          if (payload.new?.id) {
            fetchSingleImovel(payload.new.id).finally(() => {
              if (mounted) setTimeout(() => setSyncing(false), 500)
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          setSyncing(true)
          if (payload.new?.id) {
            fetchSingleImovel(payload.new.id).finally(() => {
              if (mounted) setTimeout(() => setSyncing(false), 500)
            })
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
        (payload) => {
          setSyncing(true)
          setImoveis((prev) => prev.filter((p) => p.id !== payload.old.id))
          setTimeout(() => setSyncing(false), 500)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'demandas_locacao' },
        (payload) => {
          setSyncing(true)
          setImoveis((prev) => {
            let updated = false
            const next = prev.map((p) => {
              if (p.demanda_id === payload.new.id && p.demanda_tipo === 'Aluguel') {
                updated = true
                return {
                  ...p,
                  bairros: payload.new.bairros || p.bairros,
                  dormitorios: p.dormitorios || payload.new.dormitorios || 0,
                  vagas: p.vagas || payload.new.vagas_estacionamento || 0,
                }
              }
              return p
            })
            return updated ? next : prev
          })
          setTimeout(() => setSyncing(false), 500)
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'demandas_vendas' },
        (payload) => {
          setSyncing(true)
          setImoveis((prev) => {
            let updated = false
            const next = prev.map((p) => {
              if (p.demanda_id === payload.new.id && p.demanda_tipo === 'Venda') {
                updated = true
                return {
                  ...p,
                  bairros: payload.new.bairros || p.bairros,
                  dormitorios: p.dormitorios || payload.new.dormitorios || 0,
                  vagas: p.vagas || payload.new.vagas_estacionamento || 0,
                }
              }
              return p
            })
            return updated ? next : prev
          })
          setTimeout(() => setSyncing(false), 500)
        },
      )
      .subscribe((status) => {
        if (status === 'CLOSED') {
          toast({ title: 'Aviso', description: 'Conexão perdida. Reconectando...', duration: 3000 })
        }
        if (status === 'CHANNEL_ERROR') {
          toast({
            title: 'Erro',
            description: 'Erro ao sincronizar dados. Recarregando...',
            variant: 'destructive',
          })
          fetchImoveis(false)
        }
      })

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [fetchImoveis, fetchSingleImovel])

  return { imoveis, loading, syncing, refresh: () => fetchImoveis(true) }
}
