import { useMemo } from 'react'
import { Demand, User } from '@/types'
import { PerformanceMetricsCards } from './PerformanceMetricsCards'
import { PerformanceProgress } from './PerformanceProgress'
import { PerformanceRanking } from './PerformanceRanking'
import { PerformanceChart } from './PerformanceChart'
import { Button } from '@/components/ui/button'
import { BookOpen, BarChart2 } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'

export function CaptadorPerformanceTab({
  demands,
  currentUser,
  onViewDemands,
}: {
  demands: Demand[]
  currentUser: User
  onViewDemands: () => void
}) {
  const { users } = useAppStore()
  const { toast } = useToast()

  const metrics = useMemo(() => {
    const userDemands = demands.filter(
      (d) =>
        d.assignedTo === currentUser.id ||
        d.capturedProperties?.some((p) => p.captador_id === currentUser.id),
    )
    const recebidas = userDemands.length
    const captados = userDemands.filter((d) =>
      d.capturedProperties?.some((p) => p.captador_id === currentUser.id),
    ).length
    const visitas = userDemands.filter((d) =>
      d.capturedProperties?.some((p) => p.visitaDate && p.captador_id === currentUser.id),
    ).length
    const fechados = userDemands.filter((d) =>
      d.capturedProperties?.some((p) => p.fechamentoDate && p.captador_id === currentUser.id),
    ).length
    const perdidas = userDemands.filter(
      (d) => d.status === 'Perdida' || d.status === 'Impossível',
    ).length

    return { recebidas, captados, visitas, fechados, perdidas, userDemands }
  }, [demands, currentUser])

  if (metrics.userDemands.length === 0 && currentUser.points === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-background border rounded-xl border-dashed shadow-sm">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <BarChart2 className="w-8 h-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-xl font-bold mb-2">Nenhuma métrica disponível</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Comece a captar imóveis e registrar suas conquistas para ver seus resultados
          impressionantes aqui.
        </p>
        <Button onClick={onViewDemands} className="mt-6 font-semibold" size="lg">
          <BookOpen className="w-5 h-5 mr-2" /> Ver Demandas Pendentes
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PerformanceMetricsCards metrics={metrics} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <PerformanceProgress metrics={metrics} currentUser={currentUser} />
          <PerformanceChart userDemands={metrics.userDemands} />
        </div>
        <div className="space-y-6 flex flex-col">
          <PerformanceRanking currentUser={currentUser} users={users} />
          <div className="flex flex-col gap-3">
            <Button
              className="w-full justify-start py-6 font-semibold text-base shadow-sm"
              variant="default"
              onClick={onViewDemands}
            >
              📖 Ver Demandas Pendentes
            </Button>
            <Button
              className="w-full justify-start py-6 font-semibold text-base shadow-sm"
              variant="outline"
              onClick={() =>
                toast({
                  title: 'Relatório Solicitado',
                  description: 'O relatório detalhado da sua performance está sendo gerado em PDF.',
                })
              }
            >
              📊 Ver Relatório Detalhado
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
