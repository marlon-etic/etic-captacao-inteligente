import { useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { DemandCard } from '@/components/DemandCard'
import { ArchiveX } from 'lucide-react'

export default function PerdidosPage() {
  const { demands, currentUser } = useAppStore()

  const lostDemands = useMemo(() => {
    return demands.filter((d) => d.status === 'Perdida' && d.perdida_por === currentUser?.id)
  }, [demands, currentUser])

  if (!currentUser) return null

  return (
    <div className="flex flex-col gap-[16px] md:gap-[24px] w-full max-w-[1400px] mx-auto animate-fade-in-up pb-8">
      {lostDemands.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] shadow-sm mt-4">
          <ArchiveX className="w-12 h-12 text-[#999999]/50 mb-3" />
          <p className="text-[16px] font-bold text-[#333333] text-center">
            Nenhuma demanda marcada como perdida.
          </p>
          <p className="text-[14px] text-[#999999] mt-1 text-center max-w-[300px]">
            As demandas que você marcar como "Não Encontrei" aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] md:gap-[24px]">
          {lostDemands.map((d, i) => (
            <DemandCard key={d.id} demand={d} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
