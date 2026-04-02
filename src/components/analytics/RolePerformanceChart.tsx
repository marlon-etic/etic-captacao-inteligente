import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart'

export function RolePerformanceChart({
  demandas,
  imoveis,
  usuarios,
}: {
  demandas: any[]
  imoveis: any[]
  usuarios: any[]
}) {
  const data = useMemo(() => {
    const userMap = new Map<
      string,
      { name: string; role: string; Demandas: number; Imoveis: number }
    >()

    usuarios.forEach((u) => {
      userMap.set(u.id, { name: u.nome || 'Desconhecido', role: u.role, Demandas: 0, Imoveis: 0 })
    })

    demandas.forEach((d) => {
      const ownerId = d.sdr_id || d.corretor_id
      if (ownerId && userMap.has(ownerId)) {
        userMap.get(ownerId)!.Demandas++
      }
    })

    imoveis.forEach((i) => {
      const capId = i.user_captador_id || i.captador_id
      if (capId && userMap.has(capId)) {
        userMap.get(capId)!.Imoveis++
      }
    })

    return Array.from(userMap.values())
      .filter((u) => u.Demandas > 0 || u.Imoveis > 0)
      .sort((a, b) => b.Demandas + b.Imoveis - (a.Demandas + a.Imoveis))
      .slice(0, 10)
  }, [demandas, imoveis, usuarios])

  const config = {
    Demandas: { label: 'Demandas Criadas', color: '#1A3A52' },
    Imoveis: { label: 'Imóveis Captados', color: '#FF9800' },
  }

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col h-[450px]">
      <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">
        Performance por Usuário (Top 10)
      </h3>
      <p className="text-[12px] text-[#999999] mb-4 font-medium">
        Demandas criadas e Imóveis captados ativamente
      </p>

      <div className="flex-1 w-full overflow-hidden">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#999999]">
            Sem dados capturados
          </div>
        ) : (
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
              <Bar dataKey="Demandas" fill="#1A3A52" radius={[4, 4, 0, 0]} maxBarSize={40} />
              <Bar dataKey="Imoveis" fill="#FF9800" radius={[4, 4, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  )
}
