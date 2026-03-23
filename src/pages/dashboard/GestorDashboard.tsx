import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { MyDemandsViewGestor } from '@/components/MyDemandsViewGestor'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { ScrollableTabs } from '@/components/ScrollableTabs'

export function GestorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'todas-demandas-venda'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'todas-demandas-venda', label: 'Demandas (Venda)' },
    { value: 'todas-demandas-aluguel', label: 'Demandas (Aluguel)' },
    { value: 'todos-captados', label: 'Todos os Imóveis Captados' },
  ]

  return (
    <div className="space-y-[16px] md:space-y-[24px]">
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <ScrollableTabs
          tabs={tabs}
          activeTab={currentTab}
          onTabChange={handleTabChange}
          className="sticky top-[64px] lg:top-[72px] bg-[#F5F5F5] pt-2 z-[40] -mx-4 px-4 sm:mx-0 sm:px-0"
        />

        <div className="mt-4 transition-opacity duration-300 ease-in animate-in fade-in">
          <TabsContent value="todas-demandas-venda" className="m-0 border-none">
            <MyDemandsViewGestor filterType="Venda" />
          </TabsContent>
          <TabsContent value="todas-demandas-aluguel" className="m-0 border-none">
            <MyDemandsViewGestor filterType="Aluguel" />
          </TabsContent>
          <TabsContent value="todos-captados" className="m-0 border-none">
            <CapturedPropertiesView emptyStateText="Nenhum imóvel captado no sistema no momento." />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
