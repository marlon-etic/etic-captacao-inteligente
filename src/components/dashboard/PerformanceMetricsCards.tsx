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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-[16px]">
      {cards.map((c, i) => (
        <Card
          key={i}
          className={`border-l-4 ${c.border} shadow-sm rounded-[12px] min-h-[100px] md:min-h-[120px] lg:min-h-[140px] flex items-center p-[16px] lg:p-[20px]`}
        >
          <CardContent className="p-0 flex items-center gap-[8px] w-full">
            <div className={`p-2 rounded-full shrink-0 ${c.bg}`}>
              <c.icon
                className={`w-[32px] h-[32px] md:w-[40px] md:h-[40px] lg:w-[48px] lg:h-[48px] ${c.color}`}
              />
            </div>
            <div className="flex flex-col justify-center">
              <p className="text-[28px] md:text-[32px] lg:text-[36px] font-bold leading-none mb-[4px]">
                {c.value}
              </p>
              <p className="text-[12px] md:text-[13px] lg:text-[14px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                {c.title}
              </p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
