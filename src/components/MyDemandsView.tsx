import { useState, useMemo } from 'react'
import { PlusCircle, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { DemandCard } from '@/components/DemandCard'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'

interface Props {
  filterType?: 'Venda' | 'Aluguel'
}

const FILTERS: FilterDef[] = [
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'Ativos', label: 'Ativos', icon: '🟢' },
      { value: 'Todos', label: 'Todos', icon: '⚪' },
    ],
  },
  {
    id: 'prazo',
    label: 'Prazo',
    options: [
      { value: 'Todos', label: 'Todos', icon: '📅' },
      { value: 'Urgente', label: 'Urgente', icon: '⚡' },
      { value: 'Até 15 dias', label: 'Até 15 dias', icon: '⏳' },
      { value: 'Até 30 dias', label: 'Até 30 dias', icon: '⏳' },
      { value: 'Até 90 dias', label: 'Até 90 dias', icon: '🗓️' },
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
        if (filters.bairro && !d.location.toLowerCase().includes(filters.bairro.toLowerCase()))
          return false
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [demands, currentUser, filterType, filters])

  const handleClear = () => handleFilterChange({ status: 'Todos', prazo: 'Todos', bairro: '' })

  return (
    <div className="flex flex-col gap-[16px] animate-fade-in w-full">
      <StickyFilterBar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={filteredDemands.length}
        stickyTop="top-[128px] sm:top-[136px]"
      />

      {isFiltering ? (
        <div className="grid gap-[12px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[250px] w-full rounded-[12px]" />
          ))}
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="text-center py-[48px] bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] flex flex-col items-center">
          <Search className="w-12 h-12 text-[#999999]/30 mb-3" />
          <p className="text-[16px] font-bold text-[#333333]">
            {Object.values(filters).some((v) => v !== 'Todos' && v !== '' && v !== 'Ativos')
              ? 'Nenhuma demanda com estes filtros.'
              : 'Nenhuma demanda encontrada. Crie uma nova demanda.'}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            {Object.values(filters).some((v) => v !== 'Todos' && v !== '' && v !== 'Ativos') && (
              <Button variant="outline" onClick={handleClear}>
                Limpar filtros
              </Button>
            )}
            <Button asChild className="bg-[#1A3A52] text-white hover:bg-[#2E5F8A]">
              <Link to="/app/nova-demanda">
                <PlusCircle className="w-4 h-4 mr-2" /> Nova Demanda
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-[12px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDemands.map((demand) => (
            <DemandCard key={demand.id} demand={demand} />
          ))}
        </div>
      )}
    </div>
  )
}
