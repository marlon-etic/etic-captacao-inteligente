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
      hover: 'hover:bg-gray-200',
      border: 'border-gray-400',
      data: m.total,
    },
    {
      id: 'inProgress',
      title: 'Em Andamento',
      icon: Clock,
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      hover: 'hover:bg-blue-200',
      border: 'border-blue-400',
      data: m.inProgress,
    },
    {
      id: 'captured',
      title: 'Captados',
      icon: CheckCircle2,
      color: 'text-green-700',
      bg: 'bg-green-100',
      hover: 'hover:bg-green-200',
      border: 'border-green-400',
      data: m.captured,
    },
    {
      id: 'lost',
      title: 'Perdidos',
      icon: XCircle,
      color: 'text-red-700',
      bg: 'bg-red-100',
      hover: 'hover:bg-red-200',
      border: 'border-red-400',
      data: m.lost,
    },
    {
      id: 'visited',
      title: 'Visitas Agendadas',
      icon: Eye,
      color: 'text-orange-700',
      bg: 'bg-orange-100',
      hover: 'hover:bg-orange-200',
      border: 'border-orange-400',
      data: m.visited,
    },
    {
      id: 'closed',
      title: 'Negócios Fechados',
      icon: DollarSign,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      hover: 'hover:bg-emerald-200',
      border: 'border-emerald-400',
      data: m.closed,
    },
  ]

  return (
    <div className="flex flex-row flex-wrap gap-[16px] lg:gap-[24px]">
      {cards.map((c) => (
        <Card
          key={c.id}
          onClick={() => onCardClick({ id: c.id, title: c.title, data: c.data })}
          className={`cursor-pointer transition-all duration-200 w-full sm:w-[calc(48%)] xl:w-[22%] shrink-0 flex-grow h-[100px] sm:h-[120px] lg:h-[140px] border-0 border-l-[6px] shadow-sm ${c.border} ${c.bg} ${c.hover} flex items-center p-[16px] md:p-[20px] lg:p-[24px]`}
        >
          <CardContent className="p-0 flex items-center justify-between w-full h-full">
            <div className="flex flex-col h-full justify-center">
              <p className="text-[16px] sm:text-[18px] lg:text-[20px] font-bold text-foreground/80 leading-tight mb-2 uppercase tracking-wide">
                {c.title}
              </p>
              <p className="text-[28px] sm:text-[32px] lg:text-[36px] font-black text-foreground leading-none">
                {c.data.length}
              </p>
            </div>
            <div className={`p-3 rounded-full bg-background/50 ${c.color} shadow-sm shrink-0`}>
              <c.icon className="w-8 h-8 sm:w-10 sm:h-10 opacity-90" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
