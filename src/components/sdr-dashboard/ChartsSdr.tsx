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

  // 1. Tipo Imóvel
  const tipoCount: Record<string, number> = {}
  data?.demandas?.forEach((d: any) => {
    let t = d.tipo_imovel || 'Outros'
    if (t.includes(',')) t = t.split(',')[0]
    tipoCount[t] = (tipoCount[t] || 0) + 1
  })
  const tipoData = Object.keys(tipoCount)
    .map((k) => ({ name: k, value: tipoCount[k] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5)

  // 2. Faixa Valor
  const faixaCount: Record<string, number> = {
    'Até 500k': 0,
    '500k-1M': 0,
    '1M-2M': 0,
    '> 2M': 0,
  }
  data?.demandas?.forEach((d: any) => {
    const v = d.valor_maximo || 0
    if (v <= 500000) faixaCount['Até 500k']++
    else if (v <= 1000000) faixaCount['500k-1M']++
    else if (v <= 2000000) faixaCount['1M-2M']++
    else faixaCount['> 2M']++
  })
  const faixaData = Object.keys(faixaCount).map((k) => ({ name: k, value: faixaCount[k] }))

  // 3. Funil de Conversão
  const novas =
    data?.demandas?.filter(
      (d: any) => !d.status_demanda || d.status_demanda === 'aberta' || d.status_demanda === 'nova',
    ).length || 0
  const ativas =
    data?.demandas?.filter((d: any) =>
      ['aberta', 'em busca', 'em visita', 'nova'].includes(d.status_demanda?.toLowerCase()),
    ).length || 0
  const visitas = data?.visitas?.length || 0
  const fechados = data?.fechados?.length || 0
  const funilData = [
    { name: 'Novas', value: novas, fill: '#10b981' },
    { name: 'Ativas', value: ativas, fill: '#3b82f6' },
    { name: 'Visitas', value: visitas, fill: '#f59e0b' },
    { name: 'Fechados', value: fechados, fill: '#8b5cf6' },
  ].filter((d) => d.value > 0)

  // 4. Performance Semanal
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(new Date(), 6 - i)
    return {
      dateObj: d,
      name: format(d, 'dd/MM', { locale: ptBR }),
      demandas: 0,
      visitas: 0,
      fechados: 0,
    }
  })

  data?.demandas?.forEach((d: any) => {
    const dDate = format(new Date(d.created_at), 'dd/MM', { locale: ptBR })
    const day = last7Days.find((x) => x.name === dDate)
    if (day) day.demandas++
  })

  data?.visitas?.forEach((v: any) => {
    const dDate = format(new Date(v.created_at || v.data_visita), 'dd/MM', { locale: ptBR })
    const day = last7Days.find((x) => x.name === dDate)
    if (day) day.visitas++
  })

  data?.fechados?.forEach((f: any) => {
    const dDate = format(new Date(f.created_at), 'dd/MM', { locale: ptBR })
    const day = last7Days.find((x) => x.name === dDate)
    if (day) day.fechados++
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Por Tipo
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full px-2 pb-2">
          <ChartContainer
            config={{ value: { label: 'Demandas', color: '#3b82f6' } }}
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
            Por Faixa
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full px-2 pb-2">
          <ChartContainer
            config={{ value: { label: 'Demandas', color: '#10b981' } }}
            className="h-full w-full"
          >
            <BarChart data={faixaData} margin={{ left: -25, bottom: 0, right: 10, top: 10 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Funil
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full flex items-center justify-center pb-2">
          {funilData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Total', color: '#8b5cf6' } }}
              className="h-full w-full max-w-[180px]"
            >
              <PieChart>
                <Pie
                  data={funilData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={35}
                  outerRadius={70}
                  stroke="none"
                >
                  {funilData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
          ) : (
            <div className="text-xs text-gray-400 font-medium">Sem dados no funil</div>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-xl shadow-sm border-gray-100 hover:shadow-md transition-shadow">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            7 Dias
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[220px] w-full px-2 pb-2">
          <ChartContainer
            config={{
              demandas: { label: 'Demandas', color: '#3b82f6' },
              visitas: { label: 'Visitas', color: '#10b981' },
              fechados: { label: 'Fechados', color: '#8b5cf6' },
            }}
            className="h-full w-full"
          >
            <LineChart data={last7Days} margin={{ left: -25, bottom: 0, right: 10, top: 10 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis tick={{ fontSize: 9, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="demandas"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="visitas"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="fechados"
                stroke="#8b5cf6"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  )
}
