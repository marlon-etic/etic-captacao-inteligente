import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { CapturedPropertyCard } from './CapturedPropertyCard'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { Demand, CapturedProperty } from '@/types'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { FilterSidebar } from '@/components/FilterSidebar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  filterType?: 'Venda' | 'Aluguel'
  emptyStateText?: string
}

export function CapturedPropertiesView({
  filterType,
  emptyStateText = 'Nenhum imóvel captado no momento.',
}: Props) {
  const {
    demands,
    currentUser,
    scheduleVisitByCode,
    submitProposalByCode,
    closeDealByCode,
    markPropertyLost,
  } = useAppStore()

  const [filters, setFilters] = useViewFilters('captados_view_' + (filterType || 'all'), {
    status: 'Todos',
    periodo: 'Todos',
    tipo: 'Todos',
    bairro: '',
  })
  const [isFiltering, setIsFiltering] = useState(false)

  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<
    'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details' | 'edit' | null
  >(null)

  const FILTERS: FilterDef[] = [
    {
      id: 'status',
      label: 'Status',
      options: [
        { value: 'Todos', label: 'Todos' },
        { value: 'Captado', label: 'Captado' },
        { value: 'Visita', label: 'Visita' },
        { value: 'Fechado', label: 'Fechado' },
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

  const allCaptured = useMemo(() => {
    return demands.flatMap((d) => {
      if (filterType && d.type !== filterType) return []
      if (!d.capturedProperties || d.capturedProperties.length === 0) return []
      if (currentUser?.role === 'admin' || currentUser?.role === 'gestor') {
        return d.capturedProperties.map((p) => ({ demand: d, property: p }))
      }
      if (
        (currentUser?.role === 'sdr' || currentUser?.role === 'corretor') &&
        d.createdBy === currentUser.id
      ) {
        return d.capturedProperties.map((p) => ({ demand: d, property: p }))
      }
      if (currentUser?.role === 'captador') {
        return d.capturedProperties
          .filter((p) => p.captador_id === currentUser.id)
          .map((p) => ({ demand: d, property: p }))
      }
      return []
    })
  }, [demands, currentUser, filterType])

  const filteredAndSorted = useMemo(() => {
    let result = allCaptured.filter(({ demand: d, property: p }) => {
      if (p.discarded) return false

      const isClosed = !!p.fechamentoDate
      const isVisita = !!p.visitaDate && !isClosed

      let propStatus = 'Captado'
      if (isClosed) propStatus = 'Fechado'
      else if (isVisita) propStatus = 'Visita'

      if (filters.status !== 'Todos' && propStatus !== filters.status) return false

      if (!filterType && filters.tipo !== 'Todos' && p.propertyType !== filters.tipo) return false
      if (filters.bairro && !p.neighborhood?.toLowerCase().includes(filters.bairro.toLowerCase()))
        return false

      const capDate = new Date(p.capturedAt || '')
      const now = new Date()
      const diffDays = (now.getTime() - capDate.getTime()) / (1000 * 3600 * 24)

      if (filters.periodo === 'Últimos 7 dias' && diffDays > 7) return false
      if (filters.periodo === '30 dias' && diffDays > 30) return false

      return true
    })

    result.sort(
      (a, b) =>
        new Date(b.property.capturedAt || '').getTime() -
        new Date(a.property.capturedAt || '').getTime(),
    )

    return result
  }, [allCaptured, filters, filterType])

  const handleAction = (
    type: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details' | 'edit',
    demand: Demand,
    property: CapturedProperty,
  ) => {
    if (
      type === 'edit' &&
      currentUser?.role !== 'captador' &&
      currentUser?.role !== 'admin' &&
      currentUser?.role !== 'gestor'
    ) {
      return
    }
    setActionType(type)
    setActionDemand(demand)
    setActionProperty(property)
  }

  const closeModals = () => {
    setActionType(null)
    setActionDemand(null)
    setActionProperty(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full animate-fade-in transition-opacity duration-150 ease-in">
      <FilterSidebar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={filteredAndSorted.length}
      />

      <div className="flex-1 w-full flex flex-col gap-[16px] min-w-0">
        <div className="lg:hidden w-full">
          <StickyFilterBar
            filters={FILTERS}
            values={filters}
            onChange={handleFilterChange}
            resultsCount={filteredAndSorted.length}
            stickyTop="top-[128px] sm:top-[136px]"
          />
        </div>

        {isFiltering ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-[16px] w-full">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-[12px] animate-fast-pulse" />
            ))}
          </div>
        ) : filteredAndSorted.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] border rounded-xl border-dashed border-[#E5E5E5] w-full flex flex-col items-center justify-center min-h-[250px]">
            <div className="text-[64px] leading-none mb-4">📦</div>
            <p className="text-[16px] font-bold text-[#333333]">{emptyStateText}</p>
            <p className="text-[14px] text-[#999999] mt-1">
              Tente ajustar os filtros ou espere novas captações.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-[16px] w-full">
            {filteredAndSorted.map(({ demand, property }, index) => (
              <div
                key={`${demand.id}-${property.code}`}
                className="opacity-0 animate-cascade-fade h-full"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CapturedPropertyCard demand={demand} property={property} onAction={handleAction} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CapturedPropertyModals
        demand={actionDemand}
        property={actionProperty}
        actionType={actionType === 'history' ? null : actionType}
        onClose={closeModals}
        onSubmitVisita={(data) => {
          if (actionProperty?.code) scheduleVisitByCode(actionProperty.code, data)
          closeModals()
        }}
        onSubmitProposta={(data) => {
          if (actionProperty?.code) submitProposalByCode(actionProperty.code, data)
          closeModals()
        }}
        onSubmitNegocio={(data) => {
          if (actionProperty?.code) closeDealByCode(actionProperty.code, data)
          closeModals()
        }}
        onSubmitLost={(data) => {
          if (actionProperty?.code && actionDemand?.id) {
            markPropertyLost(actionProperty.code, actionDemand.id, data.reason, data.obs)
          }
          closeModals()
        }}
      />
    </div>
  )
}
