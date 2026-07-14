import { useSearchParams } from 'react-router-dom'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { MyDemandsView } from '@/components/MyDemandsView'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { ScrollableTabs } from '@/components/ScrollableTabs'
import { BuscarImoveisTab } from '@/components/BuscarImoveisTab'
import { UltimosImoveisTab } from '@/components/UltimosImoveisTab'
import { MetricsCardsSdr } from '@/components/sdr-dashboard/MetricsCardsSdr'
import { ChartsSdr } from '@/components/sdr-dashboard/ChartsSdr'
import { ListasSdr } from '@/components/sdr-dashboard/ListasSdr'
import { useSdrQueries } from '@/hooks/use-sdr-queries'
import { useSdrStore } from '@/hooks/use-sdr-store'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function CorretorDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('tab') || 'visao-geral'
  const { data, loading } = useSdrQueries()
  const { periodo, setPeriodo } = useSdrStore()

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  const tabs = [
    { value: 'visao-geral', label: 'Visão Geral' },
    { value: 'ultimos-imoveis', label: 'Últimos Imóveis' },
    { value: 'demandas', label: 'Demandas' },
    { value: 'cadastrados', label: 'Imóveis Vinculados' },
    { value: 'buscar-imoveis', label: 'Buscar Imóveis' },
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
          <TabsContent value="visao-geral" className="m-0 border-none space-y-6">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <div>
                <h2 className="text-lg font-black text-[#1A3A52]">Visão Geral de Vendas</h2>
                <p className="text-sm text-gray-500">Métricas e acompanhamento de performance</p>
              </div>
              <Select value={periodo} onValueChange={(val: any) => setPeriodo(val)}>
                <SelectTrigger className="w-[160px] h-10 font-bold bg-gray-50">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hoje">Hoje</SelectItem>
                  <SelectItem value="semana">Esta Semana</SelectItem>
                  <SelectItem value="mes">Este Mês</SelectItem>
                  <SelectItem value="sempre">Todo o Período</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <MetricsCardsSdr data={data} loading={loading} />
            <ChartsSdr data={data} loading={loading} />
            <ListasSdr data={data} loading={loading} isLocacao={false} />
          </TabsContent>

          <TabsContent value="demandas" className="m-0 border-none">
            <MyDemandsView filterType="Venda" />
          </TabsContent>

          <TabsContent value="cadastrados" className="m-0 border-none">
            <CapturedPropertiesView
              filterType="Venda"
              source="linked"
              emptyStateText="Nenhum imóvel cadastrado ou vinculado no momento."
            />
          </TabsContent>

          <TabsContent value="ultimos-imoveis" className="m-0 border-none">
            <UltimosImoveisTab />
          </TabsContent>

          <TabsContent value="buscar-imoveis" className="m-0 border-none">
            <BuscarImoveisTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
