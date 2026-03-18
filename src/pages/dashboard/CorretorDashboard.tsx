import { useRef, useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MyDemandsView } from '@/components/MyDemandsView'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { LoosePropertiesView } from '@/components/LoosePropertiesView'
import { MyClientsCapturedView } from '@/components/MyClientsCapturedView'
import { HistoricoTab } from '@/components/dashboard/HistoricoTab'
import useAppStore from '@/stores/useAppStore'

export function CorretorDashboard() {
  const { demands, currentUser, looseProperties } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'demandas'

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
    const t = setTimeout(checkScroll, 100)
    return () => {
      window.removeEventListener('resize', checkScroll)
      clearTimeout(t)
    }
  }, [])

  const myDemands = demands.filter((d) => d.createdBy === currentUser?.id && d.type === 'Venda')
  const activeCount = myDemands.filter(
    (d) => !['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status),
  ).length

  const meusClientesCount = useMemo(() => {
    const propMap = new Set<string>()
    myDemands.forEach((d) => {
      d.capturedProperties?.forEach((p) => {
        if (!p.discarded) propMap.add(p.code)
      })
    })
    return propMap.size
  }, [myDemands])

  const looseCount = looseProperties.filter((p) => {
    if (p.status_reivindicacao && p.status_reivindicacao !== 'disponivel') return false
    if (p.propertyType === 'Venda') return true
    return false
  }).length

  const todosCaptadosCount = useMemo(() => {
    let count = 0
    demands.forEach((d) => {
      if (d.type !== 'Venda') return
      d.capturedProperties?.forEach((p) => {
        if (!p.discarded) count++
      })
    })
    return count
  }, [demands])

  const historyCount = myDemands.filter((d) =>
    ['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status),
  ).length

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  return (
    <div className="px-[16px] pb-[72px] pt-[24px] max-w-7xl mx-auto flex flex-col w-full">
      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full flex flex-col gap-[16px]"
      >
        <div className="sticky top-[64px] sm:top-[72px] z-40 bg-[#F5F5F5] pt-2 pb-2 -mx-[16px] px-[16px] sm:mx-0 sm:px-0">
          <div className="relative w-full">
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-[2px] w-8 md:w-12 bg-gradient-to-r from-[#F5F5F5] to-transparent pointer-events-none z-10" />
            )}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-[2px] w-8 md:w-12 bg-gradient-to-l from-[#F5F5F5] to-transparent pointer-events-none z-10" />
            )}
            <TabsList
              ref={scrollContainerRef}
              onScroll={checkScroll}
              className="flex h-[56px] w-full bg-[#E5E5E5] p-1 overflow-x-auto scrollbar-hide justify-start rounded-[8px] gap-1 snap-x"
            >
              <TabsTrigger
                value="demandas"
                className="h-[48px] min-h-[48px] px-[16px] text-[14px] rounded-[6px] whitespace-nowrap font-bold transition-all data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#666666] data-[state=inactive]:hover:bg-white/50 snap-start flex items-center gap-2"
              >
                📋 Minhas Demandas
                {activeCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-[#F44336] text-white rounded-full px-1.5 text-[10px]">
                    {activeCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="meus-clientes"
                className="h-[48px] min-h-[48px] px-[16px] text-[14px] rounded-[6px] whitespace-nowrap font-bold transition-all data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#666666] data-[state=inactive]:hover:bg-white/50 snap-start flex items-center gap-2"
              >
                🏠 Cadastrados p/ Meus Clientes
                {meusClientesCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-[#4CAF50] text-white rounded-full px-1.5 text-[10px]">
                    {meusClientesCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="disponiveis"
                className="h-[48px] min-h-[48px] px-[16px] text-[14px] rounded-[6px] whitespace-nowrap font-bold transition-all data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#666666] data-[state=inactive]:hover:bg-white/50 snap-start flex items-center gap-2"
              >
                🔓 Disponíveis Geral
                {looseCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-[#FF9800] text-white rounded-full px-1.5 text-[10px]">
                    {looseCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="captados"
                className="h-[48px] min-h-[48px] px-[16px] text-[14px] rounded-[6px] whitespace-nowrap font-bold transition-all data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#666666] data-[state=inactive]:hover:bg-white/50 snap-start flex items-center gap-2"
              >
                📦 Todos os Captados
                {todosCaptadosCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-[#1A3A52] text-white rounded-full px-1.5 text-[10px]">
                    {todosCaptadosCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="historico"
                className="h-[48px] min-h-[48px] px-[16px] text-[14px] rounded-[6px] whitespace-nowrap font-bold transition-all data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=inactive]:bg-transparent data-[state=inactive]:text-[#666666] data-[state=inactive]:hover:bg-white/50 snap-start flex items-center gap-2"
              >
                📜 Histórico
                {historyCount > 0 && (
                  <span className="flex items-center justify-center min-w-[20px] h-[20px] bg-[#999999] text-white rounded-full px-1.5 text-[10px]">
                    {historyCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="demandas" className="m-0">
          <MyDemandsView filterType="Venda" />
        </TabsContent>
        <TabsContent value="meus-clientes" className="m-0">
          <MyClientsCapturedView filterType="Venda" />
        </TabsContent>
        <TabsContent value="disponiveis" className="m-0">
          <LoosePropertiesView filterType="Venda" />
        </TabsContent>
        <TabsContent value="captados" className="m-0">
          <CapturedPropertiesView
            filterType="Venda"
            emptyStateText="Nenhum imóvel de venda captado no momento"
          />
        </TabsContent>
        <TabsContent value="historico" className="m-0">
          <HistoricoTab userDemands={myDemands} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
