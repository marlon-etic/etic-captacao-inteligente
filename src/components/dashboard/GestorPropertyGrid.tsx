import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

export function GestorPropertyGrid() {
  const [imoveis, setImoveis] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('imoveis_captados')
      .select('localizacao_texto, tipo_imovel, dormitorios, vagas')
      .then(({ data }) => setImoveis(data || []))
  }, [])

  const { bairrosData, tipoData, dormData, vagasData } = useMemo(() => {
    const bMap = new Map<string, number>()
    const tMap = new Map<string, number>()
    const dMap = new Map<string, number>()
    const vMap = new Map<string, number>()

    imoveis.forEach((i) => {
      const b = i.localizacao_texto?.split(',')[0].trim()
      if (b) bMap.set(b, (bMap.get(b) || 0) + 1)
      const t = i.tipo_imovel || 'Não Informado'
      tMap.set(t, (tMap.get(t) || 0) + 1)
      const d = i.dormitorios ?? 0
      dMap.set(d >= 4 ? '4+' : d.toString(), (dMap.get(d >= 4 ? '4+' : d.toString()) || 0) + 1)
      const v = i.vagas ?? 0
      vMap.set(v >= 4 ? '4+' : v.toString(), (vMap.get(v >= 4 ? '4+' : v.toString()) || 0) + 1)
    })

    return {
      bairrosData: Array.from(bMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      tipoData: Array.from(tMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 5),
      dormData: Array.from(dMap.entries())
        .map(([name, value]) => ({ name: `${name} Dorm.`, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      vagasData: Array.from(vMap.entries())
        .map(([name, value]) => ({ name: `${name} Vagas`, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [imoveis])

  const COLORS = [
    'hsl(var(--chart-1))',
    'hsl(var(--chart-2))',
    'hsl(var(--chart-3))',
    'hsl(var(--chart-4))',
    'hsl(var(--chart-5))',
  ]

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-bold tracking-tight">Distribuição de Imóveis Captados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Top Bairros</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            <ChartContainer config={{}} className="h-full w-full absolute inset-0 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={bairrosData}
                  layout="vertical"
                  margin={{ left: 10, right: 30, top: 10, bottom: 5 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={110}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                    tickFormatter={(val) => (val.length > 15 ? val.substring(0, 15) + '...' : val)}
                  />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--primary))"
                    radius={[0, 4, 4, 0]}
                    maxBarSize={40}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Tipologia</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            <ChartContainer config={{}} className="h-full w-full absolute inset-0 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tipoData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="value"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Dormitórios</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            <ChartContainer config={{}} className="h-full w-full absolute inset-0 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dormData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="45%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {dormData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Vagas</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            <ChartContainer config={{}} className="h-full w-full absolute inset-0 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={vagasData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="45%"
                    outerRadius="80%"
                    paddingAngle={2}
                  >
                    {vagasData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
