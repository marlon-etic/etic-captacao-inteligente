import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

interface HistoricoTrendChartProps {
  data: { name: string; value: number }[]
}

export function HistoricoTrendChart({ data }: HistoricoTrendChartProps) {
  return (
    <div className="bg-white p-6 rounded-xl border border-[#E5E5E5] shadow-sm flex flex-col h-[350px]">
      <h3 className="text-lg font-bold text-[#1A3A52] mb-1">Capturas por Tipologia</h3>
      <p className="text-xs text-[#999999] mb-4 font-medium">
        Distribuição de imóveis captados por tipo de imóvel
      </p>
      <div className="flex-1 w-full relative">
        <ChartContainer
          config={{ value: { label: 'Imóveis', color: '#2E5F8A' } }}
          className="h-full w-full absolute inset-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: '#333333', fontWeight: 600 }}
                dy={10}
              />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#999999' }} />
              <Tooltip cursor={{ fill: 'rgba(26,58,82,0.05)' }} content={<ChartTooltipContent />} />
              <Bar dataKey="value" fill="#2E5F8A" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
