import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export function GestorDemandAnalysis() {
  const [demandas, setDemandas] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      supabase
        .from('demandas_locacao')
        .select(
          'id, status_demanda, created_at, orcamento_max, valor_maximo, bairros, localizacoes, dormitorios, quartos, vagas',
        ),
      supabase
        .from('demandas_vendas')
        .select(
          'id, status_demanda, created_at, orcamento_max, valor_maximo, bairros, localizacoes, dormitorios, quartos, vagas',
        ),
    ]).then(([resLoc, resVen]) => {
      const loc = (resLoc.data || []).map((d) => ({ ...d, tipo_geral: 'Locação' }))
      const ven = (resVen.data || []).map((d) => ({ ...d, tipo_geral: 'Venda' }))
      setDemandas([...loc, ...ven])
    })
  }, [])

  const chartsData = useMemo(() => {
    const now = new Date().getTime()
    const isNova = (d: any) =>
      d.created_at &&
      Math.ceil(Math.abs(now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24)) <= 7
    const isAtiva = (d: any) => {
      const s = (d.status_demanda || '').toLowerCase()
      return (
        !s.includes('perdid') &&
        !s.includes('fechad') &&
        !s.includes('inativ') &&
        !s.includes('impossível')
      )
    }

    const process = (keyFn: (d: any) => string) => {
      const map = new Map<string, { name: string; Ativas: number; Novas: number; total: number }>()
      demandas.forEach((d) => {
        const k = keyFn(d)
        if (!k) return
        if (!map.has(k)) map.set(k, { name: k, Ativas: 0, Novas: 0, total: 0 })
        const entry = map.get(k)!
        if (isAtiva(d)) entry.Ativas++
        if (isNova(d)) entry.Novas++
        entry.total++
      })
      return Array.from(map.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 6)
    }

    return {
      orcamento: process((d) => {
        const v = d.valor_maximo || d.orcamento_max || 0
        if (v === 0) return 'Não Info'
        if (d.tipo_geral === 'Venda') {
          if (v <= 500000) return 'V: Até 500k'
          if (v <= 1000000) return 'V: 500k-1M'
          return 'V: 1M+'
        } else {
          if (v <= 3000) return 'L: Até 3k'
          if (v <= 6000) return 'L: 3k-6k'
          return 'L: 6k+'
        }
      }),
      bairro: process((d) => {
        const b = d.bairros?.[0] || d.localizacoes?.[0]
        return b ? b.split(',')[0].trim() : 'Não Info'
      }),
      specs: process((d) => {
        const dorms = d.dormitorios ?? d.quartos ?? 0
        return dorms > 0 ? `${dorms >= 4 ? '4+' : dorms} Dorms.` : 'Não Info'
      }),
    }
  }, [demandas])

  const chartConfig = {
    Ativas: { label: 'Ativas', color: 'hsl(var(--primary))' },
    Novas: { label: 'Novas (7d)', color: 'hsl(var(--chart-2))' },
  }

  const renderBarChart = (data: any[], title: string) => (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-muted/10 border-b p-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-4 relative">
        <ChartContainer config={chartConfig} className="h-full w-full absolute inset-0 p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
              <Bar
                dataKey="Ativas"
                fill="var(--color-Ativas)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
              <Bar
                dataKey="Novas"
                fill="var(--color-Novas)"
                radius={[4, 4, 0, 0]}
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-bold tracking-tight">Análise de Demandas: Ativas vs Novas</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {renderBarChart(chartsData.bairro, 'Por Bairro')}
        {renderBarChart(chartsData.orcamento, 'Por Orçamento')}
        {renderBarChart(chartsData.specs, 'Por Especificação')}
      </div>
    </div>
  )
}
