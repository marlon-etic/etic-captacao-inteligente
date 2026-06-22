import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'

export function PriceDonutChart({ demands, type }: { demands?: any; type?: any }) {
  const isMobile = useIsMobile()
  const [imoveis, setImoveis] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('imoveis_captados')
      .select('dormitorios, vagas')
      .then(({ data }) => setImoveis(data || []))
  }, [])

  const { dormData, vagasData } = useMemo(() => {
    const dMap = new Map<string, number>()
    const vMap = new Map<string, number>()
    imoveis.forEach((i) => {
      const d = i.dormitorios ?? 0
      const dLabel = d >= 4 ? '4+' : d.toString()
      dMap.set(dLabel, (dMap.get(dLabel) || 0) + 1)

      const v = i.vagas ?? 0
      const vLabel = v >= 4 ? '4+' : v.toString()
      vMap.set(vLabel, (vMap.get(vLabel) || 0) + 1)
    })
    return {
      dormData: Array.from(dMap.entries())
        .map(([name, value]) => ({ name: `${name} Dorm.`, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      vagasData: Array.from(vMap.entries())
        .map(([name, value]) => ({ name: `${name} Vagas`, value }))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }
  }, [imoveis])

  const COLORS = ['#809BAF', '#4D7491', '#2E5F8A', '#1A3A52', '#0D2233']
  const COLORS2 = ['#FFE0B2', '#FFCC80', '#FFB74D', '#FF9800', '#E65100']

  const renderDonut = (data: any[], title: string, colors: string[]) => (
    <div className="flex-1 flex flex-col min-w-[280px]">
      <h4 className="text-center font-bold text-[#333333] mb-2">{title}</h4>
      <div className="h-[250px] w-full relative">
        <ChartContainer config={{}} className="h-full w-full absolute inset-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={isMobile ? 50 : 60}
                outerRadius={isMobile ? 70 : 80}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {data.map((_, i) => (
                  <Cell key={`cell-${i}`} fill={colors[i % colors.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltipContent />} />
              <ChartLegend
                content={<ChartLegendContent />}
                layout="horizontal"
                verticalAlign="bottom"
                align="center"
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  )

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Dormitórios e Vagas de Imóveis</h3>
      <p className="text-[12px] text-[#999999] mb-6 font-medium">
        Distribuição das características dos imóveis captados (Visão Global)
      </p>
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 flex-wrap">
        {renderDonut(dormData, 'Dormitórios', COLORS)}
        {renderDonut(vagasData, 'Vagas', COLORS2)}
      </div>
    </div>
  )
}
