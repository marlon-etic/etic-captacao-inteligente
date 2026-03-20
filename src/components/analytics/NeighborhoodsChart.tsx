import { useMemo } from 'react'
import { EnhancedDemand } from '@/lib/analytics-utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

interface Props {
  demands: EnhancedDemand[]
  onBarClick: (neighborhood: string) => void
  selected: string | null
}

export function NeighborhoodsChart({ demands, onBarClick, selected }: Props) {
  const data = useMemo(() => {
    const bMap = new Map<string, { name: string; Venda: number; Aluguel: number; total: number }>()
    demands.forEach((d) => {
      let b = 'Desconhecido'
      if (Array.isArray(d.location) && d.location.length > 0) {
        b = String(d.location[0]).split(',')[0].trim() || 'Desconhecido'
      } else if (typeof d.location === 'string') {
        b = (d.location as string).split(',')[0].trim() || 'Desconhecido'
      }

      if (!bMap.has(b)) bMap.set(b, { name: b, Venda: 0, Aluguel: 0, total: 0 })
      const entry = bMap.get(b)!
      if (d.type === 'Venda') entry.Venda++
      if (d.type === 'Aluguel') entry.Aluguel++
      entry.total++
    })
    return Array.from(bMap.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
  }, [demands])

  const config = {
    Venda: { label: 'Venda', color: '#FF9800' },
    Aluguel: { label: 'Aluguel', color: '#1A3A52' },
  }

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Bairros Mais Procurados</h3>
      <p className="text-[12px] text-[#999999] mb-4 font-medium">
        Top 10 (Clique em uma barra para filtrar a tabela)
      </p>

      <div className="flex-1 w-full overflow-hidden">
        <ChartContainer config={config} className="h-full w-full">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
            onClick={(state) => {
              if (state?.activeLabel) onBarClick(state.activeLabel)
            }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
            <XAxis type="number" hide />
            <YAxis
              dataKey="name"
              type="category"
              axisLine={false}
              tickLine={false}
              width={100}
              tick={{ fontSize: 11, fill: '#333333', fontWeight: 600 }}
              tickFormatter={(val) => (val.length > 12 ? `${val.substring(0, 12)}...` : val)}
            />
            <Tooltip cursor={{ fill: 'rgba(26,58,82,0.05)' }} content={<ChartTooltipContent />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar
              dataKey="Aluguel"
              stackId="a"
              fill="#1A3A52"
              radius={[0, 0, 0, 0]}
              cursor="pointer"
              className="transition-opacity duration-200"
              fillOpacity={selected ? 0.8 : 1}
            />
            <Bar
              dataKey="Venda"
              stackId="a"
              fill="#FF9800"
              radius={[0, 4, 4, 0]}
              cursor="pointer"
              className="transition-opacity duration-200"
              fillOpacity={selected ? 0.8 : 1}
            />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
