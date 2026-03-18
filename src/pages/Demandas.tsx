import { useState, useTransition, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { DemandCard } from '@/components/DemandCard'
import { GroupedDemandCard } from '@/components/GroupedDemandCard'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'
import { useDemandGrouping } from '@/hooks/useDemandGrouping'

export default function Demandas() {
  const { demands, notifications, markNotificationAsRead } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const currentTab = searchParams.get('tab') === 'captados' ? 'captados' : 'demandas'

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')

  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    type: 'all',
    period: 'all',
  })

  const [isPending, startTransition] = useTransition()

  // Reset notifications badge when viewing captados tab
  useEffect(() => {
    if (currentTab === 'captados') {
      const unreadProps = notifications?.filter(
        (n) => n.tipo_notificacao === 'novo_imovel' && !n.lida,
      )
      if (unreadProps && unreadProps.length > 0) {
        unreadProps.forEach((n) => markNotificationAsRead(n.id))
      }
    }
  }, [currentTab, notifications, markNotificationAsRead])

  const applyFilters = () => {
    startTransition(() => {
      setActiveFilters({
        status: filterStatus,
        type: filterType,
        period: filterPeriod,
      })
    })
  }

  const { groupedDemands, ungroupedDemands } = useDemandGrouping({
    demands,
    filters: activeFilters,
  })

  const filterHash = JSON.stringify(activeFilters)

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val })
  }

  return (
    <div className="space-y-[16px] md:space-y-[24px]">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight text-[#1A3A52]">Painel de Demandas</h1>
        <p className="text-[#999999] text-sm">
          Gerencie os requisitos dos clientes e acompanhe os imóveis captados.
        </p>
      </div>

      <Tabs
        value={currentTab}
        onValueChange={handleTabChange}
        className="w-full animate-fade-in-up delay-75"
      >
        <div className="sticky top-[64px] md:top-[72px] z-20 bg-[#F5F5F5] pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
          <TabsList className="grid w-full grid-cols-2 h-[48px] bg-[#FFFFFF] border-[2px] border-[#2E5F8A]/20 shadow-sm p-1">
            <TabsTrigger
              value="demandas"
              className="h-full text-[14px] sm:text-[16px] data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Demandas Abertas
            </TabsTrigger>
            <TabsTrigger
              value="captados"
              className="h-full text-[14px] sm:text-[16px] data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200"
            >
              Imóveis Captados
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="demandas" className="mt-4 space-y-[16px]">
          <div className="bg-[#FFFFFF] border-[2px] border-[#2E5F8A]/20 shadow-[0_4px_12px_rgba(26,58,82,0.1)] rounded-xl p-[16px] md:p-[24px] space-y-[16px]">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] items-end">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#999999] uppercase tracking-wider">
                  Status
                </Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="h-[44px]">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="open">Abertas</SelectItem>
                    <SelectItem value="prioritized">Priorizadas</SelectItem>
                    <SelectItem value="lost">Perdidas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#999999] uppercase tracking-wider">
                  Tipo de Demanda
                </Label>
                <div className="flex bg-[#F5F5F5] p-1 rounded-md border border-[#E5E5E5] h-[44px]">
                  <button
                    onClick={() => setFilterType('all')}
                    className={cn(
                      'flex-1 rounded-sm text-sm font-bold transition-all duration-200',
                      filterType === 'all'
                        ? 'bg-[#1A3A52] text-white shadow-md'
                        : 'text-[#999999] hover:bg-[#FFFFFF]',
                    )}
                  >
                    Todas
                  </button>
                  <button
                    onClick={() => setFilterType('Venda')}
                    className={cn(
                      'flex-1 rounded-sm text-sm font-bold transition-all duration-200',
                      filterType === 'Venda'
                        ? 'bg-[#1A3A52] text-white shadow-md'
                        : 'text-[#999999] hover:bg-[#FFFFFF]',
                    )}
                  >
                    Venda
                  </button>
                  <button
                    onClick={() => setFilterType('Aluguel')}
                    className={cn(
                      'flex-1 rounded-sm text-sm font-bold transition-all duration-200',
                      filterType === 'Aluguel'
                        ? 'bg-[#1A3A52] text-white shadow-md'
                        : 'text-[#999999] hover:bg-[#FFFFFF]',
                    )}
                  >
                    Aluguel
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-[#999999] uppercase tracking-wider">
                  Período
                </Label>
                <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                  <SelectTrigger className="h-[44px]">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="30days">30 dias</SelectItem>
                    <SelectItem value="all">Todas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <Button
                onClick={applyFilters}
                className="w-full sm:w-auto h-[44px] gap-2 transition-[transform,background-color,color] duration-100 ease-in-out bg-[#1A3A52] hover:bg-[#1f4866]"
              >
                <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
                Aplicar Filtros
              </Button>
            </div>
          </div>

          <div
            key={filterHash}
            className={cn(
              'grid gap-[16px] md:gap-[24px] grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-slide-in-filters',
              isPending && 'opacity-50',
            )}
          >
            {groupedDemands.map((g, index) => (
              <GroupedDemandCard key={g.id} group={g} />
            ))}

            {ungroupedDemands.map((demand, index) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                index={index + groupedDemands.length}
                isNewDemand={
                  (Date.now() - new Date(demand.createdAt).getTime()) / 3600000 <= 24 &&
                  demand.status === 'Pendente'
                }
              />
            ))}

            {groupedDemands.length === 0 && ungroupedDemands.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-[#FFFFFF] border-[2px] border-dashed border-[#E5E5E5] rounded-xl opacity-0 animate-fade-in-up forwards">
                <div className="text-4xl mb-4">📭</div>
                <p className="text-[#333333] font-bold text-[16px]">Nenhuma demanda no momento</p>
                <p className="text-[#999999] text-[14px]">
                  Tente limpar os filtros ou espere novas solicitações.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="captados" className="mt-4">
          <CapturedPropertiesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
