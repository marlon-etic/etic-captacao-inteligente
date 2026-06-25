import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { ChartDataGroup } from './chart-utils'

interface Props {
  data: ChartDataGroup
  title: string
  label: string
  color1: string
  color2: string
}

export function ChartSection({ data, title, label, color1, color2 }: Props) {
  return (
    <div className="mb-8">
      <h3 className="text-xl font-bold text-[#1A3A52] mb-6">{title}</h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Property Type Chart */}
        <ChartCard title="Tipologia (Tipo de Imóvel)">
          {data.tipoData.length > 0 ? (
            <ChartContainer config={{ value: { label, color: color1 } }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.tipoData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                >
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
                  <Bar dataKey="value" fill={color1} radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {/* Top Bairros Chart */}
        <ChartCard title="Top Bairros (Localização)">
          {data.bairrosData.length > 0 ? (
            <ChartContainer config={{ value: { label, color: color2 } }} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.bairrosData}
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
                  <Bar dataKey="value" fill={color2} radius={[0, 4, 4, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <EmptyState />
          )}
        </ChartCard>

        {/* Bedrooms Donut Chart */}
        <DonutCard title="Dormitórios" data={data.dormsData} config={data.dormsConfig} />

        {/* Vagas Donut Chart */}
        <DonutCard title="Vagas de Garagem" data={data.vagasData} config={data.vagasConfig} />
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="h-full w-full flex items-center justify-center text-sm font-medium text-gray-400">
      Sem dados
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.05)] border-gray-100 bg-white flex flex-col min-w-0">
      <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4 shrink-0">
        <CardTitle className="text-[15px] font-bold text-[#1A3A52]">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] w-full pt-6 flex-1 min-w-0 pb-2">{children}</CardContent>
    </Card>
  )
}

function DonutCard({
  title,
  data,
  config,
}: {
  title: string
  data: any[]
  config: Record<string, any>
}) {
  return (
    <ChartCard title={title}>
      {data.length > 0 ? (
        <ChartContainer config={config} className="h-full w-full mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius="50%"
                outerRadius="80%"
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((entry, index) => (
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
        <EmptyState />
      )}
    </ChartCard>
  )
}
