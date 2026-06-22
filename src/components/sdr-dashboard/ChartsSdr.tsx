import { useMemo } from 'react'
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
  const imoveis = useMemo(() => {
    return [...(data?.imoveisLivres || []), ...(data?.imoveisSobDemanda || [])]
  }, [data])

  const { tipoData, dormsData, vagasData, bairrosData, dormsConfig, vagasConfig } = useMemo(() => {
    // 1. Distribuição por Tipo
    const tipoCount: Record<string, number> = {}
    imoveis.forEach((i: any) => {
      let t = i.tipo_imovel || 'Outros'
      if (typeof t === 'string' && t.includes(',')) t = t.split(',')[0]
      t = t.trim()
      tipoCount[t] = (tipoCount[t] || 0) + 1
    })
    const processedTipoData = Object.keys(tipoCount)
      .map((k) => ({ name: k, value: tipoCount[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // 2. Distribuição por Dormitórios
    const dormsCount: Record<string, number> = {}
    imoveis.forEach((i: any) => {
      const d = typeof i.dormitorios === 'number' ? i.dormitorios : parseInt(i.dormitorios) || 0
      const label = d >= 4 ? '4+' : `${d}`
      dormsCount[label] = (dormsCount[label] || 0) + 1
    })
    const colorsDorms = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#059669']
    const processedDormsData = Object.keys(dormsCount)
      .map((k, idx) => ({
        name: k === '0' ? 'Não inf.' : k + (k === '4+' ? ' Quartos' : ' Quarto(s)'),
        value: dormsCount[k],
        fill: colorsDorms[idx % colorsDorms.length],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const confDorms: Record<string, any> = { value: { label: 'Imóveis' } }
    processedDormsData.forEach((d) => {
      confDorms[d.name] = { label: d.name, color: d.fill }
    })

    // 3. Distribuição por Vagas
    const vagasCount: Record<string, number> = {}
    imoveis.forEach((i: any) => {
      const v = typeof i.vagas === 'number' ? i.vagas : parseInt(i.vagas) || 0
      const label = v >= 3 ? '3+' : `${v}`
      vagasCount[label] = (vagasCount[label] || 0) + 1
    })
    const colorsVagas = ['#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#7c3aed']
    const processedVagasData = Object.keys(vagasCount)
      .map((k, idx) => ({
        name: k === '0' ? 'Não inf.' : k + (k === '3+' ? ' Vagas' : ' Vaga(s)'),
        value: vagasCount[k],
        fill: colorsVagas[idx % colorsVagas.length],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const confVagas: Record<string, any> = { value: { label: 'Imóveis' } }
    processedVagasData.forEach((d) => {
      confVagas[d.name] = { label: d.name, color: d.fill }
    })

    // 4. Top Bairros
    const bairrosCount: Record<string, number> = {}
    imoveis.forEach((i: any) => {
      let b = i.localizacao_texto || i.endereco || 'Não informado'
      if (typeof b === 'string') {
        if (b.includes(',')) b = b.split(',')[0]
        if (b.includes('-')) b = b.split('-')[0]
        b = b.trim()
        if (b.length > 25) b = b.substring(0, 25) + '...'
        if (b && b.toLowerCase() !== 'não informado') {
          bairrosCount[b] = (bairrosCount[b] || 0) + 1
        }
      }
    })
    const processedBairrosData = Object.keys(bairrosCount)
      .map((k) => ({ name: k, value: bairrosCount[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    return {
      tipoData: processedTipoData,
      dormsData: processedDormsData,
      vagasData: processedVagasData,
      bairrosData: processedBairrosData,
      dormsConfig: confDorms,
      vagasConfig: confVagas,
    }
  }, [imoveis])

  if (loading)
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
        <Skeleton className="h-[350px] rounded-xl" />
      </div>
    )

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
            <ChartContainer config={dormsConfig} className="h-full w-full">
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
                  {dormsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
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
            <ChartContainer config={vagasConfig} className="h-full w-full">
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
                  {vagasData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
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
