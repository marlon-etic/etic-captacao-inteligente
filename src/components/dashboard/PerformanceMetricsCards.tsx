import { Card, CardContent } from '@/components/ui/card'
import { FileText, Home, Calendar, Handshake, XCircle } from 'lucide-react'

interface Metrics {
  recebidas: number
  captados: number
  visitas: number
  fechados: number
  perdidas: number
}

export function PerformanceMetricsCards({ metrics }: { metrics: Metrics }) {
  const cards = [
    {
      title: 'Demandas Recebidas',
      value: metrics.recebidas,
      icon: FileText,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
      border: 'border-gray-500',
    },
    {
      title: 'Imóveis Captados',
      value: metrics.captados,
      icon: Home,
      color: 'text-green-600',
      bg: 'bg-green-100',
      border: 'border-green-500',
    },
    {
      title: 'Visitas Agendadas',
      value: metrics.visitas,
      icon: Calendar,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      border: 'border-blue-500',
    },
    {
      title: 'Negócios Fechados',
      value: metrics.fechados,
      icon: Handshake,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
      border: 'border-emerald-500',
    },
    {
      title: 'Perdidas',
      value: metrics.perdidas,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
      border: 'border-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
      {cards.map((c, i) => (
        <Card
          key={i}
          className={`border-l-4 ${c.border} shadow-sm min-h-[100px] md:min-h-[120px] lg:min-h-[140px] flex items-center p-4 md:p-6 lg:p-8`}
        >
          <CardContent className="p-0 flex items-center gap-4 md:gap-6 w-full">
            <div className={`p-4 md:p-5 rounded-full shrink-0 ${c.bg}`}>
              <c.icon className={`w-6 h-6 md:w-8 md:h-8 ${c.color}`} />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[12px] md:text-[14px] font-medium text-muted-foreground leading-tight uppercase tracking-wide mb-2 min-h-[14px]">
                {c.title}
              </p>
              <p className="text-[24px] md:text-[28px] lg:text-[32px] font-bold min-h-[28px] md:min-h-[32px]">
                {c.value}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
