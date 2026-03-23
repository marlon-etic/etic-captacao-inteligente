import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { MyDemandsViewCaptador } from '@/components/MyDemandsViewCaptador'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { ScrollableTabs } from '@/components/ScrollableTabs'

export function CaptadorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'demandas-venda'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'demandas-venda', label: 'Demandas (Venda)' },
    { value: 'demandas-aluguel', label: 'Demandas (Aluguel)' },
    { value: 'meus-captados', label: 'Meus Captados' },
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
          <TabsContent value="demandas-venda" className="m-0 border-none">
            <MyDemandsViewCaptador filterType="Venda" />
          </TabsContent>
          <TabsContent value="demandas-aluguel" className="m-0 border-none">
            <MyDemandsViewCaptador filterType="Aluguel" />
          </TabsContent>
          <TabsContent value="meus-captados" className="m-0 border-none">
            <CapturedPropertiesView emptyStateText="Você ainda não captou nenhum imóvel." />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
