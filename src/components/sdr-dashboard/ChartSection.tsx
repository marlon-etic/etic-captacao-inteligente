import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts'
import { ChartDataGroup } from './chart-utils'

interface ChartSectionProps {
  title: string
  description: string
  data: ChartDataGroup
}

export function ChartSection({ title, description, data }: ChartSectionProps) {
  return (
    <Card className="w-full shadow-sm border-border/50">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold text-foreground">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Renderize os gráficos lado a lado usando 2 colunas para preencher os 100% */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          {/* Tipologia Chart */}
          <Card className="border-none shadow-none bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Tipologia</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {data.tipoData.length > 0 ? (
                <ChartContainer config={data.tipoConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.tipoData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={50}
                        paddingAngle={2}
                      >
                        {data.tipoData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} className="flex-wrap" />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bairros Chart */}
          <Card className="border-none shadow-none bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Bairros</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {data.bairrosData.length > 0 ? (
                <ChartContainer config={data.bairrosConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.bairrosData}
                      layout="vertical"
                      margin={{ left: 0, right: 0, top: 0, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                        {data.bairrosData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dormitórios Chart */}
          <Card className="border-none shadow-none bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Dormitórios</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {data.dormsData.length > 0 ? (
                <ChartContainer config={data.dormsConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.dormsData} margin={{ top: 20 }}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vagas Chart */}
          <Card className="border-none shadow-none bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Vagas de Garagem</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              {data.vagasData.length > 0 ? (
                <ChartContainer config={data.vagasConfig} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.vagasData} margin={{ top: 20 }}>
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis hide />
                      <Bar dataKey="value" fill="var(--color-value)" radius={[4, 4, 0, 0]} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                  Sem dados
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  )
}
