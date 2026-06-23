import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'

export function GestorPropertyGrid() {
  const [imoveis, setImoveis] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('imoveis_captados')
      .select('localizacao_texto, tipo_imovel, dormitorios, vagas')
      .then(({ data }) => {
        setImoveis(data || [])
        setIsLoading(false)
      })
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

  const chartConfig = {
    value: { label: 'Quantidade', color: 'hsl(var(--primary))' },
  }

  if (isLoading) {
    return (
      <div className="space-y-4 w-full">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
          <Skeleton className="h-[350px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 w-full">
      <h2 className="text-xl font-bold tracking-tight">Distribuição de Imóveis Captados</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Tipologia (Tipo de Imóvel)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            {tipoData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full absolute inset-0 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={tipoData} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
                <p className="text-sm font-medium">Sem dados disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Top Bairros (Localização)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            {bairrosData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full absolute inset-0 p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={bairrosData}
                    layout="vertical"
                    margin={{ left: 10, right: 30, top: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={110}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) =>
                        val.length > 15 ? val.substring(0, 15) + '...' : val
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar
                      dataKey="value"
                      fill="hsl(var(--chart-2))"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={40}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
                <p className="text-sm font-medium">Sem dados disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Dormitórios</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            {dormData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full absolute inset-0 p-4">
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
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
                <p className="text-sm font-medium">Sem dados disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardHeader className="bg-muted/10 border-b p-4">
            <CardTitle className="text-lg">Vagas de Garagem</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 relative">
            {vagasData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-full w-full absolute inset-0 p-4">
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
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
                <p className="text-sm font-medium">Sem dados disponíveis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
