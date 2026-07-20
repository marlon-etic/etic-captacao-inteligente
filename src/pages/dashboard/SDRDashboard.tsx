import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { ScrollableTabs } from '@/components/ScrollableTabs'
import { UltimosImoveisTab } from '@/components/UltimosImoveisTab'
import { useSdrQueries } from '@/hooks/use-sdr-queries'
import { FilterBar } from '@/components/sdr-dashboard/FilterBar'
import { MetricsCardsSdr } from '@/components/sdr-dashboard/MetricsCardsSdr'
import { ListasSdr } from '@/components/sdr-dashboard/ListasSdr'
import { AlertasBannerSdr } from '@/components/sdr-dashboard/AlertasBannerSdr'
import { ChartsSdr } from '@/components/sdr-dashboard/ChartsSdr'
import { ActiveCampaignsWidget } from '@/components/campanhas/ActiveCampaignsWidget'
import { DashboardFoco } from '@/components/dashboard/DashboardFoco'
import { useAuth } from '@/hooks/use-auth'

export function SDRDashboard() {
  const { data, loading } = useSdrQueries()
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'visao-geral'

  const role = user?.user_metadata?.role || user?.app_metadata?.role || 'sdr'
  const isLocacao = role === 'sdr'

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'visao-geral', label: 'Visão Geral' },
    { value: 'ultimos-imoveis', label: 'Últimos Imóveis' },
  ]

  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-8 pt-8 pb-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#1A3A52]">
            Dashboard {isLocacao ? 'SDR' : 'Corretor'}
          </h2>
          <p className="text-gray-500 font-medium">
            Acompanhamento e gestão de demandas em tempo real
          </p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <ScrollableTabs
          tabs={tabs}
          activeTab={currentTab}
          onTabChange={handleTabChange}
          className="sticky top-[64px] lg:top-[72px] bg-[#F5F5F5] pt-2 pb-1 z-[50] -mx-4 px-4 sm:mx-0 sm:px-0 shadow-sm"
        />

        <div className="transition-opacity duration-300 ease-in animate-in fade-in relative z-10">
          <TabsContent value="visao-geral" className="m-0 border-none">
            <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 pb-24 md:pb-8 animate-fade-in">
              <AlertasBannerSdr data={data} loading={loading} isLocacao={isLocacao} />

              <DashboardFoco />

              <ActiveCampaignsWidget />

              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start gap-4">
                <FilterBar />
              </div>

              <MetricsCardsSdr data={data} loading={loading} />

              <ListasSdr data={data} loading={loading} isLocacao={isLocacao} />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                <ChartsSdr data={data} loading={loading} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ultimos-imoveis" className="m-0 border-none">
            <div className="p-4 md:p-8 pt-6 pb-24 md:pb-8">
              <UltimosImoveisTab />
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
