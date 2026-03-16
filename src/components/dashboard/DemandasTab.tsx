import { useState, useMemo } from 'react'
import { Search, Filter, RefreshCw } from 'lucide-react'
import { DemandCard } from '@/components/DemandCard'
import { GroupedDemandCard } from '@/components/GroupedDemandCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'

export function DemandasTab({ demands }: { demands: Demand[] }) {
  const [demandFilter, setDemandFilter] = useState<'todas' | 'venda' | 'aluguel' | 'novas'>('todas')
  const [periodFilter, setPeriodFilter] = useState('todas')
  const [priorityFilter, setPriorityFilter] = useState('todas')

  const filteredDemands = useMemo(() => {
    let result = demands

    if (demandFilter === 'venda') result = result.filter((d) => d.type === 'Venda')
    if (demandFilter === 'aluguel') result = result.filter((d) => d.type === 'Aluguel')
    if (demandFilter === 'novas') {
      const now = Date.now()
      result = result.filter((d) => {
        if (d.status !== 'Pendente' || d.isExtension48h) return false
        return (now - new Date(d.createdAt).getTime()) / 3600000 <= 24
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

    return result
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

    const sortFn = (a: Demand, b: Demand) => {
      const now = Date.now()
      const aIsNew =
        (now - new Date(a.createdAt).getTime()) / 3600000 <= 24 &&
        a.status === 'Pendente' &&
        !a.isPrioritized &&
        a.status !== 'Perdida'
      const bIsNew =
        (now - new Date(b.createdAt).getTime()) / 3600000 <= 24 &&
        b.status === 'Pendente' &&
        !b.isPrioritized &&
        b.status !== 'Perdida'
      if (aIsNew && !bIsNew) return -1
      if (!aIsNew && bIsNew) return 1
      if (a.isPrioritized && !b.isPrioritized) return -1
      if (!a.isPrioritized && b.isPrioritized) return 1
      if (a.status === 'Perdida' && b.status !== 'Perdida') return 1
      if (a.status !== 'Perdida' && b.status === 'Perdida') return -1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    }

    return { groups, ungrouped: [...ungrouped, ...others].sort(sortFn) }
  }, [filteredDemands])

  return (
    <div className="flex flex-col gap-[16px] md:gap-[20px] animate-fade-in">
      <div className="sticky top-[108px] md:top-[56px] z-30 bg-[#F5F5F5]/95 backdrop-blur py-3 flex flex-col md:flex-row md:items-center gap-3 -mx-[16px] px-[16px] md:mx-0 md:px-0">
        <div className="flex gap-2 overflow-x-auto scrollbar-hide shrink-0 pb-1 md:pb-0">
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
              demands.filter(
                (d) =>
                  (Date.now() - new Date(d.createdAt).getTime()) / 3600000 <= 24 &&
                  d.status === 'Pendente',
              ).length
            }
            color="border-[#00AA00]"
            activeBg="bg-[#00AA00]"
          />
        </div>

        <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 bg-[#FFFFFF] p-3 rounded-xl border border-[#E5E5E5] overflow-x-auto scrollbar-hide flex-1 w-full">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
            <Filter className="w-4 h-4 text-[#999999] shrink-0" />
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">
              Período:
            </span>
            {['todas', '24h', '7d', '30d'].map((p) => (
              <Badge
                key={p}
                onClick={() => setPeriodFilter(p)}
                className={cn(
                  'cursor-pointer shrink-0 min-h-[32px] px-3 transition-colors',
                  periodFilter === p
                    ? 'bg-[#333333] text-white'
                    : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
                )}
              >
                {p === 'todas' ? 'Todos' : p}
              </Badge>
            ))}
          </div>
          <div className="hidden min-[480px]:block w-[1px] h-5 bg-[#E5E5E5] shrink-0" />
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">
              Prioridade:
            </span>
            {['todas', 'priorizadas', 'novas'].map((p) => (
              <Badge
                key={p}
                onClick={() => setPriorityFilter(p)}
                className={cn(
                  'cursor-pointer shrink-0 capitalize min-h-[32px] px-3 transition-colors',
                  priorityFilter === p
                    ? 'bg-[#333333] text-white'
                    : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
                )}
              >
                {p}
              </Badge>
            ))}
          </div>
          <div className="flex-1 min-w-0" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setPeriodFilter('todas')
              setPriorityFilter('todas')
            }}
            className="text-[#4444FF] font-bold text-[14px] w-full min-[480px]:w-auto h-[32px] shrink-0"
          >
            <RefreshCw className="w-4 h-4 mr-1.5" /> Limpar
          </Button>
        </div>
      </div>

      <div className="animate-slide-in-filters">
        {filteredDemands.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] border rounded-xl border-dashed border-[#E5E5E5]">
            <Search className="w-12 h-12 text-[#999999]/50 mx-auto mb-3" />
            <p className="text-[16px] font-medium text-[#999999]">Nenhuma demanda no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-[16px] md:gap-[20px]">
            {groupedDemands.groups.map((g, i) => (
              <div
                key={g.id}
                className="opacity-0 animate-cascade-fade"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <GroupedDemandCard group={g} onAction={() => {}} />
              </div>
            ))}
            {groupedDemands.ungrouped.map((d, i) => (
              <DemandCard
                key={d.id}
                demand={d}
                isNewDemand={
                  (Date.now() - new Date(d.createdAt).getTime()) / 3600000 <= 24 &&
                  d.status === 'Pendente'
                }
                index={i + groupedDemands.groups.length}
              />
            ))}
          </div>
        )}
      </div>
    </div>
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
        'flex items-center justify-center gap-2 h-[40px] px-4 rounded-full border-[2px] transition-all duration-100 whitespace-nowrap min-w-[48px] hover:scale-[1.05] active:scale-[0.95]',
        active
          ? cn('text-white shadow-sm', activeBg, color)
          : 'bg-white text-[#999999] border-[#E5E5E5] hover:border-[#333333] hover:text-[#333333]',
      )}
    >
      <span className="text-[14px] font-bold leading-tight">{label}</span>
      <span
        className={cn(
          'text-[12px] font-bold px-1.5 py-0.5 rounded-full leading-none',
          active ? 'bg-white/20 text-white' : 'bg-[#E5E5E5] text-[#333333]',
        )}
      >
        {count}
      </span>
    </button>
  )
}
