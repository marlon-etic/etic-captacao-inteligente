import { useState, useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { EncontreiGrupoModal } from '@/components/EncontreiGrupoModal'
import { NaoEncontreiModal } from '@/components/NaoEncontreiModal'
import { GroupedCard, IndividualCard, LooseCard } from './NewCapturesCards'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'

const FILTERS: FilterDef[] = [
  {
    id: 'tipo',
    label: 'Tipo',
    options: [
      { value: 'Ambas', label: 'Ambas' },
      { value: 'Venda', label: 'Venda', icon: '🏢' },
      { value: 'Aluguel', label: 'Aluguel', icon: '🏠' },
    ],
  },
  {
    id: 'status',
    label: 'Status (Captador)',
    options: [
      { value: 'Todas', label: 'Todas', icon: '⚪' },
      { value: 'Novas', label: 'Novas', icon: '🆕' },
      { value: 'Priorizadas', label: 'Priorizadas', icon: '🔥' },
      { value: 'Agrupadas', label: 'Agrupadas', icon: '👥' },
    ],
  },
  {
    id: 'periodo',
    label: 'Período',
    options: [
      { value: 'Todas', label: 'Todas', icon: '📅' },
      { value: 'Hoje', label: 'Hoje', icon: '📅' },
      { value: '7 dias', label: '7 dias', icon: '📅' },
      { value: '30 dias', label: '30 dias', icon: '📅' },
    ],
  },
  { id: 'bairro', label: 'Bairro', isSearch: true, options: [] },
]

export function DemandasTab({ demands }: { demands: Demand[] }) {
  const { users, submitDemandResponse } = useAppStore()

  const [filters, setFilters] = useViewFilters('demandas_tab', {
    tipo: 'Ambas',
    status: 'Todas',
    periodo: 'Todas',
    bairro: '',
  })
  const [isFiltering, setIsFiltering] = useState(false)

  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const [showNaoEncontreiModal, setShowNaoEncontreiModal] = useState(false)
  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([])

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsFiltering(true)
    setFilters(newF)
    setTimeout(() => setIsFiltering(false), 250)
  }

  const filteredDemands = useMemo(() => {
    if (!demands) return []
    const now = Date.now()
    return demands.filter((d) => {
      if (d.status !== 'Pendente') return false
      if (filters.tipo !== 'Ambas' && d.type !== filters.tipo) return false

      const ageMs = now - new Date(d.createdAt).getTime()
      if (filters.periodo === 'Hoje' && ageMs > 24 * 3600000) return false
      if (filters.periodo === '7 dias' && ageMs > 7 * 86400000) return false
      if (filters.periodo === '30 dias' && ageMs > 30 * 86400000) return false

      if (filters.bairro && !d.location.toLowerCase().includes(filters.bairro.toLowerCase()))
        return false

      return true
    })
  }, [demands, filters])

  const allCards = useMemo(() => {
    const toProcess = [...filteredDemands]
    const groupMap = new Map<string, Demand[]>()
    const looseList: Demand[] = []

    const hasLoose = filteredDemands.some(
      (d) => !d.clientName || d.clientName.toLowerCase() === 'geral',
    )
    if (!hasLoose && filters.tipo !== 'Aluguel') {
      toProcess.push({
        id: 'mock-loose-1',
        clientName: '',
        location: 'Moema, Jardins',
        type: 'Venda',
        minBudget: 1500000,
        maxBudget: 2000000,
        bedrooms: 3,
        bathrooms: 2,
        parkingSpots: 2,
        description: 'Demanda geral do mercado',
        timeframe: 'Até 30 dias',
        status: 'Pendente',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      } as Demand)
    }

    toProcess.forEach((d) => {
      if (!d.clientName || d.clientName.toLowerCase() === 'geral') {
        looseList.push(d)
        return
      }
      const key = `${d.location}|${d.type}|${d.bedrooms || 0}|${d.parkingSpots || 0}`
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(d)
    })

    const finalGroups: { demands: Demand[]; clientCount: number; newestDate: number }[] = []
    const indivList: Demand[] = []

    groupMap.forEach((gDemands) => {
      const subGroups: Demand[][] = []
      gDemands.forEach((d) => {
        const dMax = d.maxBudget || d.budget || 0
        const dMin = d.minBudget || d.budget || 0
        let matched = false
        for (const sg of subGroups) {
          const sgMax = sg[0].maxBudget || sg[0].budget || 0
          const sgMin = sg[0].minBudget || sg[0].budget || 0
          if (dMax >= sgMin * 0.9 && dMin <= sgMax * 1.1) {
            sg.push(d)
            matched = true
            break
          }
        }
        if (!matched) subGroups.push([d])
      })
      subGroups.forEach((sg) => {
        if (sg.length > 1) {
          finalGroups.push({
            demands: sg,
            clientCount: sg.length,
            newestDate: Math.max(...sg.map((x) => new Date(x.createdAt).getTime())),
          })
        } else {
          indivList.push(sg[0])
        }
      })
    })

    const combined = [
      ...finalGroups.map((g) => {
        let p = 3
        if (g.clientCount >= 7) p = 1
        else if (g.clientCount >= 4) p = 2
        return { type: 'grouped' as const, priority: p, date: g.newestDate, data: g }
      }),
      ...indivList.map((d) => ({
        type: 'individual' as const,
        priority: 4,
        date: new Date(d.createdAt).getTime(),
        data: d,
      })),
      ...looseList.map((d) => ({
        type: 'loose' as const,
        priority: 5,
        date: new Date(d.createdAt).getTime(),
        data: d,
      })),
    ]

    combined.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.date - a.date
    })

    return combined
  }, [filteredDemands, filters.tipo])

  const finalCards = useMemo(() => {
    return allCards.filter((c) => {
      if (filters.status === 'Novas') {
        return c.priority === 4 && Date.now() - c.date <= 24 * 3600000 && !c.data.isPrioritized
      }
      if (filters.status === 'Priorizadas') {
        return (
          c.data.isPrioritized ||
          (c.type === 'grouped' && c.data.demands.some((d: Demand) => d.isPrioritized))
        )
      }
      if (filters.status === 'Agrupadas') return c.type === 'grouped'
      return true
    })
  }, [allCards, filters.status])

  const handleEncontrei = (ids: string[]) => {
    setSelectedDemandIds(ids)
    setShowCaptureModal(true)
  }

  const handleNaoEncontreiClick = (ids: string[]) => {
    setSelectedDemandIds(ids)
    setShowNaoEncontreiModal(true)
  }

  const handleConfirmNaoEncontrei = (reason: string, continueSearch: boolean) => {
    selectedDemandIds.forEach((id) => {
      if (id !== 'mock-loose-1') {
        submitDemandResponse(id, 'nao_encontrei', {
          reason,
          continueSearch,
        })
      }
    })
    setShowNaoEncontreiModal(false)
  }

  const getUserName = (id?: string) => users.find((u) => u.id === id)?.name || 'Sistema'

  if (!demands) {
    return (
      <div className="text-center py-16 bg-[#FFFFFF] border-2 rounded-xl border-dashed border-[#F44336]/50">
        <p className="text-[16px] font-bold text-[#F44336]">
          Erro ao carregar demandas. Tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <StickyFilterBar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={finalCards.length}
      />

      {isFiltering ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[220px] w-full rounded-[12px]" />
          ))}
        </div>
      ) : finalCards.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] border-2 rounded-xl border-dashed border-[#E5E5E5]">
          <LayoutGrid className="w-12 h-12 text-[#999999]/50 mx-auto mb-3" />
          <p className="text-[16px] font-bold text-[#333333]">Nenhuma demanda com estes filtros.</p>
          <p className="text-[14px] text-[#999999]">Tente alterar os parâmetros de busca!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {finalCards.map((card) => {
            if (card.type === 'grouped') {
              const ids = card.data.demands.map((d: Demand) => d.id)
              return (
                <GroupedCard
                  key={card.data.demands[0].id}
                  group={card.data}
                  onEncontrei={() => handleEncontrei(ids)}
                  onNaoEncontrei={() => handleNaoEncontreiClick(ids)}
                />
              )
            }
            if (card.type === 'individual') {
              return (
                <IndividualCard
                  key={card.data.id}
                  demand={card.data}
                  creatorName={getUserName(card.data.createdBy)}
                  onEncontrei={() => handleEncontrei([card.data.id])}
                  onNaoEncontrei={() => handleNaoEncontreiClick([card.data.id])}
                />
              )
            }
            if (card.type === 'loose') {
              return (
                <LooseCard
                  key={card.data.id}
                  demand={card.data}
                  onEncontrei={() => handleEncontrei([card.data.id])}
                  onNaoEncontrei={() => handleNaoEncontreiClick([card.data.id])}
                />
              )
            }
          })}
        </div>
      )}

      <EncontreiGrupoModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        demandIds={selectedDemandIds}
      />

      <NaoEncontreiModal
        isOpen={showNaoEncontreiModal}
        onClose={() => setShowNaoEncontreiModal(false)}
        onConfirm={handleConfirmNaoEncontrei}
      />
    </div>
  )
}
