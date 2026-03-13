import { useMemo } from 'react'
import { Demand } from '@/types'
import {
  FunnelChart,
  Funnel,
  LabelList,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

export function ConversionCharts({ demands }: { demands: Demand[] }) {
  const funnelData = useMemo(() => {
    let demandas = demands.length
    let captadas = 0
    let visitas = 0
    let negocios = 0

    demands.forEach((d) => {
      const s = d.status
      if (!['Pendente', 'Perdida', 'Impossível'].includes(s)) captadas++
      if (['Visita', 'Proposta', 'Negócio'].includes(s)) visitas++
      if (s === 'Negócio') negocios++

      d.capturedProperties?.forEach((p) => {
        if (p.visitaDate && !['Visita', 'Proposta', 'Negócio'].includes(s)) visitas++
        if (p.fechamentoDate && s !== 'Negócio') negocios++
      })
    })

    return [
      { name: 'Demandas', value: demandas },
      { name: 'Captadas', value: captadas },
      { name: 'Visitas', value: visitas },
      { name: 'Negócios', value: negocios },
    ]
  }, [demands])

  const colors = ['#3b82f6', '#0284c7', '#059669', '#16a34a']

  const bairroData = useMemo(() => {
    const map = new Map<string, { total: number; neg: number }>()
    demands.forEach((d) => {
      const b = d.location.split(',')[0].trim() || 'Outro'
      if (!map.has(b)) map.set(b, { total: 0, neg: 0 })
      const m = map.get(b)!
      m.total++
      if (d.status === 'Negócio' || d.capturedProperties?.some((p) => p.fechamentoDate)) m.neg++
    })
    return Array.from(map.entries())
      .map(([name, v]) => ({
        name,
        taxa: v.total > 0 ? Number(((v.neg / v.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, 8)
  }, [demands])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
      <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-[300px] md:h-[400px] lg:h-[500px]">
        <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold mb-4">
          Funil de Conversão
        </h3>
        <div className="flex-1 min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList
                  position="right"
                  fill="currentColor"
                  stroke="none"
                  dataKey="name"
                  className="text-xs font-bold"
                />
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-[300px] md:h-[400px] lg:h-[500px]">
        <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold mb-4">
          Taxa de Conversão por Bairro (%)
        </h3>
        <div className="flex-1 min-h-0">
          <ChartContainer
            config={{ taxa: { label: 'Conversão (%)', color: 'hsl(var(--primary))' } }}
            className="h-full w-full"
          >
            <BarChart data={bairroData} margin={{ left: -20, right: 10, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 12 }}
                interval={0}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
              <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'var(--color-muted)' }} />
              <Bar dataKey="taxa" fill="var(--color-taxa)" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
