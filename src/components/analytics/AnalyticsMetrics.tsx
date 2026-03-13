import { Demand } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { BarChart2, Clock, CheckCircle2, XCircle, Eye, DollarSign } from 'lucide-react'

export function AnalyticsMetrics({
  demands,
  onCardClick,
}: {
  demands: Demand[]
  onCardClick: (m: any) => void
}) {
  const m = {
    total: demands,
    inProgress: demands.filter((d) => ['Pendente', 'Em Captação', 'Aguardando'].includes(d.status)),
    captured: demands.filter((d) =>
      ['Captado sob demanda', 'Captado independente', 'Visita', 'Proposta', 'Negócio'].includes(
        d.status,
      ),
    ),
    lost: demands.filter((d) => ['Perdida', 'Impossível'].includes(d.status)),
    visited: demands.filter((d) => ['Visita', 'Proposta', 'Negócio'].includes(d.status)),
    closed: demands.filter((d) => d.status === 'Negócio'),
  }

  const cards = [
    {
      id: 'total',
      title: 'Total de Demandas',
      icon: BarChart2,
      color: 'text-gray-700',
      bg: 'bg-gray-100',
      hover: 'hover:border-gray-500 hover:shadow-md hover:-translate-y-1',
      border: 'border-gray-400',
      data: m.total,
    },
    {
      id: 'inProgress',
      title: 'Em Andamento',
      icon: Clock,
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      hover: 'hover:border-blue-500 hover:shadow-md hover:-translate-y-1',
      border: 'border-blue-400',
      data: m.inProgress,
    },
    {
      id: 'captured',
      title: 'Captados',
      icon: CheckCircle2,
      color: 'text-green-700',
      bg: 'bg-green-100',
      hover: 'hover:border-green-500 hover:shadow-md hover:-translate-y-1',
      border: 'border-green-400',
      data: m.captured,
    },
    {
      id: 'lost',
      title: 'Perdidos',
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-100',
      hover: 'hover:border-red-500 hover:shadow-md hover:-translate-y-1',
      border: 'border-red-400',
      data: m.lost,
    },
    {
      id: 'visited',
      title: 'Visitas Agendadas',
      icon: Eye,
      color: 'text-orange-700',
      bg: 'bg-orange-100',
      hover: 'hover:border-orange-500 hover:shadow-md hover:-translate-y-1',
      border: 'border-orange-400',
      data: m.visited,
    },
    {
      id: 'closed',
      title: 'Negócios Fechados',
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      hover: 'hover:border-emerald-500 hover:shadow-md hover:-translate-y-1',
      border: 'border-emerald-400',
      data: m.closed,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 w-full">
      {cards.map((c) => (
        <Card
          key={c.id}
          tabIndex={0}
          role="button"
          aria-label={`Ver detalhes de ${c.title}. Total: ${c.data.length}`}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ')
              onCardClick({ id: c.id, title: c.title, data: c.data })
          }}
          onClick={() => onCardClick({ id: c.id, title: c.title, data: c.data })}
          className={`cursor-pointer transition-all duration-300 w-full min-h-[110px] border-0 border-b-[4px] shadow-sm ${c.border} ${c.hover} flex items-center p-4 sm:p-5`}
        >
          <CardContent className="p-0 flex items-center justify-between w-full h-full gap-2">
            <div className="flex flex-col h-full justify-center min-w-0 pr-2">
              <p
                className="text-xs sm:text-[13px] font-bold text-muted-foreground uppercase tracking-wide leading-tight mb-2 truncate"
                title={c.title}
              >
                {c.title}
              </p>
              <p className="text-2xl sm:text-3xl font-black text-foreground leading-none">
                {c.data.length}
              </p>
            </div>
            <div
              className={`p-3 rounded-xl bg-muted/30 ${c.color} shadow-sm shrink-0`}
              aria-hidden="true"
            >
              <c.icon className="w-6 h-6 sm:w-8 sm:h-8 opacity-90" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
