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
      <CardHeader className="pb-4 border-b bg-muted/20 p-[16px] md:p-[20px] lg:p-[24px]">
        <CardTitle className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-tight">
          Indicadores de Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-[16px] md:space-y-[20px] lg:space-y-[24px] pt-[16px] md:pt-[20px] lg:pt-[24px] p-[16px] md:p-[20px] lg:p-[24px]">
        <div className="flex flex-col justify-center w-full min-h-[60px]">
          <div className="flex justify-between items-end mb-2">
            <span className="font-medium text-muted-foreground text-[12px] md:text-[13px] lg:text-[14px]">
              Taxa de Captação
            </span>
            <span className="font-bold text-[20px] md:text-[24px] lg:text-[28px] leading-none">
              {capRate}%
            </span>
          </div>
          <Progress value={capRate} className="h-[8px] rounded-[4px]" />
        </div>

        <div className="flex flex-col justify-center w-full min-h-[60px]">
          <div className="flex justify-between items-end mb-2">
            <span className="font-medium text-muted-foreground text-[12px] md:text-[13px] lg:text-[14px]">
              Taxa de Conversão
            </span>
            <span className="font-bold text-[20px] md:text-[24px] lg:text-[28px] leading-none">
              {convRate}%
            </span>
          </div>
          <Progress value={convRate} className="h-[8px] rounded-[4px]" />
        </div>

        <div className="flex flex-col justify-center w-full min-h-[60px]">
          <div className="flex justify-between items-end mb-2">
            <span className="font-medium text-muted-foreground text-[12px] md:text-[13px] lg:text-[14px]">
              Tempo Médio de Resposta
            </span>
            <span className="font-bold text-[20px] md:text-[24px] lg:text-[28px] leading-none">
              {avgResponse} horas
            </span>
          </div>
          <Progress
            value={Math.min(100, Math.max(0, 100 - avgResponse * 2))}
            className="h-[8px] rounded-[4px] bg-muted"
          />
        </div>
      </CardContent>
    </Card>
  )
}
