import { Card } from '@/components/ui/card'
import { BarChart2, Clock, CheckCircle2, XCircle, Eye, DollarSign } from 'lucide-react'
import { Demand } from '@/types'

interface MetricsGridProps {
  current: Demand[]
  previous: Demand[]
  period: string
}

export function MetricsGrid({ current, previous }: MetricsGridProps) {
  const getMetrics = (data: Demand[]) => {
    return {
      total: data.length,
      inProgress: data.filter((d) => ['Pendente', 'Em Captação', 'Aguardando'].includes(d.status))
        .length,
      captured: data.filter((d) =>
        ['Captado sob demanda', 'Captado independente', 'Visita', 'Proposta', 'Negócio'].includes(
          d.status,
        ),
      ).length,
      lost: data.filter((d) => ['Perdida', 'Impossível'].includes(d.status)).length,
      visited: data.filter((d) => ['Visita', 'Proposta', 'Negócio'].includes(d.status)).length,
      closed: data.filter((d) => d.status === 'Negócio').length,
    }
  }

  const curr = getMetrics(current)
  const prev = getMetrics(previous)

  const metrics = [
    { title: '📊 Total de Demandas', value: curr.total, prev: prev.total, icon: BarChart2 },
    { title: '⏳ Em Andamento', value: curr.inProgress, prev: prev.inProgress, icon: Clock },
    { title: '✅ Captadas', value: curr.captured, prev: prev.captured, icon: CheckCircle2 },
    { title: '❌ Perdidas', value: curr.lost, prev: prev.lost, icon: XCircle },
    { title: '👁️ Visitas Agendadas', value: curr.visited, prev: prev.visited, icon: Eye },
    { title: '💰 Negócios Fechados', value: curr.closed, prev: prev.closed, icon: DollarSign },
  ]

  return (
    <div className="flex flex-col gap-[12px] sm:grid sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m, i) => {
        const diff = m.value - m.prev
        const diffText = diff >= 0 ? `+${diff} vs período ant.` : `${diff} vs período ant.`

        return (
          <Card
            key={i}
            className="w-full h-[100px] p-[16px] border-0 shadow-sm ring-1 ring-border/50 flex flex-row items-center justify-between"
          >
            <div className="flex flex-col justify-between h-full w-full">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-[12px] text-muted-foreground font-medium leading-[16px] truncate max-w-[180px]">
                    {m.title}
                  </h3>
                  <div className="text-[28px] font-bold leading-[32px] mt-[4px]">{m.value}</div>
                </div>
                <m.icon className="w-[32px] h-[32px] text-primary shrink-0 opacity-80" />
              </div>
              <p className="text-[11px] text-muted-foreground leading-[16px]">{diffText}</p>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
