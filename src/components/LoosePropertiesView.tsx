import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { LoosePropertyCard } from './LoosePropertyCard'
import { ClaimPropertyModal } from './ClaimPropertyModal'
import { CapturedProperty } from '@/types'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { FilterSidebar } from '@/components/FilterSidebar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeletedProperties } from '@/hooks/useDeletedProperties'

export function LoosePropertiesView({ filterType }: { filterType?: 'Venda' | 'Aluguel' }) {
  const { looseProperties, currentUser } = useAppStore()
  const [claimProperty, setClaimProperty] = useState<CapturedProperty | null>(null)
  const [ignoredCodes, setIgnoredCodes] = useState<string[]>([])
  const deletedIds = useDeletedProperties()

  const defaultFilters = filterType
    ? { periodo: 'Todos', bairro: '' }
    : { tipo: 'Todos', periodo: 'Todos', bairro: '' }
  const [filters, setFilters] = useViewFilters(
    'loose_view_' + (filterType || 'all'),
    defaultFilters,
  )
  const [isFiltering, setIsFiltering] = useState(false)

  const FILTERS: FilterDef[] = [
    {
      id: 'periodo',
      label: 'Período',
      options: [
        { value: 'Todos', label: 'Todos', icon: '📅' },
        { value: 'Últimos 7 dias', label: '7 dias', icon: '📅' },
        { value: '30 dias', label: '30 dias', icon: '📅' },
      ],
    },
    { id: 'bairro', label: 'Bairro', isSearch: true, options: [] },
  ]

  if (!filterType) {
    FILTERS.unshift({
      id: 'tipo',
      label: 'Tipo',
      options: [
        { value: 'Todos', label: 'Todos' },
        { value: 'Venda', label: 'Venda', icon: '🏢' },
        { value: 'Aluguel', label: 'Aluguel', icon: '🏠' },
      ],
    })
  }

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsFiltering(true)
    setFilters(newF)
    setTimeout(() => setIsFiltering(false), 250)
  }

  const sortedProperties = useMemo(() => {
    return [...looseProperties]
      .filter((p) => {
        if (deletedIds.includes(p.id || '') || deletedIds.includes(p.code)) return false
        if (filterType && p.propertyType !== filterType) return false
        if (p.status_reivindicacao && p.status_reivindicacao !== 'disponivel') return false
        if (ignoredCodes.includes(p.code)) return false

        if (currentUser?.role === 'admin' || currentUser?.role === 'gestor') {
          // allow
        } else if (currentUser?.role === 'captador') {
          if (p.captador_id !== currentUser?.id) return false
        } else {
          if (p.propertyType === 'Aluguel') {
            if (
              !(
                currentUser?.role === 'sdr' ||
                (currentUser?.role === 'corretor' &&
                  currentUser?.tipos_demanda_solicitados?.includes('locacao'))
              )
            ) {
              return false
            }
          } else if (p.propertyType === 'Venda') {
            if (currentUser?.role !== 'corretor') return false
          }
        }

        if (
          !filterType &&
          filters.tipo &&
          filters.tipo !== 'Todos' &&
          p.propertyType !== filters.tipo
        )
          return false
        if (filters.bairro && !p.neighborhood?.toLowerCase().includes(filters.bairro.toLowerCase()))
          return false

        const capDate = new Date(p.capturedAt || '')
        const diffDays = (new Date().getTime() - capDate.getTime()) / (1000 * 3600 * 24)
        if (filters.periodo === 'Últimos 7 dias' && diffDays > 7) return false
        if (filters.periodo === '30 dias' && diffDays > 30) return false

        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.capturedAt || '').getTime()
        const dateB = new Date(b.capturedAt || '').getTime()
        return dateB - dateA
      })
  }, [looseProperties, currentUser, ignoredCodes, filters, filterType])

  return (
    <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full animate-fade-in transition-opacity duration-150 ease-in">
      <FilterSidebar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={sortedProperties.length}
      />

      <div className="flex-1 w-full flex flex-col gap-[16px] min-w-0">
        <div className="lg:hidden w-full">
          <StickyFilterBar
            filters={FILTERS}
            values={filters}
            onChange={handleFilterChange}
            resultsCount={sortedProperties.length}
            stickyTop="top-[128px] sm:top-[136px]"
          />
        </div>

        {isFiltering ? (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-[12px] animate-fast-pulse" />
            ))}
          </div>
        ) : sortedProperties.length === 0 ? (
          <div className="text-center p-12 bg-white border rounded-[12px] border-dashed flex flex-col items-center justify-center min-h-[250px] border-[#E5E5E5]">
            <div className="text-[64px] leading-none mb-4">🔓</div>
            <p className="text-[#333333] font-bold text-[18px]">
              Nenhum imóvel disponível no momento
            </p>
          </div>
        ) : (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3">
            {sortedProperties.map((property) => (
              <LoosePropertyCard
                key={property.code}
                property={property}
                onClaim={setClaimProperty}
                onIgnore={() => setIgnoredCodes((prev) => [...prev, property.code])}
              />
            ))}
          </div>
        )}
      </div>

      <ClaimPropertyModal
        isOpen={!!claimProperty}
        property={claimProperty}
        onClose={() => setClaimProperty(null)}
      />
    </div>
  )
}
