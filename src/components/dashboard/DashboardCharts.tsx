import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'

export function DashboardCharts({
  charts,
  loading,
  onFilterClick,
}: {
  charts: any
  loading: boolean
  onFilterClick?: (type: string, value: string) => void
}) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
        <Skeleton className="h-[350px] w-full rounded-2xl" />
      </div>
    )
  }

  const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#0070f3', '#8b5cf6']

  const handleBarClick = (data: any, filterType: string) => {
    if (onFilterClick && data && data.activePayload && data.activePayload.length > 0) {
      onFilterClick(filterType, data.activePayload[0].payload.name)
    }
  }

  const handlePieClick = (data: any) => {
    if (onFilterClick && data && data.name) {
      onFilterClick('status', data.name)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Oferta vs Demanda */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white overflow-hidden lg:col-span-1">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">Oferta vs Demanda</CardTitle>
          <CardDescription className="text-xs">
            Imóveis captados x Demandas ativas (clique p/ filtrar)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-6">
          {charts?.ofertaDemandaData?.length > 0 ? (
            <ChartContainer
              config={{
                oferta: { label: 'Oferta (Captações)', color: '#10b981' },
                demanda: { label: 'Demanda (Pedidos)', color: '#f59e0b' },
              }}
              className="h-full w-full"
            >
              <BarChart
                data={charts.ofertaDemandaData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                onClick={(data) => handleBarClick(data, 'tipo')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="oferta" fill="#10b981" radius={[4, 4, 0, 0]} cursor="pointer" />
                <Bar dataKey="demanda" fill="#f59e0b" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Faixas de Valor */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white overflow-hidden lg:col-span-1">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">Faixas de Valor</CardTitle>
          <CardDescription className="text-xs">
            Imóveis captados por preço (clique p/ filtrar)
          </CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] w-full pt-6">
          {charts?.faixaPrecoData?.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Quantidade', color: '#0070f3' } }}
              className="h-full w-full"
            >
              <BarChart
                data={charts.faixaPrecoData}
                margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                onClick={(data) => handleBarClick(data, 'faixa')}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 10, fill: '#6b7280', fontWeight: 600 }}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#0070f3" radius={[4, 4, 0, 0]} cursor="pointer" />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados suficientes
            </div>
          )}
        </CardContent>
      </Card>

      {/* Demandas por Status */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white overflow-hidden lg:col-span-1">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">
            Demandas por Status
          </CardTitle>
          <CardDescription className="text-xs">
            Abertas vs Fechadas (clique p/ filtrar)
          </CardDescription>
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
                  onClick={handlePieClick}
                  cursor="pointer"
                >
                  {charts.pieData.map((_: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
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
