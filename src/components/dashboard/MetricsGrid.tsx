import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Activity,
  CheckCircle,
  Home,
  XCircle,
  Users,
  Target,
  ArrowUp,
  ArrowDown,
  Minus,
  Link as LinkIcon,
  Unlock,
} from 'lucide-react'
import { Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'

interface MetricsGridProps {
  current: Demand[]
  previous: Demand[]
  period: string
}

export function MetricsGrid({ current, previous }: MetricsGridProps) {
  const { looseProperties } = useAppStore()

  const getMetrics = (data: Demand[]) => {
    let vinculados = 0
    data.forEach((d) => {
      if (d.capturedProperties) {
        vinculados += d.capturedProperties.length
      }
    })

    return {
      total: data.length,
      inProgress: data.filter((d) => ['Pendente', 'Em Captação', 'Aguardando'].includes(d.status))
        .length,
      captured: data.filter((d) =>
        ['Captado sob demanda', 'Captado independente'].includes(d.status),
      ).length,
      lost: data.filter((d) => ['Perdida', 'Impossível'].includes(d.status)).length,
      visited: data.filter((d) => d.status === 'Visita').length,
      closed: data.filter((d) => d.status === 'Negócio').length,
      vinculados,
    }
  }

  const curr = getMetrics(current)
  const prev = getMetrics(previous)
  const soltosCount = looseProperties.length

  const formatTrend = (currVal: number, prevVal: number) => {
    const diff = currVal - prevVal
    const isUp = diff > 0
    const isDown = diff < 0
    const text = `${diff > 0 ? '+' : ''}${diff} vs período ant.`
    return { diff, isUp, isDown, text }
  }

  const metrics = [
    { title: 'Total Demandas', value: curr.total, prev: prev.total, icon: Activity },
    { title: 'Em Andamento', value: curr.inProgress, prev: prev.inProgress, icon: Target },
    { title: 'Captados', value: curr.captured, prev: prev.captured, icon: Home },
    { title: 'Perdidos', value: curr.lost, prev: prev.lost, icon: XCircle, inverseTrend: true },
    { title: 'Imóveis Vinculados', value: curr.vinculados, prev: prev.vinculados, icon: LinkIcon },
    { title: 'Imóveis Soltos', value: soltosCount, prev: 0, icon: Unlock },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {metrics.map((m, i) => {
        const trend = m.prev !== undefined ? formatTrend(m.value, m.prev) : null
        const goodColor = m.inverseTrend ? 'text-red-500' : 'text-emerald-500'
        const badColor = m.inverseTrend ? 'text-emerald-500' : 'text-red-500'

        let trendColor = 'text-muted-foreground'
        if (trend?.isUp) trendColor = goodColor
        if (trend?.isDown) trendColor = badColor

        return (
          <Card key={i} className="overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle
                className="text-xs font-medium text-muted-foreground truncate"
                title={m.title}
              >
                {m.title}
              </CardTitle>
              <m.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
              {trend && (
                <div className="flex items-center mt-1 text-xs">
                  {trend.isUp ? (
                    <ArrowUp className={`mr-1 h-3 w-3 ${trendColor}`} />
                  ) : trend.isDown ? (
                    <ArrowDown className={`mr-1 h-3 w-3 ${trendColor}`} />
                  ) : (
                    <Minus className="mr-1 h-3 w-3 text-muted-foreground" />
                  )}
                  <span className={trendColor}>{trend.text}</span>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
