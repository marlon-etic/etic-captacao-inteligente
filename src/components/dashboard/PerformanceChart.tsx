import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Demand } from '@/types'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function PerformanceChart({ userDemands }: { userDemands: Demand[] }) {
  const chartData = useMemo(() => {
    const data = []
    const now = new Date()

    for (let i = 3; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (i * 7 + 7))
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i * 7)

      const inRange = userDemands.filter((d) => {
        const dt = new Date(d.createdAt)
        return dt >= start && dt < end
      })

      const recebidas = inRange.length
      const captados = inRange.filter(
        (d) =>
          d.status !== 'Pendente' &&
          d.status !== 'Sem demanda' &&
          d.status !== 'Perdida' &&
          d.status !== 'Impossível',
      ).length

      data.push({
        name: `Sem ${4 - i}`,
        recebidas,
        captados,
      })
    }
    return data
  }, [userDemands])

  const lastWeek = chartData[3]
  const prevWeek = chartData[2]
  const trend = lastWeek.captados - prevWeek.captados
  const isUp = trend > 0
  const isDown = trend < 0

  const chartConfig = {
    recebidas: { label: 'Demandas recebidas', color: 'hsl(var(--primary))' },
    captados: { label: 'Imóveis captados', color: 'hsl(var(--emerald-500))' },
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b bg-muted/20">
        <CardTitle className="text-lg">Performance Histórica (4 Semanas)</CardTitle>
        <div
          className={`flex items-center gap-1 text-sm font-semibold px-2 py-1 rounded-md ${isUp ? 'text-emerald-700 bg-emerald-100' : isDown ? 'text-red-700 bg-red-100' : 'text-gray-600 bg-gray-100'}`}
        >
          {isUp ? (
            <TrendingUp className="w-4 h-4" />
          ) : isDown ? (
            <TrendingDown className="w-4 h-4" />
          ) : (
            <Minus className="w-4 h-4" />
          )}
          {Math.abs(trend)} {Math.abs(trend) === 1 ? 'captação' : 'captações'} vs sem. ant.
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="h-[260px] w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12 }}
                allowDecimals={false}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Line
                type="monotone"
                dataKey="recebidas"
                stroke="var(--color-recebidas)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="captados"
                stroke="var(--color-captados)"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}
