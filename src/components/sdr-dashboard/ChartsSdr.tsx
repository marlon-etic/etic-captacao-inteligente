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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
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
    .slice(0, 5)

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
    .slice(0, 5)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Distribuição por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full px-2 pb-2">
          <ChartContainer
            config={{ value: { label: 'Imóveis', color: '#3b82f6' } }}
            className="h-full w-full"
          >
            <BarChart data={tipoData} margin={{ left: -25, bottom: 0, right: 10, top: 10 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Por Dormitórios
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full flex items-center justify-center pb-2">
          {dormsData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#10b981' } }}
              className="h-full w-full max-w-[180px]"
            >
              <PieChart>
                <Pie
                  data={dormsData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  stroke="none"
                >
                  {dormsData.map((entry, index) => {
                    const colors = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-gray-400 font-medium">Sem dados</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Por Vagas
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full flex items-center justify-center pb-2">
          {vagasData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#8b5cf6' } }}
              className="h-full w-full max-w-[180px]"
            >
              <PieChart>
                <Pie
                  data={vagasData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  stroke="none"
                >
                  {vagasData.map((entry, index) => {
                    const colors = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe']
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                  })}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-gray-400 font-medium">Sem dados</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Top Bairros
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full px-2 pb-2">
          <ChartContainer
            config={{ value: { label: 'Imóveis', color: '#f59e0b' } }}
            className="h-full w-full"
          >
            <BarChart data={bairrosData} margin={{ left: -25, bottom: 0, right: 10, top: 10 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
