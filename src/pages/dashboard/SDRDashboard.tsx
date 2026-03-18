import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { MyDemandsView } from '@/components/MyDemandsView'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { ScrollableTabs } from '@/components/ScrollableTabs'

export function SDRDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'minhas-demandas'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'minhas-demandas', label: 'Minhas Demandas' },
    { value: 'cadastrados-meus-clientes', label: 'Cadastrados p/ Meus Clientes' },
    { value: 'disponiveis-geral', label: 'Disponíveis Geral' },
    { value: 'todos-captados', label: 'Todos os Captados' },
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

        <TabsContent value="minhas-demandas" className="mt-4">
          <MyDemandsView filterType="Aluguel" />
        </TabsContent>
        <TabsContent value="cadastrados-meus-clientes" className="mt-4">
          <CapturedPropertiesView
            filterType="Aluguel"
            emptyStateText="Nenhum imóvel cadastrado para seus clientes no momento."
          />
        </TabsContent>
        <TabsContent value="disponiveis-geral" className="mt-4">
          <CapturedPropertiesView
            filterType="Aluguel"
            emptyStateText="Nenhum imóvel solto disponível."
          />
        </TabsContent>
        <TabsContent value="todos-captados" className="mt-4">
          <CapturedPropertiesView filterType="Aluguel" emptyStateText="Nenhum imóvel captado." />
        </TabsContent>
        <TabsContent value="historico" className="mt-4">
          <div className="p-8 text-center text-muted-foreground bg-white rounded-xl border border-dashed">
            <p>Histórico em construção...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
