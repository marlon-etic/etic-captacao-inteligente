import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { isResidential, hasBedrooms, RESIDENTIAL_TIPO_IMOVEL } from '@/lib/residential-filter'

export function NeighborhoodsChart({
  demands,
  onBarClick,
  selected,
}: {
  demands?: any
  onBarClick?: any
  selected?: any
}) {
  const [imoveis, setImoveis] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('imoveis_captados')
      .select('localizacao_texto, tipo_imovel, dormitorios')
      .in('tipo_imovel', RESIDENTIAL_TIPO_IMOVEL)
      .gt('dormitorios', 0)
      .then(({ data }) => setImoveis(data || []))
  }, [])

  const data = useMemo(() => {
    const map = new Map<string, number>()
    imoveis
      .filter((i) => isResidential(i.tipo_imovel) && hasBedrooms(i.dormitorios))
      .forEach((i) => {
        const b = i.localizacao_texto?.split(',')[0].trim()
        if (b) map.set(b, (map.get(b) || 0) + 1)
      })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
  }, [imoveis])

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Top Bairros (Imóveis)</h3>
      <p className="text-[12px] text-[#999999] mb-4 font-medium">
        Bairros com mais captações residenciais cadastradas
      </p>
      <div className="flex-1 w-full relative overflow-hidden">
        <ChartContainer
          config={{ value: { label: 'Imóveis', color: '#1A3A52' } }}
          className="h-full w-full absolute inset-0"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
              onClick={(state) => state?.activeLabel && onBarClick?.(state.activeLabel)}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                axisLine={false}
                tickLine={false}
                width={130}
                tick={{ fontSize: 11, fill: '#333333', fontWeight: 600 }}
                tickFormatter={(val) => (val.length > 20 ? val.substring(0, 20) + '...' : val)}
              />
              <Tooltip cursor={{ fill: 'rgba(26,58,82,0.05)' }} content={<ChartTooltipContent />} />
              <Bar
                dataKey="value"
                fill="#1A3A52"
                radius={[0, 4, 4, 0]}
                fillOpacity={selected ? 0.8 : 1}
                cursor="pointer"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
