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
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((c, i) => (
        <Card key={i} className={`border-l-4 ${c.border} shadow-sm`}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className={`p-3 rounded-full shrink-0 ${c.bg}`}>
              <c.icon className={`w-6 h-6 ${c.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground leading-tight uppercase tracking-wide mb-1">
                {c.title}
              </p>
              <p className="text-2xl font-bold">{c.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
