import { useMemo } from 'react'
import { PackageSearch, Clock, Map, Handshake, Archive, CheckSquare } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DemandCard } from '@/components/DemandCard'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

export function CaptadorDashboard() {
  const { demands, updateDemandStatus } = useAppStore()
  const { toast } = useToast()

  const stats = useMemo(() => {
    const counts = { pending: 0, waiting: 0, captured: 0, noDemand: 0, visit: 0, deal: 0 }
    demands.forEach((d) => {
      if (d.status === 'Pendente') counts.pending++
      if (d.status === 'Aguardando') counts.waiting++
      if (d.status === 'Captado sob demanda') counts.captured++
      if (d.status === 'Sem demanda') counts.noDemand++
      if (d.status === 'Visita') counts.visit++
      if (d.status === 'Negócio') counts.deal++
    })
    return counts
  }, [demands])

  const pendingDemands = demands.filter((d) => d.status === 'Pendente')

  const handleAction = (id: string, action: 'encontrei' | 'nao_encontrei') => {
    if (action === 'encontrei') {
      updateDemandStatus(id, 'Captado sob demanda')
      toast({ title: 'Sucesso', description: '+100 Pontos! Demanda captada.' })
    } else {
      updateDemandStatus(id, 'Sem demanda')
      toast({ title: 'Atualizado', description: 'Demanda marcada como não encontrada.' })
    }
  }

  const statCards = [
    {
      title: 'Pendentes',
      value: stats.pending,
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
          Resumo das suas atividades e demandas pendentes.
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
            <p className="text-muted-foreground font-medium">Nenhuma demanda pendente</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pendingDemands.map((demand) => (
              <DemandCard key={demand.id} demand={demand} showActions onAction={handleAction} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
