import { useMemo } from 'react'
import { EnhancedDemand } from '@/lib/analytics-utils'
import { BarChart2, MapPin, Home } from 'lucide-react'

export function SummaryCards({ demands }: { demands: EnhancedDemand[] }) {
  const { total, topBairro, topBairroCount, topTipo, topTipoPerc } = useMemo(() => {
    const total = demands.length

    const bCount: Record<string, number> = {}
    const tCount: Record<string, number> = {}

    demands.forEach((d) => {
      const b = d.location.split(',')[0].trim() || 'Desconhecido'
      bCount[b] = (bCount[b] || 0) + 1
      tCount[d.tipologia] = (tCount[d.tipologia] || 0) + 1
    })

    const topB = Object.entries(bCount).sort((a, b) => b[1] - a[1])[0]
    const topT = Object.entries(tCount).sort((a, b) => b[1] - a[1])[0]

    return {
      total,
      topBairro: topB ? topB[0] : '-',
      topBairroCount: topB ? topB[1] : 0,
      topTipo: topT ? topT[0] : '-',
      topTipoPerc: total > 0 && topT ? Math.round((topT[1] / total) * 100) : 0,
    }
  }, [demands])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
      <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-[0_4px_12px_rgba(26,58,82,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#333333] text-[12px] font-bold uppercase tracking-wider">
            Total de Demandas
          </p>
          <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
            <BarChart2 className="w-5 h-5 text-[#1A3A52]" />
          </div>
        </div>
        <p className="text-[#1A3A52] text-[36px] font-bold leading-none">{total}</p>
        <p className="text-[12px] text-[#999999] mt-2 font-medium">No período selecionado</p>
      </div>

      <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-[0_4px_12px_rgba(26,58,82,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#333333] text-[12px] font-bold uppercase tracking-wider">
            Bairro com mais demandas
          </p>
          <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
            <MapPin className="w-5 h-5 text-[#1A3A52]" />
          </div>
        </div>
        <div>
          <p className="text-[#1A3A52] text-[24px] sm:text-[32px] font-bold leading-tight truncate">
            {topBairro}
          </p>
          <p className="text-[14px] text-[#FF9800] mt-1 font-bold">
            {topBairroCount} demandas registradas
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-[0_4px_12px_rgba(26,58,82,0.05)] flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[#333333] text-[12px] font-bold uppercase tracking-wider">
            Tipologia mais buscada
          </p>
          <div className="w-10 h-10 bg-[#F5F5F5] rounded-full flex items-center justify-center">
            <Home className="w-5 h-5 text-[#1A3A52]" />
          </div>
        </div>
        <div>
          <p className="text-[#1A3A52] text-[24px] sm:text-[32px] font-bold leading-tight truncate">
            {topTipo}
          </p>
          <p className="text-[14px] text-[#4CAF50] mt-1 font-bold">
            Representa {topTipoPerc}% do total
          </p>
        </div>
      </div>
    </div>
  )
}
