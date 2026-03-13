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
    {
      title: 'Total Demandas',
      value: curr.total,
      prev: prev.total,
      icon: BarChart2,
      color: 'text-gray-700',
      bg: 'bg-gray-100',
      border: 'border-gray-300',
    },
    {
      title: 'Em Andamento',
      value: curr.inProgress,
      prev: prev.inProgress,
      icon: Clock,
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      border: 'border-blue-300',
    },
    {
      title: 'Captadas',
      value: curr.captured,
      prev: prev.captured,
      icon: CheckCircle2,
      color: 'text-green-700',
      bg: 'bg-green-100',
      border: 'border-green-300',
    },
    {
      title: 'Perdidas',
      value: curr.lost,
      prev: prev.lost,
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-100',
      border: 'border-red-300',
    },
    {
      title: 'Visitas Agend.',
      value: curr.visited,
      prev: prev.visited,
      icon: Eye,
      color: 'text-orange-700',
      bg: 'bg-orange-100',
      border: 'border-orange-300',
    },
    {
      title: 'Negócios Fechados',
      value: curr.closed,
      prev: prev.closed,
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      border: 'border-emerald-300',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
      {metrics.map((m, i) => {
        const diff = m.value - m.prev
        const diffText = diff >= 0 ? `+${diff} vs anterior` : `${diff} vs anterior`
        const isPositive = diff > 0
        const isNegative = diff < 0

        // Custom logic to inverse sentiment for lost deals
        const isGood = m.title === 'Perdidas' ? isNegative : isPositive
        const diffColor = isGood
          ? 'text-emerald-600'
          : isNegative || (m.title === 'Perdidas' && isPositive)
            ? 'text-red-600'
            : 'text-muted-foreground'

        return (
          <Card
            key={i}
            className={`w-full min-h-[110px] p-4 sm:p-5 border-l-[6px] ${m.border} shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between w-full">
              <div className="flex flex-col min-w-0 pr-2">
                <h3
                  className="text-xs sm:text-[13px] text-muted-foreground font-bold uppercase tracking-wider truncate mb-1"
                  title={m.title}
                >
                  {m.title}
                </h3>
                <div className="text-2xl sm:text-3xl font-black leading-none text-foreground">
                  {m.value}
                </div>
              </div>
              <div className={`p-2 rounded-full ${m.bg} shrink-0`} aria-hidden="true">
                <m.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${m.color}`} />
              </div>
            </div>
            <p className={`text-[11px] sm:text-xs font-semibold mt-2 ${diffColor}`}>{diffText}</p>
          </Card>
        )
      })}
    </div>
  )
}
