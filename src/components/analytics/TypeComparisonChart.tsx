import { useMemo } from 'react'
import { Demand } from '@/types'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'

export function TypeComparisonChart({ demands }: { demands: Demand[] }) {
  const isMobile = useIsMobile()

  const data = useMemo(() => {
    let vVis = 0,
      aVis = 0
    let vNeg = 0,
      aNeg = 0
    let vDem = 0,
      aDem = 0
    let vTimeSum = 0,
      vTimeCnt = 0
    let aTimeSum = 0,
      aTimeCnt = 0

    demands.forEach((d) => {
      if (d.type === 'Venda') vDem++
      if (d.type === 'Aluguel') aDem++

      let hasVis = false
      let isNeg = false

      if (['Visita', 'Proposta', 'Negócio'].includes(d.status)) hasVis = true
      if (d.status === 'Negócio') isNeg = true

      d.capturedProperties?.forEach((cp) => {
        if (cp.visitaDate) hasVis = true
        if (cp.fechamentoDate) {
          isNeg = true
          if (cp.capturedAt) {
            const diff =
              (new Date(cp.fechamentoDate).getTime() - new Date(cp.capturedAt).getTime()) / 86400000
            if (d.type === 'Venda') {
              vTimeSum += diff
              vTimeCnt++
            }
            if (d.type === 'Aluguel') {
              aTimeSum += diff
              aTimeCnt++
            }
          }
        }
      })

      if (d.type === 'Venda') {
        if (hasVis) vVis++
        if (isNeg) vNeg++
      } else {
        if (hasVis) aVis++
        if (isNeg) aNeg++
      }
    })

    const vConv = vDem > 0 ? (vNeg / vDem) * 100 : 0
    const aConv = aDem > 0 ? (aNeg / aDem) * 100 : 0
    const vTime = vTimeCnt > 0 ? vTimeSum / vTimeCnt : 0
    const aTime = aTimeCnt > 0 ? aTimeSum / aTimeCnt : 0

    return [
      { metric: 'Visitas', Venda: vVis, Aluguel: aVis },
      { metric: 'Negócios', Venda: vNeg, Aluguel: aNeg },
      { metric: 'Conv. (%)', Venda: Number(vConv.toFixed(1)), Aluguel: Number(aConv.toFixed(1)) },
      {
        metric: isMobile ? 'Tempo(d)' : 'Tempo (dias)',
        Venda: Number(vTime.toFixed(1)),
        Aluguel: Number(aTime.toFixed(1)),
      },
    ]
  }, [demands, isMobile])

  const config = {
    Venda: { label: 'Venda', color: 'hsl(var(--chart-1))' },
    Aluguel: { label: 'Aluguel', color: 'hsl(var(--chart-4))' },
  }

  return (
    <div className="bg-card border rounded-xl p-4 md:p-6 shadow-sm w-full min-w-0 flex flex-col">
      <h3 className="text-base sm:text-lg lg:text-xl font-bold mb-2 text-foreground leading-tight">
        Comparação: Venda vs Aluguel
      </h3>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6">
        Desempenho por tipo de transação.
      </p>

      <div className="w-full h-[300px] md:h-[400px] min-h-0 flex-1 overflow-hidden">
        <ChartContainer config={config} className="w-full h-full">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
            <XAxis
              dataKey="metric"
              tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              dy={10}
            />
            <YAxis
              tick={{ fontSize: isMobile ? 10 : 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted)/0.4)' }} />
            <Legend
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: isMobile ? '12px' : '14px',
                fontWeight: 600,
              }}
              iconType="circle"
              iconSize={10}
            />
            <Bar
              dataKey="Venda"
              fill="var(--color-Venda)"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 30 : 60}
            />
            <Bar
              dataKey="Aluguel"
              fill="var(--color-Aluguel)"
              radius={[4, 4, 0, 0]}
              maxBarSize={isMobile ? 30 : 60}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
