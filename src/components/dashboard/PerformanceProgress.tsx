import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { User } from '@/types'

interface Metrics {
  recebidas: number
  captados: number
  visitas: number
  fechados: number
  perdidas: number
}

export function PerformanceProgress({
  metrics,
  currentUser,
}: {
  metrics: Metrics
  currentUser: User
}) {
  const capRate =
    metrics.recebidas > 0 ? Math.round((metrics.captados / metrics.recebidas) * 100) : 0
  const convRate =
    metrics.captados > 0 ? Math.round((metrics.fechados / metrics.captados) * 100) : 0
  const avgResponse =
    currentUser.stats.responseCount > 0
      ? Math.round(currentUser.stats.responseTimeSum / currentUser.stats.responseCount)
      : 0

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-4 border-b bg-muted/20">
        <CardTitle className="text-lg">Indicadores de Progresso</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-muted-foreground">Taxa de Captação</span>
            <span className="font-bold">{capRate}%</span>
          </div>
          <Progress value={capRate} className="h-2.5" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-muted-foreground">Taxa de Conversão</span>
            <span className="font-bold">{convRate}%</span>
          </div>
          <Progress value={convRate} className="h-2.5" />
        </div>

        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium text-muted-foreground">Tempo Médio de Resposta</span>
            <span className="font-bold">{avgResponse} horas</span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, 100 - avgResponse * 2))}
            className="h-2.5 bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  )
}
