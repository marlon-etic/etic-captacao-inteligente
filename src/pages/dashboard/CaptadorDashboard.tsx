import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { DemandasTab } from '@/components/dashboard/DemandasTab'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'

export function CaptadorDashboard() {
  const { demands, currentUser } = useAppStore()
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

  if (!currentUser) return null

  const TABS = [
    { id: 'demandas', label: 'Demandas', count: demands.length },
    { id: 'captados', label: 'Captados', count: capturedPropsCount },
  ]

  return (
    <div className="flex flex-col gap-[16px] md:gap-[24px] animate-fade-in w-full max-w-[1400px] mx-auto">
      {/* Tab-Based Navigation System - Simplified to two tabs */}
      <div className="relative z-20 bg-[#F5F5F5] pt-2 md:pt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex w-full border-b-[2px] border-[#E5E5E5] rounded-t-[8px] overflow-hidden">
          {TABS.map((tab) => {
            const isActive = mainTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={(e) => {
                  setMainTab(tab.id)
                  const target = e.currentTarget
                  setTimeout(() => {
                    if (target) {
                      target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center',
                      })
                    }
                  }, 50)
                }}
                className={cn(
                  'flex-1 flex items-center justify-center min-h-[48px] px-2 py-3 transition-all duration-200 whitespace-normal border-b-[4px]',
                  isActive
                    ? 'border-[#1A3A52] bg-[#FFFFFF] text-[#1A3A52] shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                    : 'border-transparent text-[#666666] hover:bg-[#EAEAEA] hover:text-[#333333]',
                )}
              >
                <span
                  className={cn(
                    'text-[14px] md:text-[16px] text-center leading-tight',
                    isActive ? 'font-bold' : 'font-medium',
                  )}
                >
                  {tab.label}
                </span>
                <span
                  className={cn(
                    'text-[12px] font-bold px-2 py-0.5 rounded-full ml-1 md:ml-2 transition-colors shrink-0',
                    isActive ? 'bg-[#1A3A52] text-white' : 'bg-[#E5E5E5] text-[#999999]',
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Content Area with Keyed Animation */}
      <div key={mainTab} className="animate-tab-fade pb-8">
        {mainTab === 'demandas' && <DemandasTab demands={demands} />}
        {mainTab === 'captados' && (
          <CapturedPropertiesView emptyStateText="Nenhum imóvel captado no momento." />
        )}
      </div>
    </div>
  )
}
