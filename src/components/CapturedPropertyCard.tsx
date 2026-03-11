import { MapPin, Calendar } from 'lucide-react'
import { Demand } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const statusLabels = {
  'Captado sob demanda': {
    label: '🟡 Captado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  'Captado independente': {
    label: '🟡 Captado',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  Visita: { label: '🟠 Visita Agendada', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  Negócio: {
    label: '🟢 Negócio Fechado',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
}

export function CapturedPropertyCard({
  demand,
  onAction,
}: {
  demand: Demand
  onAction: (t: 'visita' | 'negocio', d: Demand) => void
}) {
  const prop = demand.capturedProperty!
  const st =
    statusLabels[demand.status as keyof typeof statusLabels] || statusLabels['Captado sob demanda']

  return (
    <Card className="overflow-hidden flex flex-col h-full border-border/50 hover:shadow-md transition-all">
      <div className="relative h-48 w-full bg-muted">
        <img
          src={prop.photoUrl || `https://img.usecurling.com/p/400/300?q=house&seed=${demand.id}`}
          alt="Imóvel"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className={cn('font-medium shadow-sm', st.color)}>
            {st.label}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-2">
          <Badge
            variant="secondary"
            className="bg-black/70 text-white border-none hover:bg-black/80 shadow-sm"
          >
            Cód: {prop.code}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 flex-grow flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-lg line-clamp-1 flex-1" title={prop.neighborhood}>
            {prop.neighborhood}
          </h4>
          <span className="font-bold text-primary whitespace-nowrap">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(prop.value)}
          </span>
        </div>
        <p
          className="text-sm text-muted-foreground flex items-center gap-1 line-clamp-1"
          title={demand.location}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />{' '}
          <span className="truncate">{demand.location}</span>
        </p>
        <p className="text-xs text-muted-foreground">
          Captado em: {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
        </p>

        {demand.status === 'Visita' && prop.visitaDate && (
          <div className="mt-2 bg-orange-50 p-2.5 rounded-md border border-orange-100 text-xs text-orange-800 space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Visita:{' '}
              {new Date(prop.visitaDate + 'T00:00:00').toLocaleDateString('pt-BR')} às{' '}
              {prop.visitaTime}
            </p>
            {prop.visitaObs && <p className="opacity-90 line-clamp-2">Obs: {prop.visitaObs}</p>}
          </div>
        )}

        {demand.status === 'Negócio' && prop.fechamentoDate && (
          <div className="mt-2 bg-emerald-50 p-2.5 rounded-md border border-emerald-100 text-xs text-emerald-800 space-y-1">
            <p className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Fechado em:{' '}
              {new Date(prop.fechamentoDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
            <p className="font-semibold">
              Valor Final:{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(prop.fechamentoValue || 0)}
            </p>
          </div>
        )}
      </CardContent>
      <div className="p-4 pt-0 mt-auto flex flex-col gap-2">
        <Button
          size="sm"
          variant={demand.status === 'Visita' ? 'secondary' : 'outline'}
          className="w-full justify-start text-xs font-semibold"
          disabled={demand.status === 'Negócio'}
          onClick={() => onAction('visita', demand)}
        >
          👁️ VISITA AGENDADA
        </Button>
        <Button
          size="sm"
          variant={demand.status === 'Negócio' ? 'default' : 'outline'}
          className={cn(
            'w-full justify-start text-xs font-semibold',
            demand.status !== 'Negócio' &&
              'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300',
          )}
          disabled={demand.status === 'Negócio'}
          onClick={() => onAction('negocio', demand)}
        >
          💰 NEGÓCIO FECHADO
        </Button>
      </div>
    </Card>
  )
}
