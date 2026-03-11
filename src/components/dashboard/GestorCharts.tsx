import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Demand } from '@/types'

export function GestorCharts({ demands }: { demands: Demand[] }) {
  const funnelData = useMemo(() => {
    const total = demands.length
    const captados = demands.filter((d) =>
      ['Captado sob demanda', 'Captado independente', 'Visita', 'Negócio'].includes(d.status),
    ).length
    const visitas = demands.filter((d) => ['Visita', 'Negócio'].includes(d.status)).length
    const negocios = demands.filter((d) => d.status === 'Negócio').length

    const capPct = total > 0 ? Math.round((captados / total) * 100) : 0
    const visPct = captados > 0 ? Math.round((visitas / captados) * 100) : 0
    const negPct = visitas > 0 ? Math.round((negocios / visitas) * 100) : 0

    return [
      { name: 'Demandas', value: total, fill: 'var(--color-Demandas)', label: `${total}` },
      {
        name: 'Captados',
        value: captados,
        fill: 'var(--color-Captados)',
        label: `${captados} (${capPct}%)`,
      },
      {
        name: 'Visitas',
        value: visitas,
        fill: 'var(--color-Visitas)',
        label: `${visitas} (${visPct}%)`,
      },
      {
        name: 'Negócios',
        value: negocios,
        fill: 'var(--color-Negócios)',
        label: `${negocios} (${negPct}%)`,
      },
    ]
  }, [demands])

  const pieData = useMemo(() => {
    const lost = demands.filter((d) => d.status === 'Perdida' || d.status === 'Impossível')
    const reasons = lost.reduce(
      (acc, d) => {
        const r = d.lostReason || (d.status === 'Impossível' ? 'Sem resposta' : 'Outros')
        acc[r] = (acc[r] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return Object.entries(reasons).map(([name, value], i) => ({
      name,
      value,
      fill: `var(--color-${name.replace(/\s+/g, '')})`,
    }))
  }, [demands])

  const funnelConfig = {
    Demandas: { label: 'Demandas', color: 'hsl(var(--primary))' },
    Captados: { label: 'Captados', color: 'hsl(var(--chart-2))' },
    Visitas: { label: 'Visitas', color: 'hsl(var(--chart-3))' },
    Negócios: { label: 'Negócios Fechados', color: 'hsl(var(--chart-4))' },
  }

  const pieConfig = useMemo(() => {
    const config: any = {}
    pieData.forEach((d, i) => {
      config[d.name.replace(/\s+/g, '')] = {
        label: d.name,
        color: `hsl(var(--chart-${(i % 5) + 1}))`,
      }
    })
    return config
  }, [pieData])

  return (
    <div className="grid gap-6 md:grid-cols-2 mb-6">
      <Card>
        <CardHeader>
          <CardTitle>Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ChartContainer config={funnelConfig}>
            <ResponsiveContainer width="100%" height="100%">
              <FunnelChart>
                <ChartTooltip content={<ChartTooltipContent />} />
                <Funnel dataKey="value" data={funnelData} isAnimationActive>
                  <LabelList position="inside" fill="#fff" stroke="none" dataKey="name" />
                  <LabelList position="right" fill="currentColor" stroke="none" dataKey="label" />
                </Funnel>
              </FunnelChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Análise de Perdas</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {pieData.length > 0 ? (
            <ChartContainer config={pieConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhuma perda registrada no período
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
