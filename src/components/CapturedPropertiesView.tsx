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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { CapturedPropertyCard } from './CapturedPropertyCard'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { PropertyTimeline } from './PropertyTimeline'
import { Demand, CapturedProperty, User } from '@/types'

export function CapturedPropertiesView() {
  const {
    demands,
    users,
    currentUser,
    scheduleVisitByCode,
    submitProposalByCode,
    closeDealByCode,
  } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [capturerFilter, setCapturerFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')

  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<
    'visita' | 'proposta' | 'negocio' | 'history' | null
  >(null)

  const allCaptured = useMemo(() => {
    return demands.flatMap((d) => {
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
  }, [demands, currentUser])

  const uniqueCapturers = useMemo(() => {
    const ids = new Set(allCaptured.map((item) => item.property.captador_id).filter(Boolean))
    return Array.from(ids)
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as User[]
  }, [allCaptured, users])

  const filteredAndSorted = useMemo(() => {
    const now = new Date()
    let result = allCaptured.filter(({ demand: d, property: p }) => {
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

      let matchDate = true
      const capDate = new Date(p.capturedAt || d.createdAt)
      if (dateFilter === 'today') {
        matchDate = capDate.toDateString() === now.toDateString()
      } else if (dateFilter === 'week') {
        const diffTime = Math.abs(now.getTime() - capDate.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        matchDate = diffDays <= 7
      } else if (dateFilter === 'month') {
        matchDate =
          capDate.getMonth() === now.getMonth() && capDate.getFullYear() === now.getFullYear()
      }

      return matchStatus && matchCapturer && matchDate
    })

    const statusWeight: Record<string, number> = {
      Visita: 1,
      Proposta: 2,
      Captado: 3,
      Negócio: 4,
      Perdida: 5,
    }

    return result.sort((a, b) => {
      const getStatus = (p: CapturedProperty, d: Demand) => {
        if (p.fechamentoDate) return 'Negócio'
        if (p.propostaDate) return 'Proposta'
        if (p.visitaDate) return 'Visita'
        if (d.status === 'Perdida') return 'Perdida'
        return 'Captado'
      }

      const weightA = statusWeight[getStatus(a.property, a.demand)] || 5
      const weightB = statusWeight[getStatus(b.property, b.demand)] || 5

      if (weightA !== weightB) {
        return weightA - weightB
      }

      const dateA = new Date(a.property.capturedAt || a.demand.createdAt).getTime()
      const dateB = new Date(b.property.capturedAt || b.demand.createdAt).getTime()
      return dateB - dateA
    })
  }, [allCaptured, statusFilter, capturerFilter, dateFilter])

  const handleAction = (
    type: 'visita' | 'proposta' | 'negocio' | 'history',
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status do Imóvel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Captado">🟡 Captado</SelectItem>
            <SelectItem value="Visita">🔵 Visita Agendada</SelectItem>
            <SelectItem value="Proposta">🟣 Proposta</SelectItem>
            <SelectItem value="Negócio">🟢 Negócio Fechado</SelectItem>
            <SelectItem value="Perdida">❌ Perdida</SelectItem>
          </SelectContent>
        </Select>

        <Select value={capturerFilter} onValueChange={setCapturerFilter}>
          <SelectTrigger>
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

        <Select value={dateFilter} onValueChange={setDateFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Data de Captação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Qualquer Data</SelectItem>
            <SelectItem value="today">Hoje</SelectItem>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredAndSorted.length === 0 ? (
        <div className="text-center p-12 bg-background border rounded-xl border-dashed">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum imóvel encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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

      {actionType === 'history' && actionDemand && actionProperty && (
        <Dialog open onOpenChange={(v) => !v && closeModals()}>
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-2">
              <DialogTitle>Histórico de Ações do Imóvel</DialogTitle>
              <DialogDescription>
                Cód: <strong>{actionProperty.code}</strong> • Cliente: {actionDemand.clientName}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6 pb-2">
              <PropertyTimeline history={actionProperty.history || []} />
            </div>
          </DialogContent>
        </Dialog>
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
      />
    </div>
  )
}
