import { useState, useEffect, useMemo, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  type CampanhaFechada,
  type CampanhaImovelDetalhe,
  fetchCampanhasFechadas,
  fetchImoveisByCampanhas,
} from '@/services/campanhaHistoricoService'
import { computeKpis, computeTopCaptadores, computeChartData } from '@/lib/campanha-historico-utils'
import { HistoricoKpiCards } from '@/components/campanhas/HistoricoKpiCards'
import { HistoricoFilters } from '@/components/campanhas/HistoricoFilters'
import { HistoricoRankingTable } from '@/components/campanhas/HistoricoRankingTable'
import { HistoricoTopCaptadores } from '@/components/campanhas/HistoricoTopCaptadores'
import { HistoricoTrendChart } from '@/components/campanhas/HistoricoTrendChart'

export function CampanhaHistoricoDashboard() {
  const [loading, setLoading] = useState(true)
  const [campanhas, setCampanhas] = useState<CampanhaFechada[]>([])
  const [imoveis, setImoveis] = useState<CampanhaImovelDetalhe[]>([])
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterPeriodo, setFilterPeriodo] = useState('90')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const fechadas = await fetchCampanhasFechadas()
      setCampanhas(fechadas)
      const ids = fechadas.map((c) => c.id)
      const imvData = await fetchImoveisByCampanhas(ids)
      setImoveis(imvData)
    } catch (err) {
      console.error('[HistoricoDashboard] Load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    const channel = supabase
      .channel('campanhas_historico_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campanhas' }, () =>
        loadData(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'campanhas_historico' }, () =>
        loadData(),
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadData])

  const filteredCampanhas = useMemo(() => {
    let result = campanhas
    if (filterTipo !== 'todos') {
      result = result.filter((c) => c.tipo_imovel === filterTipo)
    }
    if (filterPeriodo !== 'todos') {
      const days = parseInt(filterPeriodo)
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - days)
      result = result.filter((c) => {
        const dataFech = new Date(c.data_fechamento_real || c.data_fim)
        return dataFech >= cutoff
      })
    }
    return result
  }, [campanhas, filterTipo, filterPeriodo])

  const filteredImoveis = useMemo(() => {
    const campanhaIds = new Set(filteredCampanhas.map((c) => c.id))
    return imoveis.filter((i) => campanhaIds.has(i.campanha_id))
  }, [imoveis, filteredCampanhas])

  const kpis = useMemo(
    () => computeKpis(filteredCampanhas, filteredImoveis),
    [filteredCampanhas, filteredImoveis],
  )
  const topCaptadores = useMemo(
    () => computeTopCaptadores(filteredCampanhas, filteredImoveis),
    [filteredCampanhas, filteredImoveis],
  )
  const chartData = useMemo(
    () => computeChartData(filteredCampanhas, filteredImoveis),
    [filteredCampanhas, filteredImoveis],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1A3A52]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <HistoricoKpiCards kpis={kpis} />
      <HistoricoFilters
        filterTipo={filterTipo}
        setFilterTipo={setFilterTipo}
        filterPeriodo={filterPeriodo}
        setFilterPeriodo={setFilterPeriodo}
      />
      <HistoricoTrendChart data={chartData} />
      <HistoricoTopCaptadores captadores={topCaptadores} />
      <HistoricoRankingTable campanhas={filteredCampanhas} imoveis={filteredImoveis} />
    </div>
  )
}
