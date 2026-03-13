import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CapturedPropertyCard } from './CapturedPropertyCard'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { Demand, CapturedProperty, User } from '@/types'

interface Props {
  filterType?: 'Venda' | 'Aluguel'
  emptyStateText?: string
}

export function CapturedPropertiesView({
  filterType,
  emptyStateText = 'Nenhuma demanda no momento',
}: Props) {
  const {
    demands,
    users,
    currentUser,
    scheduleVisitByCode,
    submitProposalByCode,
    closeDealByCode,
    markPropertyLost,
  } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [capturerFilter, setCapturerFilter] = useState('all')

  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<
    'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | null
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

  const uniqueCapturers = useMemo(() => {
    const ids = new Set(allCaptured.map((item) => item.property.captador_id).filter(Boolean))
    return Array.from(ids)
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as User[]
  }, [allCaptured, users])

  const filteredAndSorted = useMemo(() => {
    let result = allCaptured.filter(({ demand: d, property: p }) => {
      if (p.discarded) return false

      const isClosed = !!p.fechamentoDate
      const isProposta = !!p.propostaDate && !isClosed
      const isVisita = !!p.visitaDate && !isProposta && !isClosed
      const isLost = d.status === 'Perdida'

      let propStatus = 'Captado'
      if (isClosed) propStatus = 'Negócio'
      else if (isProposta) propStatus = 'Proposta'
      else if (isVisita) propStatus = 'Visita'
      else if (isLost) propStatus = 'Perdida'

      const matchStatus = statusFilter === 'all' || propStatus === statusFilter
      const matchCapturer = capturerFilter === 'all' || p.captador_id === capturerFilter

      return matchStatus && matchCapturer
    })
    return result
  }, [allCaptured, statusFilter, capturerFilter])

  const handleAction = (
    type: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history',
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
    <div className="space-y-[24px]">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="h-[44px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Captado">Captado</SelectItem>
            <SelectItem value="Visita">Visita Agendada</SelectItem>
            <SelectItem value="Negócio">Negócio Fechado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={capturerFilter} onValueChange={setCapturerFilter}>
          <SelectTrigger className="h-[44px]">
            <SelectValue placeholder="Captador" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Captadores</SelectItem>
            {uniqueCapturers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="text-center py-[48px] bg-background border rounded-[12px] border-dashed">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-[14px] text-muted-foreground font-medium">{emptyStateText}</p>
        </div>
      ) : (
        <div className="grid gap-[12px] grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
