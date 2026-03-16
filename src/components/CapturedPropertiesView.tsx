import { useState, useMemo, useTransition } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CapturedPropertyCard } from './CapturedPropertyCard'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { Demand, CapturedProperty } from '@/types'
import { cn } from '@/lib/utils'

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

  const [filterStatus, setFilterStatus] = useState('Todos')
  const [filterPeriod, setFilterPeriod] = useState('Todos')

  const [isPending, startTransition] = useTransition()

  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<
    'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details' | 'edit' | null
  >(null)

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

      if (filterStatus !== 'Todos' && propStatus !== filterStatus) return false

      const capDate = new Date(p.capturedAt || '')
      const now = new Date()
      const diffDays = (now.getTime() - capDate.getTime()) / (1000 * 3600 * 24)

      if (filterPeriod === 'Últimos 7 dias' && diffDays > 7) return false
      if (filterPeriod === '30 dias' && diffDays > 30) return false

      return true
    })

    result.sort(
      (a, b) =>
        new Date(b.property.capturedAt || '').getTime() -
        new Date(a.property.capturedAt || '').getTime(),
    )

    return result
  }, [allCaptured, filterStatus, filterPeriod])

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
    <div className="flex flex-col gap-[16px] animate-fade-in w-full">
      {/* Sticky Filters Header inside TabsContent */}
      <div className="sticky top-[116px] md:top-[124px] z-10 bg-[#F5F5F5] pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <div className="flex flex-col md:flex-row md:items-center gap-[16px] bg-[#FFFFFF] p-[16px] rounded-[12px] border border-[#E5E5E5] shadow-[0_4px_12px_rgba(26,58,82,0.05)]">
          <div className="flex items-center gap-[12px] overflow-x-auto scrollbar-hide shrink-0 w-full md:w-auto">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">Status:</span>
            {['Todos', 'Captado', 'Visita', 'Fechado'].map((p) => (
              <Badge
                key={p}
                onClick={() => startTransition(() => setFilterStatus(p))}
                className={cn(
                  'cursor-pointer shrink-0 min-h-[32px] px-[12px] transition-colors duration-200',
                  filterStatus === p
                    ? 'bg-[#1A3A52] text-white border-transparent'
                    : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
                )}
              >
                {p}
              </Badge>
            ))}
          </div>

          <div className="hidden md:block w-[1px] h-[32px] bg-[#E5E5E5] shrink-0" />

          <div className="flex items-center gap-[12px] overflow-x-auto scrollbar-hide shrink-0 w-full md:w-auto">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">
              Período:
            </span>
            {['Todos', 'Últimos 7 dias', '30 dias'].map((p) => (
              <Badge
                key={p}
                onClick={() => startTransition(() => setFilterPeriod(p))}
                className={cn(
                  'cursor-pointer shrink-0 min-h-[32px] px-[12px] transition-colors duration-200',
                  filterPeriod === p
                    ? 'bg-[#1A3A52] text-white border-transparent'
                    : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
                )}
              >
                {p}
              </Badge>
            ))}
          </div>

          <div className="flex-1" />

          <Button
            variant="ghost"
            onClick={() => {
              startTransition(() => {
                setFilterStatus('Todos')
                setFilterPeriod('Todos')
              })
            }}
            className="text-[#1A3A52] font-bold text-[14px] w-full md:w-auto shrink-0 border border-transparent hover:bg-[#F5F5F5]"
          >
            <RefreshCw className="w-[16px] h-[16px] mr-[8px]" /> Limpar Filtros
          </Button>
        </div>
      </div>

      <div className={cn('transition-opacity duration-200 w-full pt-2', isPending && 'opacity-50')}>
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] border rounded-xl border-dashed border-[#E5E5E5] w-full">
            <Search className="w-12 h-12 text-[#999999]/30 mx-auto mb-3" />
            <p className="text-[16px] font-bold text-[#333333]">Nenhum imóvel captado</p>
            <p className="text-[14px] text-[#999999] mt-1">
              Tente ajustar os filtros ou registre novos imóveis.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px] w-full">
            {filteredAndSorted.map(({ demand, property }, index) => (
              <div
                key={`${demand.id}-${property.code}`}
                className="opacity-0 animate-cascade-fade"
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
