import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

export function DashboardCharts({ charts, loading }: { charts: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    )
  }

  const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#0070f3', '#8b5cf6']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">Imóveis por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-6">
          {charts?.barData?.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Quantidade', color: '#10b981' } }}
              className="h-full w-full"
            >
              <BarChart data={charts.barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: '#6b7280', fontWeight: 600 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados suficientes neste período
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">
            Demandas por Status
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full pb-4 pt-6">
          {charts?.pieData?.length > 0 ? (
            <ChartContainer
              config={{
                aberta: { label: 'Aberta', color: '#0070f3' },
                em_busca: { label: 'Em Busca', color: '#f59e0b' },
                ganho: { label: 'Ganho', color: '#10b981' },
                perdida: { label: 'Perdida', color: '#ef4444' },
              }}
              className="h-full w-full mx-auto"
            >
              <PieChart>
                <Pie
                  data={charts.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados suficientes neste período
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
