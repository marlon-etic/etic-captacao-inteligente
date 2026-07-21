import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'

export interface DemandProperty {
  matchId: string
  imovelId: string
  codigo_imovel: string | null
  endereco: string | null
  preco: number | null
  valor: number | null
  localizacao_texto: string | null
  etapa_funil: string | null
  status_captacao: string | null
  tipo: string | null
  tipo_imovel: string | null
}

export function useDemandProperties(demandId: string, enabled: boolean) {
  const [properties, setProperties] = useState<DemandProperty[]>([])
  const [loading, setLoading] = useState(false)

  const fetchProperties = useCallback(async () => {
    if (!demandId || !enabled) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('imovel_demand_match')
        .select(
          'id, imovel_id, imoveis_captados(id, codigo_imovel, endereco, preco, valor, localizacao_texto, etapa_funil, status_captacao, tipo, tipo_imovel)',
        )
        .eq('demanda_id', demandId)

      if (error) throw error

      const props: DemandProperty[] = (data || []).map((m: any) => ({
        matchId: m.id,
        imovelId: m.imovel_id,
        codigo_imovel: m.imoveis_captados?.codigo_imovel || null,
        endereco: m.imoveis_captados?.endereco || null,
        preco: m.imoveis_captados?.preco || null,
        valor: m.imoveis_captados?.valor || null,
        localizacao_texto: m.imoveis_captados?.localizacao_texto || null,
        etapa_funil: m.imoveis_captados?.etapa_funil || null,
        status_captacao: m.imoveis_captados?.status_captacao || null,
        tipo: m.imoveis_captados?.tipo || null,
        tipo_imovel: m.imoveis_captados?.tipo_imovel || null,
      }))
      setProperties(props)
    } catch (err) {
      console.error('Error fetching demand properties:', err)
    } finally {
      setLoading(false)
    }
  }, [demandId, enabled])

  useEffect(() => {
    fetchProperties()
  }, [fetchProperties])

  useEffect(() => {
    if (!demandId || !enabled) return
    const channel = supabase
      .channel(`demand_props_${demandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'imovel_demand_match',
          filter: `demanda_id=eq.${demandId}`,
        },
        () => fetchProperties(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [demandId, enabled, fetchProperties])

  return { properties, loading, refresh: fetchProperties }
}
