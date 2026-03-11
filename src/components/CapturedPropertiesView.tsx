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
import { Badge } from '@/components/ui/badge'
import { CapturedPropertyCard } from './CapturedPropertyCard'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { Demand } from '@/types'

export function CapturedPropertiesView() {
  const { demands, currentUser, scheduleVisitByCode, closeDealByCode } = useAppStore()
  const [statusFilter, setStatusFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')

  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionType, setActionType] = useState<'visita' | 'negocio' | null>(null)

  const capturedDemands = useMemo(() => {
    return demands.filter(
      (d) =>
        ['Captado sob demanda', 'Captado independente', 'Visita', 'Negócio'].includes(d.status) &&
        d.createdBy === currentUser?.id &&
        d.capturedProperty,
    )
  }, [demands, currentUser])

  const uniqueClients = useMemo(
    () => Array.from(new Set(capturedDemands.map((d) => d.clientName))).sort(),
    [capturedDemands],
  )

  const filtered = useMemo(() => {
    return capturedDemands.filter((d) => {
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'Captado' &&
          ['Captado sob demanda', 'Captado independente'].includes(d.status)) ||
        (statusFilter === 'Visita' && d.status === 'Visita') ||
        (statusFilter === 'Negocio' && d.status === 'Negócio')

      const matchClient = clientFilter === 'all' || d.clientName === clientFilter
      return matchStatus && matchClient
    })
  }, [capturedDemands, statusFilter, clientFilter])

  const grouped = useMemo(() => {
    const map = new Map<string, Demand[]>()
    filtered.forEach((d) => {
      const list = map.get(d.clientName) || []
      list.push(d)
      map.set(d.clientName, list)
    })
    return Array.from(map.entries())
  }, [filtered])

  const handleAction = (type: 'visita' | 'negocio', demand: Demand) => {
    setActionType(type)
    setActionDemand(demand)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="Captado">🟡 Captado</SelectItem>
            <SelectItem value="Visita">🟠 Visita Agendada</SelectItem>
            <SelectItem value="Negocio">🟢 Negócio Fechado</SelectItem>
          </SelectContent>
        </Select>

        <Select value={clientFilter} onValueChange={setClientFilter}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Filtrar por Cliente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Clientes</SelectItem>
            {uniqueClients.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {grouped.length === 0 ? (
        <div className="text-center p-12 bg-background border rounded-xl border-dashed">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">
            Nenhum imóvel captado encontrado para os filtros atuais.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map(([clientName, clientDemands]) => (
            <div key={clientName} className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2 flex items-center gap-2">
                <span>Cliente: {clientName}</span>
                <Badge variant="secondary" className="rounded-full bg-primary/10 text-primary">
                  {clientDemands.length}
                </Badge>
              </h3>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {clientDemands.map((demand) => (
                  <CapturedPropertyCard key={demand.id} demand={demand} onAction={handleAction} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <CapturedPropertyModals
        demand={actionDemand}
        actionType={actionType}
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
