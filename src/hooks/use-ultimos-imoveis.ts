import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'

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
}

export function useUltimosImoveis(
  filtroPeriodo: '24h' | '7d' | '30d' | 'todos' = '30d',
  filtroTipo: 'todos' | 'meus' = 'todos',
) {
  const { currentUser } = useAppStore()
  const [imoveis, setImoveis] = useState<UltimoImovel[]>([])
  const [loading, setLoading] = useState(true)

  const fetchImoveis = useCallback(async () => {
    if (!currentUser) return
    setLoading(true)

    let dateLimit = new Date()
    if (filtroPeriodo === '24h') dateLimit.setDate(dateLimit.getDate() - 1)
    else if (filtroPeriodo === '7d') dateLimit.setDate(dateLimit.getDate() - 7)
    else if (filtroPeriodo === '30d') dateLimit.setDate(dateLimit.getDate() - 30)
    else dateLimit = new Date(0)

    const { data, error } = await supabase
      .from('imoveis_captados')
      .select(`
        *,
        demandas_locacao ( id, sdr_id, bairros, dormitorios, vagas_estacionamento ),
        demandas_vendas ( id, corretor_id, bairros, dormitorios, vagas_estacionamento ),
        users!imoveis_captados_user_captador_id_fkey ( nome )
      `)
      .gte('created_at', dateLimit.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error(error)
      setLoading(false)
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
      }
    })

    if (filtroTipo === 'meus') {
      formatted = formatted.filter((f) => f.is_minha_demanda)
    }

    setImoveis(formatted)
    setLoading(false)
  }, [currentUser, filtroPeriodo, filtroTipo])

  useEffect(() => {
    fetchImoveis()

    const channel = supabase
      .channel('ultimos_imoveis_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imoveis_captados' }, () => {
        fetchImoveis()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchImoveis])

  return { imoveis, loading, refresh: fetchImoveis }
}
