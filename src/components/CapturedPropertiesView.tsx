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
import { Demand, User } from '@/types'

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
  const [actionType, setActionType] = useState<
    'visita' | 'proposta' | 'negocio' | 'history' | null
  >(null)

  const capturedDemands = useMemo(() => {
    return demands.filter(
      (d) =>
        [
          'Captado sob demanda',
          'Captado independente',
          'Visita',
          'Proposta',
          'Negócio',
          'Perdida',
        ].includes(d.status) &&
        d.createdBy === currentUser?.id &&
        d.capturedProperty,
    )
  }, [demands, currentUser])

  const uniqueCapturers = useMemo(() => {
    const ids = new Set(capturedDemands.map((d) => d.assignedTo).filter(Boolean))
    return Array.from(ids)
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as User[]
  }, [capturedDemands, users])

  const filteredAndSorted = useMemo(() => {
    const now = new Date()
    let result = capturedDemands.filter((d) => {
      // Status Filter
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'Captado' &&
          ['Captado sob demanda', 'Captado independente'].includes(d.status)) ||
        d.status === statusFilter

      // Capturer Filter
      const matchCapturer = capturerFilter === 'all' || d.assignedTo === capturerFilter

      // Date Filter
      let matchDate = true
      const capDate = new Date(d.capturedProperty?.capturedAt || d.createdAt)
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

    // Sort Logic: Priority to active states, then most recent capture
    const statusWeight: Record<string, number> = {
      Visita: 1,
      Proposta: 2,
      'Captado sob demanda': 3,
      'Captado independente': 3,
      Negócio: 4,
      Perdida: 5,
    }

    return result.sort((a, b) => {
      const weightA = statusWeight[a.status] || 5
      const weightB = statusWeight[b.status] || 5

      if (weightA !== weightB) {
        return weightA - weightB
      }

      const dateA = new Date(a.capturedProperty?.capturedAt || a.createdAt).getTime()
      const dateB = new Date(b.capturedProperty?.capturedAt || b.createdAt).getTime()
      return dateB - dateA
    })
  }, [capturedDemands, statusFilter, capturerFilter, dateFilter])

  const handleAction = (type: 'visita' | 'proposta' | 'negocio' | 'history', demand: Demand) => {
    setActionType(type)
    setActionDemand(demand)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
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
          <p className="text-muted-foreground font-medium">
            Nenhum imóvel captado para suas demandas.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAndSorted.map((demand) => (
            <CapturedPropertyCard key={demand.id} demand={demand} onAction={handleAction} />
          ))}
        </div>
      )}

      {actionType === 'history' && actionDemand && (
        <Dialog
          open
          onOpenChange={(v) => {
            if (!v) {
              setActionType(null)
              setActionDemand(null)
            }
          }}
        >
          <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-hidden flex flex-col">
            <DialogHeader className="pb-2">
              <DialogTitle>Histórico de Ações do Imóvel</DialogTitle>
              <DialogDescription>
                Cód: <strong>{actionDemand.capturedProperty?.code}</strong> • Cliente:{' '}
                {actionDemand.clientName}
              </DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto flex-1 -mx-6 px-6 pb-2">
              <PropertyTimeline history={actionDemand.capturedProperty?.history || []} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <CapturedPropertyModals
        demand={actionDemand}
        actionType={actionType === 'history' ? null : actionType}
        onClose={() => {
          setActionType(null)
          setActionDemand(null)
        }}
        onSubmitVisita={(data) => {
          if (actionDemand?.capturedProperty?.code) {
            scheduleVisitByCode(actionDemand.capturedProperty.code, data)
          }
          setActionType(null)
          setActionDemand(null)
        }}
        onSubmitProposta={(data) => {
          if (actionDemand?.capturedProperty?.code) {
            submitProposalByCode(actionDemand.capturedProperty.code, data)
          }
          setActionType(null)
          setActionDemand(null)
        }}
        onSubmitNegocio={(data) => {
          if (actionDemand?.capturedProperty?.code) {
            closeDealByCode(actionDemand.capturedProperty.code, data)
          }
          setActionType(null)
          setActionDemand(null)
        }}
      />
    </div>
  )
}
