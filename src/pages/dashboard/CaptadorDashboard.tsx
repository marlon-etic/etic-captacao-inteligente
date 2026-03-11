import { useMemo, useState } from 'react'
import { PackageSearch, Clock, Map, Handshake, Archive, CheckSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DemandCard } from '@/components/DemandCard'
import { DemandActionModal } from '@/components/DemandActionModal'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Demand } from '@/types'

export function CaptadorDashboard() {
  const { demands, submitDemandResponse } = useAppStore()
  const { toast } = useToast()

  const [modalState, setModalState] = useState<{
    isOpen: boolean
    demand: Demand | null
    type: 'encontrei' | 'nao_encontrei' | null
  }>({ isOpen: false, demand: null, type: null })

  const stats = useMemo(() => {
    const counts = {
      pending: 0,
      waiting: 0,
      captured: 0,
      noDemand: 0,
      visit: 0,
      deal: 0,
      emCaptacao: 0,
    }
    demands.forEach((d) => {
      if (d.status === 'Pendente') counts.pending++
      if (d.status === 'Aguardando') counts.waiting++
      if (d.status === 'Captado sob demanda') counts.captured++
      if (d.status === 'Sem demanda') counts.noDemand++
      if (d.status === 'Visita') counts.visit++
      if (d.status === 'Negócio') counts.deal++
      if (d.status === 'Em Captação') counts.emCaptacao++
    })
    return counts
  }, [demands])

  const pendingDemands = demands.filter(
    (d) => d.status === 'Pendente' || d.status === 'Em Captação',
  )

  const openActionModal = (id: string, type: 'encontrei' | 'nao_encontrei') => {
    const demand = demands.find((d) => d.id === id)
    if (demand) {
      setModalState({ isOpen: true, demand, type })
    }
  }

  const handleModalSubmit = (payload: any) => {
    if (!modalState.demand || !modalState.type) return

    const result = submitDemandResponse(modalState.demand.id, modalState.type, payload)

    if (result.success) {
      toast({
        title: modalState.type === 'encontrei' ? 'Sucesso!' : 'Atualizado',
        description: result.message,
      })
    } else {
      toast({
        title: 'Erro',
        description: result.message,
        variant: 'destructive',
      })
    }

    setModalState({ isOpen: false, demand: null, type: null })
  }

  const statCards = [
    {
      title: 'Ativas',
      value: stats.pending + stats.emCaptacao,
      icon: Clock,
      color: 'text-orange-500',
      bg: 'bg-orange-100',
    },
    {
      title: 'Captados',
      value: stats.captured,
      icon: CheckSquare,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      title: 'Visitas',
      value: stats.visit,
      icon: Map,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
    },
    {
      title: 'Negócios',
      value: stats.deal,
      icon: Handshake,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      title: 'Aguardando',
      value: stats.waiting,
      icon: PackageSearch,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      title: 'Sem Demanda',
      value: stats.noDemand,
      icon: Archive,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Painel de Captação</h1>
        <p className="text-muted-foreground text-sm">
          Resumo das suas atividades e demandas ativas.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {statCards.map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className={`p-2 rounded-full ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.title}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="pt-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          Oportunidades Ativas
          <span className="bg-primary text-primary-foreground text-xs py-0.5 px-2 rounded-full">
            {pendingDemands.length}
          </span>
        </h2>
        {pendingDemands.length === 0 ? (
          <div className="text-center p-8 bg-background border rounded-xl border-dashed">
            <PackageSearch className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Nenhuma demanda ativa no momento</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingDemands.map((demand) => (
              <DemandCard
                key={demand.id}
                demand={demand}
                showActions={demand.status === 'Pendente' || demand.status === 'Em Captação'}
                onAction={(id, action) => openActionModal(id, action)}
              />
            ))}
          </div>
        )}
      </div>

      <DemandActionModal
        isOpen={modalState.isOpen}
        demand={modalState.demand}
        actionType={modalState.type}
        onClose={() => setModalState({ isOpen: false, demand: null, type: null })}
        onConfirm={handleModalSubmit}
      />
    </div>
  )
}
