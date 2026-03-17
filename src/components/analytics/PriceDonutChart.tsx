import { useMemo } from 'react'
import { EnhancedDemand } from '@/lib/analytics-utils'
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts'
import { ChartContainer } from '@/components/ui/chart'
import { useIsMobile } from '@/hooks/use-mobile'

interface Props {
  demands: EnhancedDemand[]
  type: 'Venda' | 'Aluguel' | 'Ambos'
}

export function PriceDonutChart({ demands, type }: Props) {
  const isMobile = useIsMobile()

  const { vData, aData } = useMemo(() => {
    const vMap = new Map<string, { name: string; value: number }>()
    const vOrder = ['Até R$300k', 'R$300k-R$500k', 'R$500k-R$700k', 'R$700k-R$1M', 'R$1M+']
    vOrder.forEach((o) => vMap.set(o, { name: o, value: 0 }))

    const aMap = new Map<string, { name: string; value: number }>()
    const aOrder = [
      'Até R$2.000',
      'R$2.000-R$3.000',
      'R$3.000-R$4.000',
      'R$4.000-R$5.000',
      'R$5.000+',
    ]
    aOrder.forEach((o) => aMap.set(o, { name: o, value: 0 }))

    demands.forEach((d) => {
      if (d.type === 'Venda' && vMap.has(d.faixaValor)) vMap.get(d.faixaValor)!.value++
      if (d.type === 'Aluguel' && aMap.has(d.faixaValor)) aMap.get(d.faixaValor)!.value++
    })

    return {
      vData: Array.from(vMap.values()).filter((v) => v.value > 0),
      aData: Array.from(aMap.values()).filter((v) => v.value > 0),
    }
  }, [demands])

  const V_COLORS = ['#FFE0B2', '#FFCC80', '#FFB74D', '#FF9800', '#E65100']
  const A_COLORS = ['#809BAF', '#4D7491', '#2E5F8A', '#1A3A52', '#0D2233']

  const renderDonut = (data: any[], title: string, colors: string[]) => {
    if (data.length === 0) return null
    return (
      <div className="flex-1 flex flex-col min-w-[280px]">
        <h4 className="text-center font-bold text-[#333333] mb-2">{title}</h4>
        <div className="h-[250px] w-full">
          <ChartContainer config={{}} className="h-full w-full">
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
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: '1px solid #E5E5E5',
                  fontSize: '12px',
                  fontWeight: 600,
                }}
                itemStyle={{ color: '#333333' }}
              />
              <Legend
                verticalAlign={isMobile ? 'bottom' : 'middle'}
                layout={isMobile ? 'horizontal' : 'vertical'}
                align={isMobile ? 'center' : 'right'}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: 12, fontWeight: 500 }}
              />
            </PieChart>
          </ChartContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">Distribuição por Faixa de Valor</h3>
      <p className="text-[12px] text-[#999999] mb-6 font-medium">
        Proporção de demandas em cada categoria
      </p>

      <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 flex-wrap">
        {(type === 'Ambos' || type === 'Venda') &&
          renderDonut(vData, 'Demandas de Venda', V_COLORS)}
        {(type === 'Ambos' || type === 'Aluguel') &&
          renderDonut(aData, 'Demandas de Aluguel', A_COLORS)}
        {vData.length === 0 && aData.length === 0 && (
          <p className="text-[#999999] text-sm py-12">Sem dados de faixas de valor.</p>
        )}
      </div>
    </div>
  )
}
