import { useState, useMemo, useTransition } from 'react'
import { Search, RefreshCw } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
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
  const [sortOrder, setSortOrder] = useState('recent')

  const [activeFilters, setActiveFilters] = useState({
    status: 'Todas',
    period: 'Todas',
  })

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

  const applyFilters = () => {
    startTransition(() => {
      setActiveFilters({
        status: filterStatus,
        period: filterPeriod,
      })
    })
  }

  const filteredAndSorted = useMemo(() => {
    let result = allCaptured.filter(({ demand: d, property: p }) => {
      if (p.discarded) return false

      const isClosed = !!p.fechamentoDate
      const isVisita = !!p.visitaDate && !isClosed

      let propStatus = 'Captados'
      if (isClosed) propStatus = 'Negócios'
      else if (isVisita) propStatus = 'Visitas'

      if (activeFilters.status !== 'Todas' && propStatus !== activeFilters.status) return false

      const capDate = new Date(p.capturedAt || '')
      const now = new Date()
      const diffDays = (now.getTime() - capDate.getTime()) / (1000 * 3600 * 24)

      if (activeFilters.period === '7dias' && diffDays > 7) return false
      if (activeFilters.period === '30dias' && diffDays > 30) return false

      return true
    })

    if (sortOrder === 'priority') {
      result.sort((a, b) => {
        const getScore = (p: CapturedProperty) => {
          if (p.fechamentoDate) return 3
          if (p.visitaDate) return 2
          return 1
        }
        const sA = getScore(a.property)
        const sB = getScore(b.property)
        if (sA !== sB) return sB - sA
        return (
          new Date(b.property.capturedAt || '').getTime() -
          new Date(a.property.capturedAt || '').getTime()
        )
      })
    } else {
      result.sort(
        (a, b) =>
          new Date(b.property.capturedAt || '').getTime() -
          new Date(a.property.capturedAt || '').getTime(),
      )
    }

    return result
  }, [allCaptured, activeFilters, sortOrder])

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
    <div className="space-y-[24px] animate-fade-in-up">
      {/* Counters */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-wrap gap-4 md:gap-6 text-sm md:text-base font-bold text-foreground">
          <span className="flex items-center gap-2">
            <span className="text-xl">📊</span> Imóveis Captados:{' '}
            <span className="text-primary">{stats.captados}</span>
          </span>
          <span className="text-border hidden sm:inline">|</span>
          <span className="flex items-center gap-2">
            <span className="text-xl">👁️</span> Visitas:{' '}
            <span className="text-orange-500">{stats.visitas}</span>
          </span>
          <span className="text-border hidden sm:inline">|</span>
          <span className="flex items-center gap-2">
            <span className="text-xl">💰</span> Negócios:{' '}
            <span className="text-emerald-500">{stats.negocios}</span>
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border rounded-xl p-[16px] md:p-[20px] space-y-[16px] shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-[44px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                <SelectItem value="Captados">Captados</SelectItem>
                <SelectItem value="Visitas">Visitas</SelectItem>
                <SelectItem value="Negócios">Negócios</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="h-[44px]">
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas</SelectItem>
                <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                <SelectItem value="30dias">Últimos 30 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Ordenar por</Label>
            <Select value={sortOrder} onValueChange={setSortOrder}>
              <SelectTrigger className="h-[44px]">
                <SelectValue placeholder="Ordem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Mais Recentes</SelectItem>
                <SelectItem value="priority">Prioridade (Negócio &gt; Visita)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={applyFilters} className="w-full sm:w-auto h-[44px] gap-2 font-bold">
            <RefreshCw className="w-4 h-4" /> Aplicar Filtros
          </Button>
        </div>
      </div>

      {/* Grid */}
      <div className={cn('transition-opacity duration-200', isPending && 'opacity-50')}>
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-[48px] bg-background border rounded-[12px] border-dashed">
            <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-[14px] text-muted-foreground font-medium">{emptyStateText}</p>
          </div>
        ) : (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2">
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
