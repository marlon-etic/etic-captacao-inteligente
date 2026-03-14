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

  // Calculate Header Metrics
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

  // Filter demands
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
      if (a.isPrioritized && !b.isPrioritized) return -1
      if (!a.isPrioritized && b.isPrioritized) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })
  }, [demands, demandFilter, periodFilter, priorityFilter])

  // Group similar demands
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
      ungrouped: [...ungrouped, ...others].sort(
        (a, b) => (b.isPrioritized ? 1 : 0) - (a.isPrioritized ? 1 : 0),
      ),
    }
  }, [filteredDemands])

  if (!currentUser) return null

  return (
    <div className="space-y-4 md:space-y-5 lg:space-y-6 animate-fade-in">
      {/* 1. Header Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 lg:gap-6">
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
            'pb-3 px-2 text-[16px] md:text-[18px] lg:text-[20px] font-bold border-b-[3px] transition-colors whitespace-nowrap min-h-[48px] md:min-h-[44px] lg:min-h-[40px]',
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
            'pb-3 px-2 text-[16px] md:text-[18px] lg:text-[20px] font-bold border-b-[3px] transition-colors whitespace-nowrap min-h-[48px] md:min-h-[44px] lg:min-h-[40px]',
            mainTab === 'captados'
              ? 'border-[#00AA00] text-[#00AA00]'
              : 'border-transparent text-[#999999] hover:text-[#333333]',
          )}
        >
          Meus Imóveis Captados
        </button>
      </div>

      {mainTab === 'demandas' ? (
        <div className="space-y-4 md:space-y-5 lg:space-y-6 animate-fade-in-up">
          {/* 3. Sticky Navigation Tabs for Demands */}
          <div className="sticky top-[104px] md:top-[48px] lg:top-[44px] z-30 bg-background/95 backdrop-blur py-3 md:py-4 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide pb-1">
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
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 bg-[#F9F9F9] p-3 rounded-xl border border-[#E5E5E5] overflow-x-auto scrollbar-hide">
            <Filter className="w-4 h-4 text-[#999999] shrink-0" />
            <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold text-[#999999] uppercase shrink-0">
              Período:
            </span>
            {['todas', '24h', '7d', '30d'].map((p) => (
              <Badge
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={cn(
                  'cursor-pointer shrink-0 min-h-[48px] md:min-h-[44px] lg:min-h-[40px] px-3',
                  periodFilter === p
                    ? 'bg-[#333333] text-white'
                    : 'bg-white text-[#333333] border border-[#E5E5E5] hover:bg-[#E5E5E5]',
                )}
              >
                {p === 'todas' ? 'Todos' : p}
              </Badge>
            ))}
            <div className="w-[1px] h-5 bg-[#E5E5E5] mx-2 shrink-0" />
            <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold text-[#999999] uppercase shrink-0">
              Prioridade:
            </span>
            {['todas', 'priorizadas', 'novas'].map((p) => (
              <Badge
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  'cursor-pointer shrink-0 capitalize min-h-[48px] md:min-h-[44px] lg:min-h-[40px] px-3',
                  priorityFilter === p
                    ? 'bg-[#333333] text-white'
                    : 'bg-white text-[#333333] border border-[#E5E5E5] hover:bg-[#E5E5E5]',
                )}
              >
                {p}
              </Badge>
            ))}
            <div className="flex-1 min-w-[20px]"></div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPeriodFilter('todas')
                setPriorityFilter('todas')
              }}
              className="text-[#4444FF] font-bold text-[14px] leading-[20px] h-[48px] md:h-[44px] lg:h-[40px] shrink-0 min-w-[48px] hover:bg-[#4444FF]/10"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Limpar
            </Button>
          </div>

          {/* Demands List */}
          {filteredDemands.length === 0 ? (
            <div className="text-center py-12 bg-[#F9F9F9] border rounded-xl border-dashed border-[#E5E5E5]">
              <Search className="w-12 h-12 text-[#999999]/50 mx-auto mb-3" />
              <p className="text-[14px] md:text-[14px] lg:text-[14px] leading-[20px] text-[#999999] font-medium">
                Nenhuma demanda encontrada com estes filtros.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:gap-5 lg:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {groupedDemands.groups.map((g) => (
                <GroupedDemandCard key={g.id} group={g} onAction={() => {}} />
              ))}
              {groupedDemands.ungrouped.map((d) => {
                const ageHours = (Date.now() - new Date(d.createdAt).getTime()) / 3600000
                const isNew = ageHours <= 24 && d.status === 'Pendente'
                return <DemandCard key={d.id} demand={d} isNewDemand={isNew} />
              })}
            </div>
          )}
        </div>
      ) : (
        <CapturedPropertiesView />
      )}
    </div>
  )
}

function MetricCard({ title, value, icon: Icon, color, trend }: any) {
  return (
    <Card className="rounded-[12px] border border-[#E5E5E5] shadow-sm bg-[#FFFFFF] overflow-hidden min-h-[100px] md:min-h-[120px] lg:min-h-[140px] flex flex-col justify-center">
      <CardContent className="p-4 md:p-5 lg:p-6 flex items-center justify-between w-full">
        <div className="flex flex-col">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold text-[#999999] uppercase tracking-wider mb-1 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] md:text-[32px] lg:text-[36px] font-black text-[#333333] leading-[32px] md:leading-[36px] lg:leading-[40px]">
              {value}
            </span>
            <span
              className={cn(
                'text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold',
                color,
              )}
            >
              {trend}
            </span>
          </div>
        </div>
        <div
          className={cn(
            'w-[44px] h-[44px] md:w-[48px] md:h-[48px] lg:w-[56px] lg:h-[56px] rounded-xl bg-[#F9F9F9] flex items-center justify-center border border-[#E5E5E5] shrink-0 ml-2',
            color,
          )}
        >
          <Icon className="w-5 h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 currentColor" />
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
        'flex items-center justify-center gap-2 h-[48px] md:h-[44px] lg:h-[40px] px-4 rounded-full border-2 transition-all whitespace-nowrap min-w-[48px]',
        active
          ? cn('text-white shadow-sm', activeBg, color)
          : 'bg-white text-[#999999] border-[#E5E5E5] hover:border-[#333333] hover:text-[#333333]',
      )}
    >
      <span className="text-[14px] md:text-[14px] lg:text-[14px] font-bold leading-[20px]">
        {label}
      </span>
      <span
        className={cn(
          'text-[12px] md:text-[13px] lg:text-[14px] font-bold px-1.5 py-0.5 rounded-full leading-[16px]',
          active ? 'bg-white/20 text-white' : 'bg-[#E5E5E5] text-[#333333]',
        )}
      >
        {count}
      </span>
    </button>
  )
}
