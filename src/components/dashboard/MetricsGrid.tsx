import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Activity, CheckCircle, Clock, Home, Percent, Users } from 'lucide-react'

interface MetricsGridProps {
  abertas: number
  captados: number
  taxaAtendimento: number
  tempoMedio: string
  visitas: number
  conversao: number
}

export function MetricsGrid({
  abertas,
  captados,
  taxaAtendimento,
  tempoMedio,
  visitas,
  conversao,
}: MetricsGridProps) {
  const metrics = [
    { title: 'Demandas Abertas', value: abertas, icon: Activity, color: 'text-blue-500' },
    { title: 'Imóveis Captados', value: captados, icon: Home, color: 'text-emerald-500' },
    {
      title: 'Taxa de Atendimento',
      value: `${taxaAtendimento}%`,
      icon: Percent,
      color: 'text-purple-500',
    },
    { title: 'Tempo Médio', value: tempoMedio, icon: Clock, color: 'text-amber-500' },
    { title: 'Visitas Geradas', value: visitas, icon: Users, color: 'text-indigo-500' },
    {
      title: 'Taxa de Conversão',
      value: `${conversao}%`,
      icon: CheckCircle,
      color: 'text-rose-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {metrics.map((m, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">{m.title}</CardTitle>
            <m.icon className={`h-4 w-4 ${m.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{m.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
