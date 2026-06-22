import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { format, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ChartsSdr({ data, loading }: { data: any; loading: boolean }) {
  if (loading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
    )

  const imoveis = [...(data?.imoveisLivres || []), ...(data?.imoveisSobDemanda || [])]

  // 1. Distribuição por Tipo
  const tipoCount: Record<string, number> = {}
  imoveis.forEach((i: any) => {
    let t = i.tipo_imovel || 'Outros'
    if (t.includes(',')) t = t.split(',')[0]
    tipoCount[t] = (tipoCount[t] || 0) + 1
  })
  const tipoData = Object.keys(tipoCount)
    .map((k) => ({ name: k, value: tipoCount[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  // 2. Distribuição por Dormitórios
  const dormsCount: Record<string, number> = {}
  imoveis.forEach((i: any) => {
    const d = i.dormitorios || 0
    const label = d >= 4 ? '4+' : `${d}`
    dormsCount[label] = (dormsCount[label] || 0) + 1
  })
  const dormsData = Object.keys(dormsCount)
    .map((k) => ({ name: k + (k === '4+' ? ' Quartos' : ' Quarto(s)'), value: dormsCount[k] }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // 3. Distribuição por Vagas
  const vagasCount: Record<string, number> = {}
  imoveis.forEach((i: any) => {
    const v = i.vagas || 0
    const label = v >= 3 ? '3+' : `${v}`
    vagasCount[label] = (vagasCount[label] || 0) + 1
  })
  const vagasData = Object.keys(vagasCount)
    .map((k) => ({ name: k + (k === '3+' ? ' Vagas' : ' Vaga(s)'), value: vagasCount[k] }))
    .sort((a, b) => a.name.localeCompare(b.name))

  // 4. Top Bairros
  const bairrosCount: Record<string, number> = {}
  imoveis.forEach((i: any) => {
    let b = i.localizacao_texto || i.endereco || 'Não informado'
    if (b.includes(',')) b = b.split(',')[0]
    b = b.trim()
    if (b.length > 20) b = b.substring(0, 20) + '...'
    bairrosCount[b] = (bairrosCount[b] || 0) + 1
  })
  const bairrosData = Object.keys(bairrosCount)
    .map((k) => ({ name: k, value: bairrosCount[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full px-4 pb-6">
          {tipoData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#3b82f6' } }}
              className="h-full w-full"
            >
              <BarChart data={tipoData} margin={{ left: -10, bottom: 20, right: 20, top: 20 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  dx={-10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 font-medium">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Por Dormitórios
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full flex flex-col items-center justify-center pb-6">
          {dormsData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#10b981' } }}
              className="h-full w-full"
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={dormsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  stroke="none"
                >
                  {dormsData.map((entry, index) => {
                    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 font-medium">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Por Vagas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full flex flex-col items-center justify-center pb-6">
          {vagasData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#8b5cf6' } }}
              className="h-full w-full"
            >
              <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <Pie
                  data={vagasData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="45%"
                  innerRadius={70}
                  outerRadius={110}
                  stroke="none"
                >
                  {vagasData.map((entry, index) => {
                    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 font-medium">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">
            Top Bairros
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] w-full px-4 pb-6">
          {bairrosData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#f59e0b' } }}
              className="h-full w-full"
            >
              <BarChart
                data={bairrosData}
                layout="vertical"
                margin={{ left: 10, bottom: 10, right: 20, top: 20 }}
              >
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  width={110}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={40} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm text-gray-400 font-medium">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
