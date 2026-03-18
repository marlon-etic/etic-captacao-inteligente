import { useMemo, useRef, useState, useEffect } from 'react'
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

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)

  const checkScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [demands.length])

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
    { id: 'demandas', label: 'Demandas', count: demands.length },
    { id: 'pontuacao', label: 'Pontuação', count: currentUser.points },
    { id: 'captados', label: 'Captados', count: capturedPropsCount },
    { id: 'historico', label: 'Histórico', count: historicalCount },
  ]

  return (
    <div className="flex flex-col gap-[16px] md:gap-[24px] animate-fade-in w-full max-w-[1400px] mx-auto">
      {/* Tab-Based Navigation System */}
      <div className="relative z-20 bg-[#F5F5F5] pt-2 md:pt-4 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="relative w-full">
          {/* Scroll Indicator Fades */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-[2px] w-8 md:w-12 bg-gradient-to-r from-[#F5F5F5] to-transparent pointer-events-none z-10" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-[2px] w-8 md:w-12 bg-gradient-to-l from-[#F5F5F5] to-transparent pointer-events-none z-10" />
          )}

          <div
            ref={scrollContainerRef}
            onScroll={checkScroll}
            className="flex gap-1 md:gap-2 overflow-x-auto scrollbar-hide border-b-[2px] border-[#E5E5E5] snap-x snap-mandatory"
          >
            {TABS.map((tab) => {
              const isActive = mainTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={(e) => {
                    setMainTab(tab.id)
                    setTimeout(() => {
                      e.currentTarget.scrollIntoView({
                        behavior: 'smooth',
                        block: 'nearest',
                        inline: 'center',
                      })
                    }, 50)
                  }}
                  className={cn(
                    'flex items-center justify-center min-h-[48px] px-4 md:px-6 py-3 rounded-t-[8px] transition-all duration-200 whitespace-nowrap snap-start shrink-0 border-b-[4px]',
                    isActive
                      ? 'border-[#1A3A52] bg-[#FFFFFF] text-[#1A3A52] shadow-[0_-2px_10px_rgba(0,0,0,0.02)]'
                      : 'border-transparent text-[#666666] hover:bg-[#EAEAEA] hover:text-[#333333]',
                  )}
                >
                  <span
                    className={cn(
                      'text-[14px] md:text-[16px]',
                      isActive ? 'font-bold' : 'font-medium',
                    )}
                  >
                    {tab.label}
                  </span>
                  <span
                    className={cn(
                      'text-[12px] font-bold px-2 py-0.5 rounded-full ml-2 transition-colors',
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
      </div>

      {/* Content Area with Keyed Animation */}
      <div key={mainTab} className="animate-tab-fade pb-8">
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
