import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { LoosePropertyCard } from './LoosePropertyCard'
import { ClaimPropertyModal } from './ClaimPropertyModal'
import { CapturedProperty } from '@/types'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'

const FILTERS: FilterDef[] = [
  {
    id: 'tipo',
    label: 'Tipo',
    options: [
      { value: 'Todos', label: 'Todos' },
      { value: 'Venda', label: 'Venda', icon: '🏢' },
      { value: 'Aluguel', label: 'Aluguel', icon: '🏠' },
    ],
  },
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

export function LoosePropertiesView() {
  const { looseProperties, currentUser } = useAppStore()
  const [claimProperty, setClaimProperty] = useState<CapturedProperty | null>(null)
  const [ignoredCodes, setIgnoredCodes] = useState<string[]>([])

  const [filters, setFilters] = useViewFilters('loose_view', {
    tipo: 'Todos',
    periodo: 'Todos',
    bairro: '',
  })
  const [isFiltering, setIsFiltering] = useState(false)

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsFiltering(true)
    setFilters(newF)
    setTimeout(() => setIsFiltering(false), 250)
  }

  const sortedProperties = useMemo(() => {
    return [...looseProperties]
      .filter((p) => {
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

        if (filters.tipo !== 'Todos' && p.propertyType !== filters.tipo) return false
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
  }, [looseProperties, currentUser, ignoredCodes, filters])

  return (
    <div className="flex flex-col gap-[16px] animate-fade-in w-full">
      <StickyFilterBar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={sortedProperties.length}
      />

      {isFiltering ? (
        <div className="grid gap-[16px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[250px] w-full rounded-[12px]" />
          ))}
        </div>
      ) : sortedProperties.length === 0 ? (
        <div className="text-center p-12 bg-background border rounded-xl border-dashed">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum imóvel disponível encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      <ClaimPropertyModal
        isOpen={!!claimProperty}
        property={claimProperty}
        onClose={() => setClaimProperty(null)}
      />
    </div>
  )
}
