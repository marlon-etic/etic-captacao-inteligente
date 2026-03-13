import { Search } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DemandCard } from '@/components/DemandCard'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { LoosePropertiesView } from '@/components/LoosePropertiesView'
import useAppStore from '@/stores/useAppStore'

export function SDRDashboard() {
  const { demands, currentUser, looseProperties } = useAppStore()

  const myDemands = demands.filter((d) => d.createdBy === currentUser?.id)
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
    if (p.propertyType === 'Aluguel') return true
    return false
  }).length

  return (
    <div className="px-[16px] pb-[72px] pt-[24px] max-w-7xl mx-auto flex flex-col gap-[24px]">
      <Tabs defaultValue="demandas" className="w-full">
        <TabsList className="flex h-[48px] w-full bg-transparent p-0 border-b overflow-x-auto justify-start gap-[16px] rounded-none">
          <TabsTrigger
            value="demandas"
            className="relative h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap"
          >
            Minhas Demandas
            {activeCount > 0 && (
              <span className="ml-[8px] inline-flex items-center justify-center w-[20px] h-[20px] bg-primary text-primary-foreground rounded-full text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="disponiveis"
            className="relative h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap"
          >
            Disponíveis
            {looseCount > 0 && (
              <span className="ml-[8px] inline-flex items-center justify-center w-[20px] h-[20px] bg-blue-600 text-white rounded-full text-[10px] font-bold">
                {looseCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="captados"
            className="relative h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap"
          >
            Captados
          </TabsTrigger>
          <TabsTrigger
            value="historico"
            className="relative h-[48px] px-[16px] text-[14px] data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none bg-transparent whitespace-nowrap"
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="demandas" className="mt-[24px]">
          {activeDemands.length === 0 ? (
            <div className="text-center py-[48px] bg-background border rounded-[12px] border-dashed">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground font-medium">
                Nenhuma demanda no momento
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

        <TabsContent value="disponiveis" className="mt-[24px]">
          <LoosePropertiesView />
        </TabsContent>

        <TabsContent value="captados" className="mt-[24px]">
          <CapturedPropertiesView />
        </TabsContent>

        <TabsContent value="historico" className="mt-[24px]">
          {historyDemands.length === 0 ? (
            <div className="text-center py-[48px] bg-background border rounded-[12px] border-dashed">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-[14px] text-muted-foreground font-medium">
                Nenhuma demanda no momento
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
