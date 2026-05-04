import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts'

export function DashboardCharts({ charts, loading }: { charts: any; loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    )
  }

  const COLORS = ['#0070f3', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white overflow-hidden">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">
            Imóveis Captados (Evolução)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-6">
          {charts?.lineData?.length > 0 ? (
            <ChartContainer
              config={{ count: { label: 'Captados', color: '#0070f3' } }}
              className="h-full w-full"
            >
              <AreaChart
                data={charts.lineData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0070f3" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0070f3" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="date"
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
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="#0070f3"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
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
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">Demandas por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px] w-full pb-4 pt-6">
          {charts?.pieData?.length > 0 ? (
            <ChartContainer
              config={{
                locacao: { label: 'Locação', color: '#0070f3' },
                venda: { label: 'Venda', color: '#10b981' },
              }}
              className="h-full w-full mx-auto"
            >
              <PieChart>
                <Pie
                  data={charts.pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={90}
                  paddingAngle={6}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {charts.pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend verticalAlign="bottom" height={36} />
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
