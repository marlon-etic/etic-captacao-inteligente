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
      <CardHeader className="pb-4 border-b bg-muted/20 p-4 md:p-6 lg:p-8">
        <CardTitle className="text-[16px] md:text-[18px] lg:text-[20px] leading-[24px] md:leading-[28px] lg:leading-[30px] font-bold">
          Indicadores de Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6 lg:space-y-8 pt-4 md:pt-6 lg:pt-8 p-4 md:p-6 lg:p-8">
        <div className="min-h-[60px] flex flex-col justify-center w-full">
          <div className="flex justify-between text-sm mb-2 md:mb-3 lg:mb-4">
            <span className="font-medium text-muted-foreground text-[12px] md:text-[14px]">
              Taxa de Captação
            </span>
            <span className="font-bold text-[14px] md:text-[16px]">{capRate}%</span>
          </div>
          <Progress value={capRate} className="h-2" />
        </div>

        <div className="min-h-[60px] flex flex-col justify-center w-full">
          <div className="flex justify-between text-sm mb-2 md:mb-3 lg:mb-4">
            <span className="font-medium text-muted-foreground text-[12px] md:text-[14px]">
              Taxa de Conversão
            </span>
            <span className="font-bold text-[14px] md:text-[16px]">{convRate}%</span>
          </div>
          <Progress value={convRate} className="h-2" />
        </div>

        <div className="min-h-[60px] flex flex-col justify-center w-full">
          <div className="flex justify-between text-sm mb-2 md:mb-3 lg:mb-4">
            <span className="font-medium text-muted-foreground text-[12px] md:text-[14px]">
              Tempo Médio de Resposta
            </span>
            <span className="font-bold text-[14px] md:text-[16px]">{avgResponse} horas</span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, 100 - avgResponse * 2))}
            className="h-2 bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  )
}
