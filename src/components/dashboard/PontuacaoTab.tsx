import { User, Demand } from '@/types'
import { GamificationWidget } from './GamificationWidget'
import { PerformanceMetricsCards } from './PerformanceMetricsCards'
import { PerformanceRanking } from './PerformanceRanking'

export function PontuacaoTab({
  currentUser,
  userDemands,
  users,
}: {
  currentUser: User
  userDemands: Demand[]
  users: User[]
}) {
  const recebidas = userDemands.length
  const captados = currentUser.stats.imoveisCaptadosSemana || 0
  const fechados = currentUser.stats.negociosFechados || 0
  const visitas = userDemands.filter((d) =>
    d.capturedProperties?.some((p) => p.visitaDate && p.captador_id === currentUser.id),
  ).length
  const perdidas = userDemands.filter(
    (d) => d.status === 'Perdida' || d.status === 'Impossível',
  ).length

  const metrics = { recebidas, captados, visitas, fechados, perdidas }

  return (
    <div className="flex flex-col gap-[20px] animate-fade-in w-full max-w-[1400px] mx-auto">
      <GamificationWidget currentUser={currentUser} />
      <div className="mt-2">
        <PerformanceMetricsCards metrics={metrics} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[20px] mt-2">
        <PerformanceRanking currentUser={currentUser} users={users} />
        <div className="bg-[#FFFFFF] rounded-[12px] border-[2px] border-[#2E5F8A]/20 p-6 flex flex-col items-center justify-center text-center shadow-sm h-full min-h-[300px]">
          <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h3 className="text-[20px] font-bold text-[#1A3A52] mb-2 leading-tight">
            Continue assim!
          </h3>
          <p className="text-[14px] text-[#999999] max-w-sm leading-relaxed">
            Quanto mais demandas você atender rapidamente, mais pontos acumula para desbloquear
            novas insígnias e subir no ranking de captação.
          </p>
        </div>
      </div>
    </div>
  )
}
