import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { FunnelChart, Funnel, LabelList, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import { Demand } from '@/types'
import { useIsMobile } from '@/hooks/use-mobile'

export function GestorCharts({ demands }: { demands: Demand[] }) {
  const isMobile = useIsMobile()

  const funnelData = useMemo(() => {
    const total = demands.length
    const captadas = demands.filter((d) =>
      ['Captado sob demanda', 'Captado independente', 'Visita', 'Proposta', 'Negócio'].includes(
        d.status,
      ),
    ).length
    const visitas = demands.filter((d) =>
      ['Visita', 'Proposta', 'Negócio'].includes(d.status),
    ).length
    const negocios = demands.filter((d) => d.status === 'Negócio').length

    return [
      { name: 'Demandas', value: total, fill: 'var(--color-Demandas)', label: `${total}` },
      { name: 'Captadas', value: captadas, fill: 'var(--color-Captadas)', label: `${captadas}` },
      { name: 'Visitas', value: visitas, fill: 'var(--color-Visitas)', label: `${visitas}` },
      { name: 'Negócios', value: negocios, fill: 'var(--color-Negócios)', label: `${negocios}` },
    ]
  }, [demands])

  const funnelConfig = {
    Demandas: { label: 'Demandas', color: 'hsl(var(--primary))' },
    Captadas: { label: 'Captadas', color: 'hsl(var(--chart-2))' },
    Visitas: { label: 'Visitas', color: 'hsl(var(--chart-3))' },
    Negócios: { label: 'Negócios', color: 'hsl(var(--chart-4))' },
  }

  const lostDemands = demands.filter((d) => d.status === 'Perdida' || d.status === 'Impossível')
  const lostReasons = lostDemands.reduce(
    (acc, d) => {
      const reason = d.lostReason || 'Outros'
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const pieData = Object.entries(lostReasons).map(([name, value], i) => ({
    name: name.length > 15 && isMobile ? name.substring(0, 12) + '...' : name,
    value,
    fill: `var(--color-Motivo${i + 1})`,
  }))

  const pieConfig = pieData.reduce((acc, d, i) => {
    acc[`Motivo${i + 1}`] = { label: d.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    return acc
  }, {} as any)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 w-full min-w-0">
      <Card className="border-0 shadow-md flex flex-col min-w-0">
        <CardHeader className="p-4 md:p-6 shrink-0 border-b bg-muted/10">
          <CardTitle className="text-base sm:text-lg font-bold leading-tight">
            Funil de Conversão Global
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 flex-1 flex flex-col min-w-0">
          <div className="h-[300px] md:h-[350px] w-full min-h-0 flex-1 relative overflow-hidden">
            <ChartContainer config={funnelConfig} className="h-full w-full absolute inset-0">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart margin={{ top: 10, bottom: 10, left: 10, right: 30 }}>
                  <ChartTooltip
                    content={<ChartTooltipContent />}
                    cursor={{ fill: 'transparent' }}
                  />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList
                      position="inside"
                      fill="#fff"
                      stroke="none"
                      dataKey="name"
                      fontSize={isMobile ? 11 : 13}
                      className="font-bold drop-shadow-md"
                    />
                    <LabelList
                      position="right"
                      fill="currentColor"
                      stroke="none"
                      dataKey="label"
                      fontSize={isMobile ? 11 : 13}
                      className="font-bold"
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md flex flex-col min-w-0">
        <CardHeader className="p-4 md:p-6 shrink-0 border-b bg-muted/10">
          <CardTitle className="text-base sm:text-lg font-bold leading-tight">
            Motivos de Perda (Desistências)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 md:p-6 flex-1 flex flex-col min-w-0">
          <div className="h-[300px] md:h-[350px] w-full min-h-0 flex-1 relative overflow-hidden">
            {pieData.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-full w-full absolute inset-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 10, bottom: isMobile ? 40 : 10, left: 0, right: 0 }}>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy={isMobile ? '40%' : '50%'}
                      innerRadius="45%"
                      outerRadius="80%"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent className="flex-wrap text-[11px] sm:text-xs" />}
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
                <p className="text-sm font-medium">Nenhuma demanda perdida no período.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
