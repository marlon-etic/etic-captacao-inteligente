import { useMemo, useEffect, useState } from 'react'
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
  ResponsiveContainer,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { supabase } from '@/lib/supabase/client'

export function ChartsSdr({
  data: _propData,
  loading: _propLoading,
}: {
  data?: any
  loading?: boolean
}) {
  const [imoveis, setImoveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchImoveis() {
      try {
        const { data, error } = await supabase
          .from('imoveis_captados')
          .select('tipo_imovel, dormitorios, vagas, localizacao_texto, endereco')

        if (data && !error) {
          setImoveis(data)
        }
      } catch (err) {
        console.error('Erro ao buscar imoveis para os gráficos', err)
      } finally {
        setLoading(false)
      }
    }
    fetchImoveis()
  }, [])

  const { tipoData, dormsData, vagasData, bairrosData, dormsConfig, vagasConfig } = useMemo(() => {
    // 1. Distribuição por Tipo de Imóvel
    const tipoCount: Record<string, number> = {}
    imoveis.forEach((i) => {
      let t = i.tipo_imovel || 'Outros'
      if (typeof t === 'string' && t.includes(',')) t = t.split(',')[0]
      t = t.trim()
      if (t) tipoCount[t] = (tipoCount[t] || 0) + 1
    })
    const processedTipoData = Object.keys(tipoCount)
      .map((k) => ({ name: k, value: tipoCount[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    // 2. Distribuição por Dormitórios (Donut)
    const dormsCount: Record<string, number> = {}
    imoveis.forEach((i) => {
      const d = typeof i.dormitorios === 'number' ? i.dormitorios : parseInt(i.dormitorios) || 0
      const label = d >= 4 ? '4+' : `${d}`
      dormsCount[label] = (dormsCount[label] || 0) + 1
    })
    const colorsDorms = ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8']
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

    // 3. Distribuição por Vagas (Donut)
    const vagasCount: Record<string, number> = {}
    imoveis.forEach((i) => {
      const v = typeof i.vagas === 'number' ? i.vagas : parseInt(i.vagas) || 0
      const label = v >= 3 ? '3+' : `${v}`
      vagasCount[label] = (vagasCount[label] || 0) + 1
    })
    const colorsVagas = ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857']
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

    // 4. Top Bairros (Horizontal Bar)
    const bairrosCount: Record<string, number> = {}
    imoveis.forEach((i) => {
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

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-8">
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <Skeleton className="h-[380px] w-full rounded-2xl" />
        <Skeleton className="h-[380px] w-full rounded-2xl" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full mb-8">
      {/* Property Type Chart */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white flex flex-col min-w-0">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 shrink-0">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">
            Tipologia (Tipo de Imóvel)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] w-full pt-6 flex-1 min-w-0">
          {tipoData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#3b82f6' } }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tipoData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Bairros Chart */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white flex flex-col min-w-0">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 shrink-0">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">
            Top Bairros (Localização)
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] w-full pt-6 flex-1 min-w-0">
          {bairrosData.length > 0 ? (
            <ChartContainer
              config={{ value: { label: 'Imóveis', color: '#f59e0b' } }}
              className="h-full w-full"
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bairrosData}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 30, bottom: 0 }}
                >
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: '#6b7280', fontWeight: 600 }}
                    width={100}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bedrooms Donut Chart */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white flex flex-col min-w-0">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 shrink-0">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">Dormitórios</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] w-full pt-6 pb-2 flex-1 min-w-0">
          {dormsData.length > 0 ? (
            <ChartContainer config={dormsConfig} className="h-full w-full mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dormsData}
                    cx="50%"
                    cy="45%"
                    innerRadius="50%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {dormsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={<ChartLegendContent className="flex-wrap text-[11px]" />}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>

      {/* Vagas Donut Chart */}
      <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white flex flex-col min-w-0">
        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 shrink-0">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">Vagas de Garagem</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px] w-full pt-6 pb-2 flex-1 min-w-0">
          {vagasData.length > 0 ? (
            <ChartContainer config={vagasConfig} className="h-full w-full mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vagasData}
                    cx="50%"
                    cy="45%"
                    innerRadius="50%"
                    outerRadius="80%"
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                    stroke="none"
                  >
                    {vagasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend
                    content={<ChartLegendContent className="flex-wrap text-[11px]" />}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex items-center justify-center text-sm font-medium text-gray-400">
              Sem dados
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
