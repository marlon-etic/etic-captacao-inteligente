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
import { useIsMobile } from '@/hooks/use-mobile'

export function ConversionCharts({ demands }: { demands: Demand[] }) {
  const isMobile = useIsMobile()

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

  const colors = [
    'hsl(var(--primary))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
  ]

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
        name: name.length > 12 && isMobile ? name.substring(0, 10) + '...' : name,
        taxa: v.total > 0 ? Number(((v.neg / v.total) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.taxa - a.taxa)
      .slice(0, isMobile ? 5 : 8) // Show fewer bars on mobile to prevent squishing
  }, [demands, isMobile])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 w-full min-w-0">
      <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-[350px] md:h-[450px] lg:h-[500px] min-w-0">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-foreground leading-tight">
          Funil de Conversão
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Taxa de retenção entre etapas.
        </p>
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <Tooltip
                cursor={{ fill: 'transparent' }}
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                }}
              />
              <Funnel dataKey="value" data={funnelData} isAnimationActive>
                <LabelList
                  position="right"
                  fill="currentColor"
                  stroke="none"
                  dataKey="name"
                  fontSize={isMobile ? 11 : 13}
                  className="font-bold"
                />
                {funnelData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm flex flex-col h-[350px] md:h-[450px] lg:h-[500px] min-w-0">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-foreground leading-tight">
          Taxa de Conversão por Bairro (%)
        </h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4">
          Percentual de demandas fechadas.
        </p>
        <div className="flex-1 min-h-0 w-full overflow-hidden">
          <ChartContainer
            config={{ taxa: { label: 'Conversão (%)', color: 'hsl(var(--primary))' } }}
            className="h-full w-full"
          >
            <BarChart data={bairroData} margin={{ left: -15, right: 10, bottom: 30, top: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
                interval={0}
                angle={-45}
                textAnchor="end"
                axisLine={false}
                tickLine={false}
                dy={15}
              />
              <YAxis
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
              />
              <Bar
                dataKey="taxa"
                fill="var(--color-taxa)"
                radius={[4, 4, 0, 0]}
                maxBarSize={isMobile ? 30 : 50}
              />
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  )
}
