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

export function GestorCharts({ demands }: { demands: Demand[] }) {
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
    name,
    value,
    fill: `var(--color-Motivo${i + 1})`,
  }))

  const pieConfig = pieData.reduce((acc, d, i) => {
    acc[`Motivo${i + 1}`] = { label: d.name, color: `hsl(var(--chart-${(i % 5) + 1}))` }
    return acc
  }, {} as any)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-[24px] mb-[24px]">
      <Card className="border-0 shadow-md">
        <CardHeader className="p-[16px]">
          <CardTitle className="text-[16px] leading-[24px]">Funil de Conversão</CardTitle>
        </CardHeader>
        <CardContent className="p-[16px] pt-0">
          <div className="h-[300px] md:h-[400px] lg:h-[500px] w-full">
            <ChartContainer config={funnelConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <FunnelChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Funnel dataKey="value" data={funnelData} isAnimationActive>
                    <LabelList
                      position="inside"
                      fill="#fff"
                      stroke="none"
                      dataKey="name"
                      fontSize={12}
                    />
                    <LabelList
                      position="right"
                      fill="currentColor"
                      stroke="none"
                      dataKey="label"
                      fontSize={12}
                    />
                  </Funnel>
                </FunnelChart>
              </ResponsiveContainer>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-md">
        <CardHeader className="p-[16px]">
          <CardTitle className="text-[16px] leading-[24px]">Motivos de Perda</CardTitle>
        </CardHeader>
        <CardContent className="p-[16px] pt-0">
          <div className="h-[300px] md:h-[350px] lg:h-[400px] w-full flex flex-col md:flex-row">
            {pieData.length > 0 ? (
              <ChartContainer config={pieConfig} className="h-full w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius="40%"
                      outerRadius="80%"
                      paddingAngle={2}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartLegend
                      content={<ChartLegendContent className="flex-wrap" />}
                      layout="horizontal"
                      verticalAlign="bottom"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg">
                <p className="text-[14px]">Nenhuma demanda perdida no período</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
