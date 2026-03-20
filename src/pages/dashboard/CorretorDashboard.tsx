import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { MyDemandsView } from '@/components/MyDemandsView'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { ScrollableTabs } from '@/components/ScrollableTabs'
import { HistoricoTab } from '@/components/dashboard/HistoricoTab'
import useAppStore from '@/stores/useAppStore'

export function CorretorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { demands, currentUser } = useAppStore()
  const currentTab = searchParams.get('tab') || 'minhas-demandas'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'minhas-demandas', label: 'Meus Clientes' },
    { value: 'disponiveis-geral', label: 'Propriedades Disponíveis' },
    { value: 'historico', label: 'Histórico' },
  ]

  return (
    <div className="space-y-[16px] md:space-y-[24px]">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <ScrollableTabs
          tabs={tabs}
          activeTab={currentTab}
          onTabChange={handleTabChange}
          className="sticky top-[64px] lg:top-[72px] bg-[#F5F5F5] pt-2 z-20 -mx-4 px-4 sm:mx-0 sm:px-0"
        />

        <div className="mt-4 transition-opacity duration-300 ease-in animate-in fade-in">
          <TabsContent value="minhas-demandas" className="m-0 border-none">
            <MyDemandsView filterType="Venda" />
          </TabsContent>

          <TabsContent value="disponiveis-geral" className="m-0 border-none">
            <CapturedPropertiesView
              filterType="Venda"
              emptyStateText="Nenhum imóvel solto disponível no momento."
            />
          </TabsContent>

          <TabsContent value="historico" className="m-0 border-none">
            <HistoricoTab userDemands={demands.filter((d) => d.createdBy === currentUser?.id)} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
