import { useState, useMemo } from 'react'
import { Users } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { DemandCard } from '@/components/DemandCard'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { FilterSidebar } from '@/components/FilterSidebar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  filterType?: 'Venda' | 'Aluguel'
}

const FILTERS: FilterDef[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'Ativos', label: 'Ativos (Em Aberto)', icon: '🟢' },
      { value: 'Todos', label: 'Todos os Status', icon: '⚪' },
    ],
  },
  {
    id: 'prazo',
    label: 'Prazo',
    options: [
      { value: 'Todos', label: 'Todos os Prazos', icon: '📅' },
      { value: 'Urgente', label: 'Urgente', icon: '⚡' },
      { value: 'Até 15 dias', label: 'Até 15 dias', icon: '⏳' },
      { value: 'Até 30 dias', label: 'Até 30 dias', icon: '⏳' },
      { value: 'Até 90 dias ou +', label: 'Até 90 dias', icon: '🗓️' },
    ],
  },
  { id: 'bairro', label: 'Bairro', isSearch: true, options: [] },
]

export function MyDemandsView({ filterType }: Props) {
  const { demands, currentUser } = useAppStore()

  const [filters, setFilters] = useViewFilters('my_demands_view_' + (filterType || 'all'), {
    status: 'Ativos',
    prazo: 'Todos',
    bairro: '',
  })
  const [isFiltering, setIsFiltering] = useState(false)

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsFiltering(true)
    setFilters(newF)
    setTimeout(() => setIsFiltering(false), 250)
  }

  const filteredDemands = useMemo(() => {
    let result = demands.filter((d) => d.createdBy === currentUser?.id)
    if (filterType) result = result.filter((d) => d.type === filterType)

    return result
      .filter((d) => {
        if (filters.status === 'Ativos') {
          if (['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status)) return false
        }
        if (filters.prazo !== 'Todos' && d.timeframe !== filters.prazo) return false
        if (
          filters.bairro &&
          !d.location.join(',').toLowerCase().includes(filters.bairro.toLowerCase())
        )
          return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [demands, currentUser, filterType, filters])

  const handleClear = () => handleFilterChange({ status: 'Todos', prazo: 'Todos', bairro: '' })

  const isAnyFilterActive = Object.values(filters).some(
    (v) => v !== 'Todos' && v !== '' && v !== 'Ativos',
  )

  const MOBILE_CHIPS = [
    { label: 'Ativos', apply: { status: 'Ativos', prazo: 'Todos', bairro: '' } },
    { label: 'Urgente', apply: { status: 'Ativos', prazo: 'Urgente', bairro: '' } },
    { label: 'Até 15d', apply: { status: 'Ativos', prazo: 'Até 15 dias', bairro: '' } },
    { label: 'Até 30d', apply: { status: 'Ativos', prazo: 'Até 30 dias', bairro: '' } },
    { label: 'Todos', apply: { status: 'Todos', prazo: 'Todos', bairro: '' } },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full animate-fade-in transition-opacity duration-150 ease-in">
      <FilterSidebar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={filteredDemands.length}
      />

      <div className="flex-1 w-full flex flex-col gap-[16px] min-w-0">
        <div className="lg:hidden w-full space-y-3">
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide px-1">
            {MOBILE_CHIPS.map((chip) => {
              const isActive =
                JSON.stringify(filters) === JSON.stringify(chip.apply) ||
                (chip.label === 'Ativos' &&
                  filters.status === 'Ativos' &&
                  filters.prazo === 'Todos' &&
                  filters.bairro === '')

              return (
                <button
                  key={chip.label}
                  onClick={() => handleFilterChange(chip.apply)}
                  className={cn(
                    'h-[36px] px-[16px] rounded-[18px] whitespace-nowrap font-bold text-[13px] border shadow-sm transition-all flex items-center justify-center shrink-0',
                    isActive
                      ? 'bg-[#1A3A52] text-white border-[#1A3A52]'
                      : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-[#1A3A52]/30',
                  )}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
          <StickyFilterBar
            filters={FILTERS}
            values={filters}
            onChange={handleFilterChange}
            resultsCount={filteredDemands.length}
            stickyTop="top-[128px] sm:top-[136px]"
          />
        </div>

        {isFiltering ? (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-[12px] animate-fast-pulse" />
            ))}
          </div>
        ) : filteredDemands.length === 0 ? (
          <div className="text-center py-[64px] px-4 bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] flex flex-col items-center justify-center shadow-sm">
            {isAnyFilterActive ? (
              <>
                <Users className="w-16 h-16 text-[#999999]/30 mb-4" />
                <p className="text-[18px] font-bold text-[#333333]">
                  Nenhum cliente com estes filtros.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-[200px]">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="font-bold min-h-[48px] w-full"
                  >
                    Limpar filtros
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-[#E8F0F8] rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-[#1A3A52]" />
                </div>
                <h3 className="text-[22px] font-black text-[#1A3A52]">Nenhum cliente registrado</h3>
                <p className="text-[15px] text-[#666666] mt-2 mb-8 max-w-[360px] leading-relaxed">
                  Você ainda não criou nenhuma demanda. Clique no botão + para começar.
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
            {filteredDemands.map((demand, index) => (
              <DemandCard key={demand.id} demand={demand} index={index} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
