import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { DemandasTab } from '@/components/dashboard/DemandasTab'
import { PontuacaoTab } from '@/components/dashboard/PontuacaoTab'
import { HistoricoTab } from '@/components/dashboard/HistoricoTab'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'

export function CaptadorDashboard() {
  const { demands, currentUser, users } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const mainTab = searchParams.get('tab') || 'demandas'
  const setMainTab = (tab: string) => setSearchParams({ tab })

  const userDemands = useMemo(() => {
    return demands.filter(
      (d) =>
        d.assignedTo === currentUser?.id ||
        d.capturedProperties?.some((p) => p.captador_id === currentUser?.id),
    )
  }, [demands, currentUser])

  const capturedPropsCount = useMemo(() => {
    return userDemands.reduce(
      (acc, d) =>
        acc + (d.capturedProperties?.filter((p) => p.captador_id === currentUser?.id).length || 0),
      0,
    )
  }, [userDemands, currentUser])

  const historicalCount = useMemo(() => {
    return userDemands.filter((d) => ['Negócio', 'Perdida', 'Impossível'].includes(d.status)).length
  }, [userDemands])

  if (!currentUser) return null

  const TABS = [
    { id: 'demandas', label: '📋 Demandas', count: demands.length },
    { id: 'pontuacao', label: '⭐ Pontuação', count: currentUser.points },
    { id: 'captados', label: '🏠 Captados', count: capturedPropsCount },
    { id: 'historico', label: '📊 Histórico', count: historicalCount },
  ]

  return (
    <div className="flex flex-col gap-[16px] md:gap-[24px] animate-fade-in w-full max-w-[1400px] mx-auto">
      {/* Tab-Based Navigation System */}
      <div className="flex gap-2 sticky top-[56px] md:top-0 z-40 bg-[#F5F5F5] pt-4 md:pt-6 px-4 md:px-0 overflow-x-auto scrollbar-hide border-b-[2px] border-[#E5E5E5]">
        {TABS.map((tab) => {
          const isActive = mainTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setMainTab(tab.id)}
              className={cn(
                'flex items-center justify-center gap-2 px-6 py-3 rounded-t-[8px] font-bold text-[14px] md:text-[16px] transition-all duration-200 whitespace-nowrap border-b-[4px]',
                isActive
                  ? 'bg-[#1A3A52] text-white border-[#1A3A52]'
                  : 'bg-[#F5F5F5] text-[#333333] border-transparent hover:bg-[#EAEAEA]',
              )}
            >
              {tab.label} ({tab.count})
            </button>
          )
        })}
      </div>

      <div className="animate-tab-fade pt-2">
        {mainTab === 'demandas' && <DemandasTab demands={demands} />}
        {mainTab === 'pontuacao' && (
          <PontuacaoTab currentUser={currentUser} userDemands={userDemands} users={users} />
        )}
        {mainTab === 'captados' && (
          <CapturedPropertiesView emptyStateText="Nenhum imóvel captado no momento." />
        )}
        {mainTab === 'historico' && <HistoricoTab userDemands={userDemands} />}
      </div>
    </div>
  )
}
