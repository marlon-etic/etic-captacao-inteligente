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

  const [filterStatus, setFilterStatus] = useState('Todas')
  const [filterPeriod, setFilterPeriod] = useState('Todas')

  const [isPending, startTransition] = useTransition()

  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<
    'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details' | null
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

      let propStatus = 'Captados'
      if (isClosed) propStatus = 'Negócios'
      else if (isVisita) propStatus = 'Visitas'

      if (filterStatus !== 'Todas' && propStatus !== filterStatus) return false

      const capDate = new Date(p.capturedAt || '')
      const now = new Date()
      const diffDays = (now.getTime() - capDate.getTime()) / (1000 * 3600 * 24)

      if (filterPeriod === '7d' && diffDays > 7) return false
      if (filterPeriod === '30d' && diffDays > 30) return false

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
    type: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details',
    demand: Demand,
    property: CapturedProperty,
  ) => {
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
    <div className="flex flex-col gap-[16px] md:gap-[20px] animate-fade-in">
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 bg-[#FFFFFF] p-3 rounded-xl border border-[#E5E5E5] overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
          <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">Status:</span>
          {['Todas', 'Captados', 'Visitas', 'Negócios'].map((p) => (
            <Badge
              key={p}
              onClick={() => startTransition(() => setFilterStatus(p))}
              className={cn(
                'cursor-pointer shrink-0 min-h-[32px] px-3 transition-colors',
                filterStatus === p
                  ? 'bg-[#333333] text-white'
                  : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
              )}
            >
              {p}
            </Badge>
          ))}
        </div>
        <div className="hidden min-[480px]:block w-[1px] h-5 bg-[#E5E5E5] shrink-0" />
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
          <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0">Período:</span>
          {['Todas', '7d', '30d'].map((p) => (
            <Badge
              key={p}
              onClick={() => startTransition(() => setFilterPeriod(p))}
              className={cn(
                'cursor-pointer shrink-0 min-h-[32px] px-3 transition-colors',
                filterPeriod === p
                  ? 'bg-[#333333] text-white'
                  : 'bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5] border-transparent',
              )}
            >
              {p === 'Todas' ? 'Tudo' : p}
            </Badge>
          ))}
        </div>
        <div className="flex-1 min-w-0 min-[480px]:min-w-[20px]"></div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            startTransition(() => {
              setFilterStatus('Todas')
              setFilterPeriod('Todas')
            })
          }}
          className="text-[#4444FF] font-bold text-[14px] w-full min-[480px]:w-auto h-[32px] shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Limpar
        </Button>
      </div>

      <div className={cn('transition-opacity duration-200 w-full', isPending && 'opacity-50')}>
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] border rounded-xl border-dashed border-[#E5E5E5] w-full">
            <Search className="w-12 h-12 text-[#999999]/30 mx-auto mb-3" />
            <p className="text-[16px] font-medium text-[#999999]">{emptyStateText}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-[16px] md:gap-[20px] w-full">
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
