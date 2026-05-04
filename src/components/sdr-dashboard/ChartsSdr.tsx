import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'

export function ChartsSdr({ data, loading }: { data: any; loading: boolean }) {
  if (loading)
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    )

  const tipoCount: Record<string, number> = {}
  data?.demandas?.forEach((d: any) => {
    const t = d.tipo_imovel || 'Outro'
    tipoCount[t] = (tipoCount[t] || 0) + 1
  })
  const tipoData = Object.keys(tipoCount).map((k) => ({ name: k, value: tipoCount[k] }))

  const faixaCount: Record<string, number> = {
    'Até 500k': 0,
    '500k-1M': 0,
    '1M-2M': 0,
    'Acima 2M': 0,
  }
  data?.demandas?.forEach((d: any) => {
    const v = d.valor_maximo || 0
    if (v <= 500000) faixaCount['Até 500k']++
    else if (v <= 1000000) faixaCount['500k-1M']++
    else if (v <= 2000000) faixaCount['1M-2M']++
    else faixaCount['Acima 2M']++
  })
  const faixaData = Object.keys(faixaCount).map((k) => ({ name: k, value: faixaCount[k] }))

  const novas =
    data?.demandas?.filter((d: any) => !d.status_demanda || d.status_demanda === 'aberta').length ||
    0
  const ativas = data?.demandas?.filter((d: any) => d.status_demanda === 'em busca').length || 0
  const visitas = data?.visitas?.length || 0
  const fechados = data?.fechados?.length || 0
  const funilData = [
    { name: 'Novas', value: novas, fill: '#10b981' },
    { name: 'Ativas', value: ativas, fill: '#3b82f6' },
    { name: 'Visitas', value: visitas, fill: '#f59e0b' },
    { name: 'Fechados', value: fechados, fill: '#8b5cf6' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <Card className="rounded-xl shadow-sm border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Demandas por Tipo</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] w-full">
          <ChartContainer
            config={{ value: { label: 'Qtd', color: '#3b82f6' } }}
            className="h-full w-full"
          >
            <BarChart data={tipoData} margin={{ left: -20, bottom: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Demandas por Faixa de Valor</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] w-full">
          <ChartContainer
            config={{ value: { label: 'Qtd', color: '#10b981' } }}
            className="h-full w-full"
          >
            <BarChart data={faixaData} margin={{ left: -20, bottom: 20 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                angle={-15}
                textAnchor="end"
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-gray-700">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="h-[250px] w-full flex items-center justify-center">
          <ChartContainer
            config={{ value: { label: 'Total', color: '#8b5cf6' } }}
            className="h-full w-full max-w-[200px]"
          >
            <PieChart>
              <Pie
                data={funilData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                stroke="none"
              >
                {funilData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
            </PieChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
