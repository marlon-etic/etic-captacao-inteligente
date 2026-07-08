import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'
import { isResidential, hasBedrooms, RESIDENTIAL_TIPO_IMOVEL } from '@/lib/residential-filter'

export function DormitoriosChart() {
  const [imoveis, setImoveis] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('imoveis_captados')
      .select('tipo_imovel, dormitorios')
      .in('tipo_imovel', RESIDENTIAL_TIPO_IMOVEL)
      .gt('dormitorios', 0)
      .then(({ data }) => setImoveis(data || []))
  }, [])

  const data = useMemo(() => {
    const map = new Map<string, number>()
    imoveis
      .filter((i) => isResidential(i.tipo_imovel) && hasBedrooms(i.dormitorios))
      .forEach((i) => {
        const dorms = i.dormitorios
        const label = dorms >= 4 ? '4+ dormitórios' : `${dorms} dormitório${dorms > 1 ? 's' : ''}`
        map.set(label, (map.get(label) || 0) + 1)
      })
    return Array.from(map.entries())
      .map(([name, value]) => ({
        name,
        value,
        sortKey: name.startsWith('4+') ? 4 : parseInt(name) || 0,
      }))
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ name, value }) => ({ name, value }))
  }, [imoveis])

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Dormitórios</h3>
      <p className="text-[12px] text-[#999999] mb-4 font-medium">
        Distribuição de imóveis residenciais por número de dormitórios
      </p>
      <div className="flex-1 w-full relative overflow-hidden">
        <ChartContainer
          config={{ value: { label: 'Imóveis', color: '#10b981' } }}
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
              <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )
}
