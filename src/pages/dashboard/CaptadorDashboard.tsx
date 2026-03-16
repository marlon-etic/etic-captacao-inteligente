import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { FileText, Home, Handshake, Search, Filter, RefreshCw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DemandCard } from '@/components/DemandCard'
import { GroupedDemandCard } from '@/components/GroupedDemandCard'
import { GamificationWidget } from '@/components/dashboard/GamificationWidget'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export function CaptadorDashboard() {
  const { demands, currentUser, looseProperties } = useAppStore()
  const [searchParams, setSearchParams] = useSearchParams()

  const mainTab = searchParams.get('tab') === 'captados' ? 'captados' : 'demandas'
  const [demandFilter, setDemandFilter] = useState<'todas' | 'venda' | 'aluguel' | 'novas'>('todas')
  const [periodFilter, setPeriodFilter] = useState('todas')
  const [priorityFilter, setPriorityFilter] = useState('todas')

  const setMainTab = (tab: 'demandas' | 'captados') => {
    setSearchParams(tab === 'demandas' ? {} : { tab })
  }

  const headerMetrics = useMemo(() => {
    const userDemands = demands.filter(
      (d) =>
        d.assignedTo === currentUser?.id ||
        d.capturedProperties?.some((p) => p.captador_id === currentUser?.id),
    )
    const recebidas = userDemands.length
    const captados = currentUser?.stats.imoveisCaptadosSemana || 0
    const fechados = currentUser?.stats.negociosFechados || 0

    return { recebidas, captados, fechados }
  }, [demands, currentUser])

  const filteredDemands = useMemo(() => {
    let result = demands

    if (demandFilter === 'venda') result = result.filter((d) => d.type === 'Venda')
    if (demandFilter === 'aluguel') result = result.filter((d) => d.type === 'Aluguel')
    if (demandFilter === 'novas') {
      const now = Date.now()
      result = result.filter((d) => {
        if (d.status !== 'Pendente' || d.isExtension48h) return false
        const hoursAge = (now - new Date(d.createdAt).getTime()) / 3600000
        return hoursAge <= 24
      })
    }

    if (periodFilter === '24h') {
      const now = Date.now()
      result = result.filter((d) => (now - new Date(d.createdAt).getTime()) / 3600000 <= 24)
    } else if (periodFilter === '7d') {
      const now = Date.now()
      result = result.filter((d) => (now - new Date(d.createdAt).getTime()) / 86400000 <= 7)
    } else if (periodFilter === '30d') {
      const now = Date.now()
      result = result.filter((d) => (now - new Date(d.createdAt).getTime()) / 86400000 <= 30)
    }

    if (priorityFilter === 'priorizadas') {
      result = result.filter((d) => d.isPrioritized && d.status !== 'Perdida')
    } else if (priorityFilter === 'novas') {
      const now = Date.now()
      result = result.filter(
        (d) => (now - new Date(d.createdAt).getTime()) / 3600000 <= 24 && d.status === 'Pendente',
      )
    }

    return result.sort((a, b) => {
      const now = Date.now()
      const aAge = (now - new Date(a.createdAt).getTime()) / 3600000
      const bAge = (now - new Date(b.createdAt).getTime()) / 3600000

      const aIsNew =
        aAge <= 24 && a.status === 'Pendente' && !a.isPrioritized && a.status !== 'Perdida'
      const bIsNew =
        bAge <= 24 && b.status === 'Pendente' && !b.isPrioritized && b.status !== 'Perdida'

      if (aIsNew && !bIsNew) return -1
      if (!aIsNew && bIsNew) return 1

      if (a.isPrioritized && !b.isPrioritized) return -1
      if (!a.isPrioritized && b.isPrioritized) return 1

      if (a.status === 'Perdida' && b.status !== 'Perdida') return 1
      if (a.status !== 'Perdida' && b.status === 'Perdida') return -1

      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [demands, demandFilter, periodFilter, priorityFilter])

  const groupedDemands = useMemo(() => {
    const groups: any[] = []
    const ungrouped: any[] = []
    const pendingDemands = filteredDemands.filter(
      (d) => ['Pendente', 'Em Captação'].includes(d.status) && !d.isPrioritized,
    )

    const map = new Map<string, any[]>()
    pendingDemands.forEach((d) => {
      const key = `${d.location}|${d.type}|${d.bedrooms || 0}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(d)
    })

    map.forEach((group) => {
      if (group.length > 1) {
        groups.push({
          id: `group-${group[0].id}`,
          location: group[0].location,
          type: group[0].type,
          bedrooms: group[0].bedrooms || 0,
          bathrooms: group[0].bathrooms || 0,
          parkingSpots: group[0].parkingSpots || 0,
          minBudget: Math.min(...group.map((d: any) => d.minBudget || 0)),
          maxBudget: Math.max(...group.map((d: any) => d.maxBudget || 0)),
          demands: group,
        })
      } else {
        ungrouped.push(group[0])
      }
    })

    const others = filteredDemands.filter(
      (d) => !['Pendente', 'Em Captação'].includes(d.status) || d.isPrioritized,
    )

    return {
      groups,
      ungrouped: [...ungrouped, ...others].sort((a, b) => {
        const now = Date.now()
        const aAge = (now - new Date(a.createdAt).getTime()) / 3600000
        const bAge = (now - new Date(b.createdAt).getTime()) / 3600000

        const aIsNew =
          aAge <= 24 && a.status === 'Pendente' && !a.isPrioritized && a.status !== 'Perdida'
        const bIsNew =
          bAge <= 24 && b.status === 'Pendente' && !b.isPrioritized && b.status !== 'Perdida'

        if (aIsNew && !bIsNew) return -1
        if (!aIsNew && bIsNew) return 1

        if (a.isPrioritized && !b.isPrioritized) return -1
        if (!a.isPrioritized && b.isPrioritized) return 1

        if (a.status === 'Perdida' && b.status !== 'Perdida') return 1
        if (a.status !== 'Perdida' && b.status === 'Perdida') return -1

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    }
  }, [filteredDemands])

  if (!currentUser) return null

  return (
    <div className="flex flex-col gap-[16px] md:gap-[20px] animate-fade-in">
      {/* 1. Header Metrics */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-[12px] min-[480px]:gap-[16px] md:gap-[20px]">
        <MetricCard
          title="Demandas Recebidas"
          value={headerMetrics.recebidas}
          icon={FileText}
          color="text-[#4444FF]"
          trend="Na base"
        />
        <MetricCard
          title="Imóveis Captados"
          value={headerMetrics.captados}
          icon={Home}
          color="text-[#00AA00]"
          trend="Esta semana"
        />
        <MetricCard
          title="Negócios Fechados"
          value={headerMetrics.fechados}
          icon={Handshake}
          color="text-[#FF4444]"
          trend="Total"
        />
      </div>

      {/* 2. Gamification Module */}
      <GamificationWidget currentUser={currentUser} />

      {/* Main Tabs */}
      <div className="flex gap-4 border-b border-[#E5E5E5] sticky top-[56px] md:top-0 z-40 bg-background pt-4 md:pt-0 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setMainTab('demandas')}
          className={cn(
            'pb-3 px-2 text-[16px] min-[480px]:text-[18px] md:text-[20px] font-bold border-b-[3px] transition-colors whitespace-nowrap min-h-[48px] md:min-h-[44px] lg:min-h-[40px]',
            mainTab === 'demandas'
              ? 'border-[#4444FF] text-[#4444FF]'
              : 'border-transparent text-[#999999] hover:text-[#333333]',
          )}
        >
          Painel de Demandas
        </button>
        <button
          onClick={() => setMainTab('captados')}
          className={cn(
            'pb-3 px-2 text-[16px] min-[480px]:text-[18px] md:text-[20px] font-bold border-b-[3px] transition-colors whitespace-nowrap min-h-[48px] md:min-h-[44px] lg:min-h-[40px]',
            mainTab === 'captados'
              ? 'border-[#00AA00] text-[#00AA00]'
              : 'border-transparent text-[#999999] hover:text-[#333333]',
          )}
        >
          Meus Imóveis Captados
        </button>
      </div>

      <div key={mainTab} className="animate-tab-fade flex flex-col gap-[16px] md:gap-[20px]">
        {mainTab === 'demandas' ? (
          <>
            {/* 3. Sticky Navigation Tabs and Quick Filters */}
            <div className="sticky top-[104px] md:top-[48px] lg:top-[44px] z-30 bg-background/95 backdrop-blur py-3 md:py-4 -mx-[16px] min-[480px]:-mx-[24px] md:mx-0 px-[16px] min-[480px]:px-[24px] md:px-0 flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              {/* Navigation Tabs */}
              <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-1 md:pb-0 shrink-0">
                <FilterTab
                  label="📊 Todas"
                  active={demandFilter === 'todas'}
                  onClick={() => setDemandFilter('todas')}
                  count={demands.length}
                />
                <FilterTab
                  label="🏢 Venda"
                  active={demandFilter === 'venda'}
                  onClick={() => setDemandFilter('venda')}
                  count={demands.filter((d) => d.type === 'Venda').length}
                  color="border-[#FF4444]"
                  activeBg="bg-[#FF4444]"
                />
                <FilterTab
                  label="🏠 Aluguel"
                  active={demandFilter === 'aluguel'}
                  onClick={() => setDemandFilter('aluguel')}
                  count={demands.filter((d) => d.type === 'Aluguel').length}
                  color="border-[#4444FF]"
                  activeBg="bg-[#4444FF]"
                />
                <FilterTab
                  label="🆕 Novas"
                  active={demandFilter === 'novas'}
                  onClick={() => setDemandFilter('novas')}
                  count={
                    demands.filter((d) => {
                      const age = (Date.now() - new Date(d.createdAt).getTime()) / 3600000
                      return age <= 24 && d.status === 'Pendente'
                    }).length
                  }
                  color="border-[#00AA00]"
                  activeBg="bg-[#00AA00]"
                />
              </div>

              {/* Quick Filters */}
              <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 bg-[#F9F9F9] md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-[#E5E5E5] md:border-transparent overflow-x-auto scrollbar-hide flex-1 w-full">
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
                  <Filter className="w-4 h-4 text-[#999999] shrink-0" />
                  <span className="text-[12px] min-[480px]:text-[13px] md:text-[14px] leading-tight font-bold text-[#999999] uppercase shrink-0">
                    Período:
                  </span>
                  {['todas', '24h', '7d', '30d'].map((p) => (
                    <Badge
                      key={p}
                      onClick={() => setPeriodFilter(p)}
                      className={cn(
                        'cursor-pointer shrink-0 min-h-[40px] px-3 transition-colors',
                        periodFilter === p
                          ? 'bg-[#333333] text-white'
                          : 'bg-white text-[#333333] border border-[#E5E5E5] hover:bg-[#E5E5E5]',
                      )}
                    >
                      {p === 'todas' ? 'Todos' : p}
                    </Badge>
                  ))}
                </div>
                <div className="hidden min-[480px]:block w-[1px] h-5 bg-[#E5E5E5] shrink-0" />
                <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
                  <span className="text-[12px] min-[480px]:text-[13px] md:text-[14px] leading-tight font-bold text-[#999999] uppercase shrink-0">
                    Prioridade:
                  </span>
                  {['todas', 'priorizadas', 'novas'].map((p) => (
                    <Badge
                      key={p}
                      onClick={() => setPriorityFilter(p)}
                      className={cn(
                        'cursor-pointer shrink-0 capitalize min-h-[40px] px-3 transition-colors',
                        priorityFilter === p
                          ? 'bg-[#333333] text-white'
                          : 'bg-white text-[#333333] border border-[#E5E5E5] hover:bg-[#E5E5E5]',
                      )}
                    >
                      {p}
                    </Badge>
                  ))}
                </div>
                <div className="flex-1 min-w-0 min-[480px]:min-w-[20px]"></div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPeriodFilter('todas')
                    setPriorityFilter('todas')
                  }}
                  className="text-[#4444FF] font-bold text-[14px] w-full min-[480px]:w-auto h-[40px] hover:bg-[#4444FF]/10 shrink-0"
                >
                  <RefreshCw className="w-4 h-4 mr-1.5" /> Limpar
                </Button>
              </div>
            </div>

            {/* Demands List */}
            <div
              key={`${demandFilter}-${periodFilter}-${priorityFilter}`}
              className="animate-slide-in-filters"
            >
              {filteredDemands.length === 0 ? (
                <div className="text-center py-12 bg-[#F9F9F9] border rounded-xl border-dashed border-[#E5E5E5]">
                  <Search className="w-12 h-12 text-[#999999]/50 mx-auto mb-3" />
                  <p className="text-[14px] md:text-[16px] leading-tight text-[#999999] font-medium break-words whitespace-normal">
                    Nenhuma demanda encontrada com estes filtros.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 min-[1440px]:grid-cols-4 gap-[12px] min-[480px]:gap-[16px] md:gap-[20px]">
                  {groupedDemands.groups.map((g, i) => (
                    <div
                      key={g.id}
                      className="opacity-0 animate-cascade-fade w-full h-full flex"
                      style={{ animationDelay: `${i * 50}ms` }}
                    >
                      <GroupedDemandCard group={g} onAction={() => {}} />
                    </div>
                  ))}
                  {groupedDemands.ungrouped.map((d, i) => {
                    const ageHours = (Date.now() - new Date(d.createdAt).getTime()) / 3600000
                    const isNew = ageHours <= 24 && d.status === 'Pendente'
                    return (
                      <DemandCard
                        key={d.id}
                        demand={d}
                        isNewDemand={isNew}
                        index={i + groupedDemands.groups.length}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <CapturedPropertiesView />
        )}
      </div>
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <Card className="rounded-[12px] border border-[#E5E5E5] shadow-sm bg-[#FFFFFF] overflow-hidden min-h-[100px] flex flex-col justify-center w-full transition-all duration-150 ease-in-out hover:brightness-95 hover:shadow-lg">
      <CardContent className="p-[16px] flex items-center justify-between w-full">
        <div className="flex flex-col break-words whitespace-normal flex-1 mr-2">
          <p className="text-[12px] min-[480px]:text-[13px] md:text-[14px] font-bold text-[#999999] uppercase tracking-wider mb-1 leading-tight break-words whitespace-normal">
            {title}
          </p>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-[28px] min-[480px]:text-[32px] md:text-[36px] font-black text-[#333333] leading-none">
              {value}
            </span>
            <span
              className={cn(
                'text-[12px] min-[480px]:text-[13px] md:text-[14px] leading-tight font-bold break-words whitespace-normal',
                color,
              )}
            >
              {trend}
            </span>
          </div>
        </div>
        <div
          className={cn(
            'w-[44px] h-[44px] min-[480px]:w-[48px] min-[480px]:h-[48px] md:w-[56px] md:h-[56px] rounded-xl bg-[#F9F9F9] flex items-center justify-center border border-[#E5E5E5] shrink-0',
            color,
          )}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6 currentColor" />
        </div>
      </CardContent>
    </Card>
  )
}

function FilterTab({
  label,
  active,
  onClick,
  count,
  color = 'border-[#333333]',
  activeBg = 'bg-[#333333]',
}: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center justify-center gap-2 h-[48px] md:h-[44px] lg:h-[40px] px-4 rounded-full border-2 transition-all duration-100 ease-in-out whitespace-nowrap min-w-[48px] hover:scale-[1.05] active:scale-[0.95]',
        active
          ? cn('text-white shadow-sm', activeBg, color)
          : 'bg-white text-[#999999] border-[#E5E5E5] hover:border-[#333333] hover:text-[#333333]',
      )}
    >
      <span className="text-[14px] min-[480px]:text-[14px] font-bold leading-tight">{label}</span>
      <span
        className={cn(
          'text-[12px] min-[480px]:text-[13px] font-bold px-1.5 py-0.5 rounded-full leading-none',
          active ? 'bg-white/20 text-white' : 'bg-[#E5E5E5] text-[#333333]',
        )}
      >
        {count}
      </span>
    </button>
  )
}
