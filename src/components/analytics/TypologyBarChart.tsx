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

export function TypologyBarChart({ demands }: { demands: EnhancedDemand[] }) {
  const data = useMemo(() => {
    const tMap = new Map<string, { name: string; Venda: number; Aluguel: number }>()
    const types = ['Apartamento', 'Casa', 'Sobrado', 'Galpão', 'Terreno', 'Comercial']
    types.forEach((t) => tMap.set(t, { name: t, Venda: 0, Aluguel: 0 }))

    demands.forEach((d) => {
      if (tMap.has(d.tipologia)) {
        const entry = tMap.get(d.tipologia)!
        if (d.type === 'Venda') entry.Venda++
        if (d.type === 'Aluguel') entry.Aluguel++
      }
    })
    return Array.from(tMap.values()).sort((a, b) => b.Venda + b.Aluguel - (a.Venda + a.Aluguel))
  }, [demands])

  const config = {
    Venda: { label: 'Venda', color: '#FF9800' },
    Aluguel: { label: 'Aluguel', color: '#1A3A52' },
  }

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Tipologia Mais Buscada</h3>
      <p className="text-[12px] text-[#999999] mb-4 font-medium">Comparativo por tipo de imóvel</p>

      <div className="flex-1 w-full overflow-hidden">
        <ChartContainer config={config} className="h-full w-full">
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
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ paddingTop: 10 }} />
            <Bar dataKey="Venda" fill="#FF9800" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="Aluguel" fill="#1A3A52" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ChartContainer>
      </div>
    </div>
  )
}
