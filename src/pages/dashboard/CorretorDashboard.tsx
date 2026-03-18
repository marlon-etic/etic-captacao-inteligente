import { useRef, useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DemandCard } from '@/components/DemandCard'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { LoosePropertiesView } from '@/components/LoosePropertiesView'
import { MyClientsCapturedView } from '@/components/MyClientsCapturedView'
import { PropertiesToLinkView } from '@/components/PropertiesToLinkView'
import useAppStore from '@/stores/useAppStore'

export function CorretorDashboard() {
  const { demands, currentUser, looseProperties } = useAppStore()

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
    (d) => d.status === 'Pendente' || d.status === 'Em Captação',
  ).length

  const activeDemands = myDemands.filter(
    (d) => !['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status),
  )

  const historyDemands = myDemands.filter((d) =>
    ['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status),
  )

  const looseCount = looseProperties.filter((p) => {
    if (p.status_reivindicacao && p.status_reivindicacao !== 'disponivel') return false
    if (p.propertyType === 'Venda') return true
    if (p.propertyType === 'Aluguel' && currentUser?.tipos_demanda_solicitados?.includes('locacao'))
      return true
    return false
  }).length

  const vincularCount = looseCount // Same logic for Corretor as they see the same compatible pool

  return (
    <div className="px-[16px] pb-[72px] pt-[24px] max-w-7xl mx-auto flex flex-col gap-[24px] w-full">
      <Tabs defaultValue="vincular" className="w-full">
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
            className="flex h-[48px] w-full bg-transparent p-0 border-b border-[#E5E5E5] overflow-x-auto scrollbar-hide justify-start gap-[16px] rounded-none snap-x"
          >
            <TabsTrigger
              value="vincular"
              className="relative h-[48px] min-h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-[2px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap font-bold transition-colors snap-start"
            >
              🏠 CAPTADOS PARA VINCULAR
              {vincularCount > 0 && (
                <span className="ml-[8px] inline-flex items-center justify-center min-w-[20px] h-[20px] bg-[#4CAF50] text-white rounded-full text-[10px] font-bold px-1.5">
                  {vincularCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="demandas"
              className="relative h-[48px] min-h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-[2px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap font-bold transition-colors snap-start"
            >
              Minhas Demandas
              {activeCount > 0 && (
                <span className="ml-[8px] inline-flex items-center justify-center min-w-[20px] h-[20px] bg-[#F44336] text-white rounded-full text-[10px] font-bold px-1.5">
                  {activeCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="meus-clientes"
              className="relative h-[48px] min-h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-[2px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap font-bold transition-colors snap-start"
            >
              Captados p/ Meus Clientes
            </TabsTrigger>
            <TabsTrigger
              value="disponiveis"
              className="relative h-[48px] min-h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-[2px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap font-bold transition-colors snap-start"
            >
              Disponíveis Geral
              {looseCount > 0 && (
                <span className="ml-[8px] inline-flex items-center justify-center min-w-[20px] h-[20px] bg-[#1A3A52] text-white rounded-full text-[10px] font-bold px-1.5">
                  {looseCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="captados"
              className="relative h-[48px] min-h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-[2px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap font-bold transition-colors snap-start"
            >
              Todos os Captados
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="relative h-[48px] min-h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-[2px] data-[state=active]:border-[#1A3A52] data-[state=active]:text-[#1A3A52] data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap font-bold transition-colors snap-start"
            >
              Histórico
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="vincular" className="mt-[24px]">
          <PropertiesToLinkView />
        </TabsContent>

        <TabsContent value="demandas" className="mt-[24px]">
          {activeDemands.length === 0 ? (
            <div className="text-center py-[48px] bg-background border rounded-[12px] border-dashed">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground font-medium">
                Nenhuma demanda de venda no momento
              </p>
            </div>
          ) : (
            <div className="grid gap-[12px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {activeDemands.map((demand) => (
                <DemandCard key={demand.id} demand={demand} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="meus-clientes" className="mt-[24px]">
          <MyClientsCapturedView filterType="Venda" />
        </TabsContent>

        <TabsContent value="disponiveis" className="mt-[24px]">
          <LoosePropertiesView />
        </TabsContent>

        <TabsContent value="captados" className="mt-[24px]">
          <CapturedPropertiesView
            filterType="Venda"
            emptyStateText="Nenhum imóvel de venda captado no momento"
          />
        </TabsContent>

        <TabsContent value="historico" className="mt-[24px]">
          {historyDemands.length === 0 ? (
            <div className="text-center py-[48px] bg-background border rounded-[12px] border-dashed">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground font-medium">
                Nenhum histórico de venda no momento
              </p>
            </div>
          ) : (
            <div className="grid gap-[12px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {historyDemands.map((demand) => (
                <DemandCard key={demand.id} demand={demand} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
