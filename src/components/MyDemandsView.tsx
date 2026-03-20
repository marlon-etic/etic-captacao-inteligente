import { useState, useMemo } from 'react'
import { FilterSidebar } from '@/components/FilterSidebar'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSupabaseDemands } from '@/hooks/use-supabase-demands'
import { ExpandableDemandCard } from '@/components/ExpandableDemandCard'

interface Props {
  filterType?: 'Venda' | 'Aluguel'
}

const FILTERS: FilterDef[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'Todos', label: 'Todos os Status' },
      { value: 'aberta', label: 'Aberta', icon: '🟢' },
      { value: 'atendida', label: 'Atendida', icon: '🔵' },
      { value: 'sem_resposta_24h', label: 'Sem Resposta', icon: '🟡' },
      { value: 'impossivel', label: 'Impossível', icon: '⚪' },
    ],
  },
  {
    id: 'urgencia',
    label: 'Urgência',
    options: [
      { value: 'Todos', label: 'Todas' },
      { value: 'Alta', label: 'Alta', icon: '🔴' },
      { value: 'Média', label: 'Média', icon: '🟡' },
      { value: 'Baixa', label: 'Baixa', icon: '⚪' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    options: [
      { value: 'Todos', label: 'Qualquer data', icon: '📅' },
      { value: '7', label: 'Últimos 7 dias', icon: '📅' },
      { value: '30', label: 'Últimos 30 dias', icon: '📅' },
      { value: '90', label: 'Últimos 90 dias', icon: '📅' },
    ],
  },
  { id: 'bairro', label: 'Bairro', isSearch: true, options: [] },
]

export function MyDemandsView({ filterType = 'Aluguel' }: Props) {
  const { demands, loading, refresh } = useSupabaseDemands(filterType)

  const [filters, setFilters] = useViewFilters('my_demands_view_supabase_' + filterType, {
    status: 'Todos',
    urgencia: 'Todos',
    data: 'Todos',
    bairro: '',
  })

  const [isFiltering, setIsFiltering] = useState(false)

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsFiltering(true)
    setFilters(newF)
    setTimeout(() => setIsFiltering(false), 250)
  }

  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      if (filters.status !== 'Todos' && d.status_demanda !== filters.status) return false
      if (filters.urgencia !== 'Todos' && d.nivel_urgencia !== filters.urgencia) return false

      if (filters.bairro) {
        const bArr = filters.bairro.toLowerCase().split(',')
        const dBairros = d.bairros.map((b) => b.toLowerCase())
        if (!bArr.some((b) => dBairros.includes(b))) return false
      }

      if (filters.data !== 'Todos') {
        const days = parseInt(filters.data)
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - days)
        const dDate = new Date(d.created_at)
        if (dDate < dateLimit) return false
      }
      return true
    })
  }, [demands, filters])

  const handleClear = () =>
    handleFilterChange({ status: 'Todos', urgencia: 'Todos', data: 'Todos', bairro: '' })

  const isAnyFilterActive = Object.values(filters).some((v) => v !== 'Todos' && v !== '')

  const MOBILE_CHIPS = [
    { label: 'Abertas', apply: { status: 'aberta', urgencia: 'Todos', data: 'Todos', bairro: '' } },
    {
      label: 'Atendidas',
      apply: { status: 'atendida', urgencia: 'Todos', data: 'Todos', bairro: '' },
    },
    {
      label: 'Alta Urgência',
      apply: { status: 'Todos', urgencia: 'Alta', data: 'Todos', bairro: '' },
    },
    { label: 'Todos', apply: { status: 'Todos', urgencia: 'Todos', data: 'Todos', bairro: '' } },
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
              const isActive = JSON.stringify(filters) === JSON.stringify(chip.apply)
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

        {loading ? (
          <div className="flex flex-col gap-[16px] w-full">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-[12px] animate-fast-pulse" />
            ))}
          </div>
        ) : isFiltering ? (
          <div className="flex flex-col gap-[16px] w-full">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[140px] w-full rounded-[12px] animate-fast-pulse" />
            ))}
          </div>
        ) : filteredDemands.length === 0 ? (
          <div className="text-center py-[64px] px-4 bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] flex flex-col items-center justify-center shadow-sm">
            {isAnyFilterActive ? (
              <>
                <Users className="w-16 h-16 text-[#999999]/30 mb-4" />
                <p className="text-[18px] font-bold text-[#333333]">
                  Nenhuma demanda com estes filtros.
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
                <h3 className="text-[22px] font-black text-[#1A3A52]">
                  Nenhuma demanda registrada
                </h3>
                <p className="text-[15px] text-[#666666] mt-2 mb-8 max-w-[360px] leading-relaxed">
                  Você ainda não criou nenhuma demanda. Crie uma para acompanhá-la.
                </p>
                <Button onClick={refresh} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Atualizar
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-[16px] w-full">
            {filteredDemands.map((demand) => (
              <ExpandableDemandCard key={demand.id} demand={demand} onUpdate={refresh} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
