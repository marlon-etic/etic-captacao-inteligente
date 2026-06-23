import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { usePeriodStore } from '@/stores/use-period-store'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'

export function useCaptadorDashboard() {
  const { period, customRange, transactionType } = usePeriodStore()
  const { user } = useAuth()

  const [metrics, setMetrics] = useState<any>(null)
  const [imoveis, setImoveis] = useState<any[]>([])
  const [demandas, setDemandas] = useState<any[]>([])
  const [perdidos, setPerdidos] = useState<any[]>([])
  const [charts, setCharts] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    if (!user) return
    setLoading(true)

    try {
      const now = new Date()
      let startIso = ''
      let endIso = new Date().toISOString()

      if (period === 'today') {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        startIso = d.toISOString()
      } else if (period === 'week') {
        const d = new Date()
        d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1)) // Monday
        d.setHours(0, 0, 0, 0)
        startIso = d.toISOString()
      } else if (period === 'month') {
        const d = new Date(now.getFullYear(), now.getMonth(), 1)
        startIso = d.toISOString()
      } else if (period === 'custom' && customRange) {
        startIso = customRange.start.toISOString()
        const e = new Date(customRange.end)
        e.setHours(23, 59, 59, 999)
        endIso = e.toISOString()
      } else {
        const d = new Date()
        d.setDate(d.getDate() - 7)
        startIso = d.toISOString()
      }

      let queryImv = supabase
        .from('imoveis_captados')
        .select('*')
        .eq('user_captador_id', user.id)
        .gte('created_at', startIso)
        .lte('created_at', endIso)
        .order('created_at', { ascending: false })

      if (transactionType !== 'Todos') {
        queryImv = queryImv.in('tipo', [transactionType, 'Ambos'])
      }

      const { data: imoveisData, error: errImv } = await queryImv

      if (errImv) throw errImv

      const convertidos = (imoveisData || []).filter((i) => i.status_captacao === 'fechado')
      const perdidosData = (imoveisData || []).filter(
        (i) => i.status_captacao === 'perdido' || i.status_captacao === 'descartado',
      )
      const receita = convertidos.reduce((acc, i) => acc + Number(i.preco || i.valor || 0), 0)

      let demLocData: any[] = []
      let demVenData: any[] = []

      if (transactionType === 'Todos' || transactionType === 'Locação') {
        const { data } = await supabase
          .from('demandas_locacao')
          .select('*, imovel_demand_match(id)')
          .gte('created_at', startIso)
          .lte('created_at', endIso)
        demLocData = data || []
      }

      if (transactionType === 'Todos' || transactionType === 'Venda') {
        const { data } = await supabase
          .from('demandas_vendas')
          .select('*, imovel_demand_match(id)')
          .gte('created_at', startIso)
          .lte('created_at', endIso)
        demVenData = data || []
      }

      let todasDemandas = [
        ...demLocData.map((d) => ({ ...d, tipo: 'Locação' })),
        ...demVenData.map((d) => ({ ...d, tipo: 'Venda' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      // Smart Demand Filtering: exclude old inactive requests
      const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
      todasDemandas = todasDemandas.filter((d) => {
        const isRecent = Date.now() - new Date(d.created_at).getTime() <= SEVEN_DAYS_MS
        const isEmBusca = d.status_demanda === 'em busca'
        const hasInteraction =
          (d.captadores_busca && d.captadores_busca.length > 0) ||
          (d.imovel_demand_match && d.imovel_demand_match.length > 0) ||
          !!d.is_prioritaria
        const hasEngagement = isEmBusca || hasInteraction

        if (d.status_demanda === 'aberta' || d.status_demanda === 'sem_resposta_24h') {
          return isRecent || hasEngagement
        }
        return true // keep other statuses like atendida, ganha, perdida, etc in the dashboard if they match the query
      })

      const sobDemanda = (imoveisData || []).filter(
        (i) => i.demanda_locacao_id || i.demanda_venda_id,
      ).length
      const aleatorios = (imoveisData || []).length - sobDemanda
      const semResposta = todasDemandas.filter((d) => d.status_demanda === 'aberta').length

      const emBusca = todasDemandas.filter((d) => d.status_demanda === 'em busca').length
      const perdidosInatividade = todasDemandas.filter(
        (d) => d.status_demanda === 'perdida' && d.motivo_perda === 'Inatividade',
      ).length
      const perdidosOutros = todasDemandas.filter(
        (d) =>
          d.status_demanda === 'perdida' &&
          d.motivo_perda !== 'Inatividade' &&
          d.motivo_perda != null,
      ).length
      const captados = convertidos.length || 0

      setMetrics({
        total: imoveisData?.length || 0,
        convertidos: convertidos.length,
        receita,
        taxa: imoveisData?.length
          ? ((convertidos.length / imoveisData.length) * 100).toFixed(1)
          : 0,
        perdidos: perdidosData.length,
        sobDemanda,
        aleatorios,
        semResposta,
        emBusca,
        perdidosInatividade,
        perdidosOutros,
        captados,
      })

      setImoveis(imoveisData || [])
      setPerdidos(perdidosData)
      setDemandas(todasDemandas)

      // Faixas de Preço
      let faixas: Record<string, number> = {}

      if (transactionType === 'Locação' || transactionType === 'locacao') {
        faixas = {
          'Até R$ 2.000,00': 0,
          'R$ 2.000,00 a R$ 3.000,00': 0,
          'R$ 3.000,00 a R$ 5.000,00': 0,
          'R$ 5.000,00 a R$ 8.000,00': 0,
          'Mais de R$ 8.000,00': 0,
        }

        imoveisData?.forEach((i) => {
          const v = Number(i.preco || i.valor || 0)
          if (v <= 2000) faixas['Até R$ 2.000,00']++
          else if (v <= 3000) faixas['R$ 2.000,00 a R$ 3.000,00']++
          else if (v <= 5000) faixas['R$ 3.000,00 a R$ 5.000,00']++
          else if (v <= 8000) faixas['R$ 5.000,00 a R$ 8.000,00']++
          else faixas['Mais de R$ 8.000,00']++
        })
      } else {
        faixas = {
          'Até R$ 500k': 0,
          'R$ 500k - R$ 1M': 0,
          'R$ 1M - R$ 2M': 0,
          'Acima de R$ 2M': 0,
        }

        imoveisData?.forEach((i) => {
          const v = Number(i.preco || i.valor || 0)
          if (v <= 500000) faixas['Até R$ 500k']++
          else if (v <= 1000000) faixas['R$ 500k - R$ 1M']++
          else if (v <= 2000000) faixas['R$ 1M - R$ 2M']++
          else faixas['Acima de R$ 2M']++
        })
      }

      const faixaPrecoData = Object.entries(faixas)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0)

      // Oferta vs Demanda (Imóveis x Demandas por Tipo)
      const ofertaDemandaMap: Record<string, { name: string; oferta: number; demanda: number }> = {}

      imoveisData?.forEach((i) => {
        const t = i.tipo_imovel || 'Outros'
        if (!ofertaDemandaMap[t]) ofertaDemandaMap[t] = { name: t, oferta: 0, demanda: 0 }
        ofertaDemandaMap[t].oferta++
      })

      todasDemandas.forEach((d) => {
        const tStr = d.tipo_imovel || 'Outros'
        const ts = tStr.split(',').map((s: string) => s.trim())
        ts.forEach((t: string) => {
          if (!ofertaDemandaMap[t]) ofertaDemandaMap[t] = { name: t, oferta: 0, demanda: 0 }
          ofertaDemandaMap[t].demanda++
        })
      })
      const ofertaDemandaData = Object.values(ofertaDemandaMap).sort(
        (a, b) => b.oferta + b.demanda - (a.oferta + a.demanda),
      )

      // Demandas por status
      const pieDataMap: Record<string, number> = {}
      todasDemandas.forEach((d) => {
        const status = d.status_demanda || 'desconhecido'
        pieDataMap[status] = (pieDataMap[status] || 0) + 1
      })
      const pieData = Object.entries(pieDataMap)
        .map(([name, value]) => ({ name, value }))
        .filter((d) => d.value > 0)

      setCharts({ ofertaDemandaData, pieData, faixaPrecoData })
    } catch (err: any) {
      toast.error('Erro ao carregar dados do período: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [period, customRange, transactionType, user])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (!user) return
    const ch = supabase
      .channel('dashboard_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'imoveis_captados',
          filter: `user_captador_id=eq.${user.id}`,
        },
        fetchData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandas_locacao',
        },
        fetchData,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'demandas_vendas',
        },
        fetchData,
      )
      .subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [user, fetchData])

  return { metrics, imoveis, demandas, perdidos, charts, loading, refetch: fetchData }
}
