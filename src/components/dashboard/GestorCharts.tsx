import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'

export function GestorCharts({ demands }: { demands: Demand[] }) {
  const { looseProperties } = useAppStore()

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

  const linkedVsLooseData = useMemo(() => {
    let vinculados = 0
    demands.forEach((d) => {
      if (d.capturedProperties) {
        vinculados += d.capturedProperties.length
      }
    })
    const soltos = looseProperties.length

    return [
      { name: 'Vinculados', value: vinculados, fill: 'var(--color-Vinculados)' },
      { name: 'Soltos', value: soltos, fill: 'var(--color-Soltos)' },
    ]
  }, [demands, looseProperties])

  const funnelConfig = {
    Demandas: { label: 'Demandas', color: 'hsl(var(--primary))' },
    Captados: { label: 'Captados', color: 'hsl(var(--chart-2))' },
    Visitas: { label: 'Visitas', color: 'hsl(var(--chart-3))' },
    Negócios: { label: 'Negócios Fechados', color: 'hsl(var(--chart-4))' },
  }

  const linkedVsLooseConfig = {
    Vinculados: { label: 'Vinculados', color: 'hsl(var(--chart-1))' },
    Soltos: { label: 'Soltos', color: 'hsl(var(--chart-2))' },
  }

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
          <CardTitle>Distribuição de Captações</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          {linkedVsLooseData.reduce((a, b) => a + b.value, 0) > 0 ? (
            <ChartContainer config={linkedVsLooseConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie
                    data={linkedVsLooseData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {linkedVsLooseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
              Nenhuma captação registrada no período
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
