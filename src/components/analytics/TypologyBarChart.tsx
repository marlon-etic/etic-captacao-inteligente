import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

export function TypologyBarChart({ demands }: { demands?: any }) {
  const [imoveis, setImoveis] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('imoveis_captados')
      .select('tipo_imovel')
      .then(({ data }) => setImoveis(data || []))
  }, [])

  const data = useMemo(() => {
    const map = new Map<string, number>()
    imoveis.forEach((i) => {
      const t = i.tipo_imovel || 'Não Informado'
      map.set(t, (map.get(t) || 0) + 1)
    })
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [imoveis])

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Tipologia Dinâmica</h3>
      <p className="text-[12px] text-[#999999] mb-4 font-medium">
        Distribuição por tipo de imóvel captado
      </p>
      <div className="flex-1 w-full relative overflow-hidden">
        <ChartContainer
          config={{ value: { label: 'Imóveis', color: '#FF9800' } }}
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
              <Bar dataKey="value" fill="#FF9800" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
