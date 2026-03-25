import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { DemandasAbertasView } from '@/components/DemandasAbertasView'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { DemandasPerdidasView } from '@/components/DemandasPerdidasView'
import { ScrollableTabs } from '@/components/ScrollableTabs'

export function CaptadorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'demandas-abertas'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'demandas-abertas', label: 'Demandas Abertas' },
    { value: 'meus-captados', label: 'Meus Captados' },
    { value: 'perdidos', label: 'Perdidos' },
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
          <TabsContent value="demandas-abertas" className="m-0 border-none">
            <DemandasAbertasView />
          </TabsContent>
          <TabsContent value="meus-captados" className="m-0 border-none">
            <CapturedPropertiesView emptyStateText="Você ainda não captou nenhum imóvel." />
          </TabsContent>
          <TabsContent value="perdidos" className="m-0 border-none">
            <DemandasPerdidasView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
