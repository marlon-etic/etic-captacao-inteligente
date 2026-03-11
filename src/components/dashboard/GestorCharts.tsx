import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { User } from '@/types'

export function GestorCharts({ users }: { users: User[] }) {
  const trendData = useMemo(
    () => [
      { week: 'Semana 1', demandas: 45, captados: 20 },
      { week: 'Semana 2', demandas: 52, captados: 28 },
      { week: 'Semana 3', demandas: 38, captados: 25 },
      { week: 'Semana 4', demandas: 65, captados: 42 },
    ],
    [],
  )

  const topUsers = useMemo(() => {
    return [...users]
      .filter((u) => u.points > 0)
      .sort((a, b) => b.points - a.points)
      .slice(0, 5)
  }, [users])

  const trendConfig = {
    demandas: { label: 'Demandas', color: 'hsl(var(--primary))' },
    captados: { label: 'Captados', color: 'hsl(var(--chart-2))' },
  }

  const barConfig = {
    points: { label: 'Pontos', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Demandas vs Captações (4 Semanas)</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={trendConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="demandas"
                  stroke="var(--color-demandas)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="captados"
                  stroke="var(--color-captados)"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top 5 Captadores</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={barConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={topUsers}
                layout="vertical"
                margin={{ top: 0, right: 20, bottom: 0, left: 20 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <ChartTooltip cursor={{ fill: 'transparent' }} content={<ChartTooltipContent />} />
                <Bar
                  dataKey="points"
                  fill="var(--color-points)"
                  radius={[0, 4, 4, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
