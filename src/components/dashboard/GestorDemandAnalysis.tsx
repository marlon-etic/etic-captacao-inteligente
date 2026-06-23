import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'

export function GestorDemandAnalysis() {
  const [demandas, setDemandas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

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
      setIsLoading(false)
    })
  }, [])

  const chartsData = useMemo(() => {
    const now = new Date().getTime()
    const isNova = (d: any) =>
      d.created_at &&
      Math.ceil(Math.abs(now - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24)) <= 30
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
        if (!k || k === 'Não Info') return
        if (!map.has(k)) map.set(k, { name: k, Ativas: 0, Novas: 0, total: 0 })
        const entry = map.get(k)!
        if (isAtiva(d)) entry.Ativas++
        if (isNova(d)) entry.Novas++
        entry.total++
      })
      return Array.from(map.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
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
      dorms: process((d) => {
        const dorms = d.dormitorios ?? d.quartos ?? 0
        return dorms > 0 ? `${dorms >= 4 ? '4+' : dorms} Dormitórios` : 'Não Info'
      }),
      vagas: process((d) => {
        const v = d.vagas ?? 0
        return v > 0 ? `${v >= 4 ? '4+' : v} Vagas` : 'Não Info'
      }),
    }
  }, [demandas])

  const chartConfig = {
    Ativas: { label: 'Ativas', color: 'hsl(var(--primary))' },
    Novas: { label: 'Novas (30d)', color: 'hsl(var(--chart-2))' },
  }

  const renderBarChart = (
    data: any[],
    title: string,
    layout: 'horizontal' | 'vertical' = 'horizontal',
  ) => (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-muted/10 border-b p-4">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px] p-4 relative">
        {data.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-full w-full absolute inset-0 p-4">
            <ResponsiveContainer width="100%" height="100%">
              {layout === 'vertical' ? (
                <BarChart
                  data={data}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => (val.length > 15 ? val.substring(0, 15) + '...' : val)}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                  <Bar
                    dataKey="Ativas"
                    fill="var(--color-Ativas)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                  <Bar
                    dataKey="Novas"
                    fill="var(--color-Novas)"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={30}
                  />
                </BarChart>
              ) : (
                <BarChart data={data} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
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
              )}
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
            <p className="text-sm font-medium">Sem dados disponíveis</p>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="space-y-4 w-full mt-4">
        <Skeleton className="h-8 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-bold tracking-tight">
        Análise de Demandas: Ativas vs Novas (30d)
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {renderBarChart(chartsData.bairro, 'Demandas por Top Bairros', 'vertical')}
        {renderBarChart(chartsData.orcamento, 'Demandas por Orçamento')}
        {renderBarChart(chartsData.dorms, 'Demandas por Dormitórios')}
        {renderBarChart(chartsData.vagas, 'Demandas por Vagas')}
      </div>
    </div>
  )
}
