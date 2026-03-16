import { useState, useMemo, useTransition } from 'react'
import { Search, RefreshCw, Home, Eye, Handshake } from 'lucide-react'
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
  emptyStateText = 'Nenhum imóvel captado para suas demandas',
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

  const stats = useMemo(() => {
    let captados = 0
    let visitas = 0
    let negocios = 0
    allCaptured.forEach(({ property }) => {
      if (property.discarded) return
      if (property.fechamentoDate) negocios++
      else if (property.visitaDate) visitas++
      else captados++
    })
    return { captados, visitas, negocios }
  }, [allCaptured])

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
    <div className="flex flex-col gap-[16px] md:gap-[20px] animate-fade-in-up">
      {/* Counters styled to match the responsive metrics */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-3 gap-[12px] min-[480px]:gap-[16px] md:gap-[20px]">
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-[12px] p-[16px] flex items-center justify-between shadow-sm min-h-[100px] w-full">
          <div className="flex flex-col break-words whitespace-normal flex-1 mr-2">
            <p className="text-[12px] min-[480px]:text-[13px] md:text-[14px] font-bold text-[#999999] uppercase tracking-wider mb-1 leading-tight break-words whitespace-normal">
              Imóveis Captados
            </p>
            <p className="text-[28px] min-[480px]:text-[32px] md:text-[36px] font-black text-[#333333] leading-none">
              {stats.captados}
            </p>
          </div>
          <div className="w-[44px] h-[44px] min-[480px]:w-[48px] min-[480px]:h-[48px] md:w-[56px] md:h-[56px] rounded-xl bg-[#4444FF]/10 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 md:w-6 md:h-6 text-[#4444FF]" />
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-[12px] p-[16px] flex items-center justify-between shadow-sm min-h-[100px] w-full">
          <div className="flex flex-col break-words whitespace-normal flex-1 mr-2">
            <p className="text-[12px] min-[480px]:text-[13px] md:text-[14px] font-bold text-[#999999] uppercase tracking-wider mb-1 leading-tight break-words whitespace-normal">
              Visitas Agendadas
            </p>
            <p className="text-[28px] min-[480px]:text-[32px] md:text-[36px] font-black text-[#333333] leading-none">
              {stats.visitas}
            </p>
          </div>
          <div className="w-[44px] h-[44px] min-[480px]:w-[48px] min-[480px]:h-[48px] md:w-[56px] md:h-[56px] rounded-xl bg-[#FFD700]/20 flex items-center justify-center shrink-0">
            <Eye className="w-5 h-5 md:w-6 md:h-6 text-[#B8860B]" />
          </div>
        </div>
        <div className="bg-[#FFFFFF] border border-[#E5E5E5] rounded-[12px] p-[16px] flex items-center justify-between shadow-sm min-h-[100px] w-full">
          <div className="flex flex-col break-words whitespace-normal flex-1 mr-2">
            <p className="text-[12px] min-[480px]:text-[13px] md:text-[14px] font-bold text-[#999999] uppercase tracking-wider mb-1 leading-tight break-words whitespace-normal">
              Negócios Fechados
            </p>
            <p className="text-[28px] min-[480px]:text-[32px] md:text-[36px] font-black text-[#333333] leading-none">
              {stats.negocios}
            </p>
          </div>
          <div className="w-[44px] h-[44px] min-[480px]:w-[48px] min-[480px]:h-[48px] md:w-[56px] md:h-[56px] rounded-xl bg-[#00AA00]/10 flex items-center justify-center shrink-0">
            <Handshake className="w-5 h-5 md:w-6 md:h-6 text-[#00AA00]" />
          </div>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-col min-[480px]:flex-row min-[480px]:items-center gap-3 bg-[#F9F9F9] md:bg-transparent p-3 md:p-0 rounded-xl md:rounded-none border border-[#E5E5E5] md:border-transparent overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
          <span className="text-[12px] min-[480px]:text-[13px] md:text-[14px] leading-tight font-bold text-[#999999] uppercase shrink-0">
            Status:
          </span>
          {['Todas', 'Captados', 'Visitas', 'Negócios'].map((p) => (
            <Badge
              key={p}
              onClick={() => startTransition(() => setFilterStatus(p))}
              className={cn(
                'cursor-pointer shrink-0 min-h-[40px] px-3',
                filterStatus === p
                  ? 'bg-[#333333] text-white'
                  : 'bg-white text-[#333333] border border-[#E5E5E5] hover:bg-[#E5E5E5]',
              )}
            >
              {p}
            </Badge>
          ))}
        </div>
        <div className="hidden min-[480px]:block w-[1px] h-5 bg-[#E5E5E5] shrink-0" />
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide shrink-0 w-full min-[480px]:w-auto">
          <span className="text-[12px] min-[480px]:text-[13px] md:text-[14px] leading-tight font-bold text-[#999999] uppercase shrink-0">
            Período:
          </span>
          {['Todas', '7d', '30d'].map((p) => (
            <Badge
              key={p}
              onClick={() => startTransition(() => setFilterPeriod(p))}
              className={cn(
                'cursor-pointer shrink-0 min-h-[40px] px-3',
                filterPeriod === p
                  ? 'bg-[#333333] text-white'
                  : 'bg-white text-[#333333] border border-[#E5E5E5] hover:bg-[#E5E5E5]',
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
          className="text-[#4444FF] font-bold text-[14px] w-full min-[480px]:w-auto h-[40px] hover:bg-[#4444FF]/10 shrink-0"
        >
          <RefreshCw className="w-4 h-4 mr-1.5" /> Limpar
        </Button>
      </div>

      {/* Grid */}
      <div className={cn('transition-opacity duration-200 w-full', isPending && 'opacity-50')}>
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-[#F9F9F9] border rounded-xl border-dashed border-[#E5E5E5] w-full">
            <Search className="w-12 h-12 text-[#999999]/30 mx-auto mb-3" />
            <p className="text-[14px] min-[480px]:text-[16px] md:text-[18px] leading-tight text-[#999999] font-medium break-words whitespace-normal">
              {emptyStateText}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-3 min-[1440px]:grid-cols-4 gap-[12px] min-[480px]:gap-[16px] md:gap-[20px] w-full">
            {filteredAndSorted.map(({ demand, property }) => (
              <CapturedPropertyCard
                key={`${demand.id}-${property.code}`}
                demand={demand}
                property={property}
                onAction={handleAction}
              />
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
