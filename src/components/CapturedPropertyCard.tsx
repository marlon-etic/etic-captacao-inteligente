import { MapPin, Calendar, CheckCircle2 } from 'lucide-react'
import { Demand } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTimeElapsed } from '@/hooks/useTimeElapsed'

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

  const { text, urgencyLevel, createdDate } = useTimeElapsed(demand.createdAt)
  const isClosed = demand.status === 'Negócio'

  return (
    <Card
      className={cn(
        'overflow-hidden flex flex-col h-full border-2 transition-all hover:shadow-md relative',
        isClosed
          ? 'bg-emerald-50/40 border-emerald-400'
          : [
              urgencyLevel === 'green' && 'border-emerald-200',
              urgencyLevel === 'yellow' && 'border-yellow-300',
              urgencyLevel === 'orange' && 'border-orange-300',
              urgencyLevel === 'red' && 'border-red-400',
            ],
      )}
    >
      {!isClosed && (
        <div
          className={cn(
            'absolute top-0 left-0 w-1.5 h-full z-10',
            urgencyLevel === 'green' && 'bg-emerald-500',
            urgencyLevel === 'yellow' && 'bg-yellow-400',
            urgencyLevel === 'orange' && 'bg-orange-500',
            urgencyLevel === 'red' && 'bg-red-500',
          )}
        />
      )}
      <div className="relative h-48 w-full bg-muted pl-1.5">
        <img
          src={prop.photoUrl || `https://img.usecurling.com/p/400/300?q=house&seed=${demand.id}`}
          alt="Imóvel"
          className={cn('w-full h-full object-cover', isClosed && 'opacity-90')}
        />
        {isClosed && (
          <div className="absolute inset-0 bg-emerald-900/10 flex items-center justify-center pointer-events-none">
            <div className="bg-emerald-600 text-white px-3 py-1.5 rounded-full font-bold shadow-lg flex items-center gap-1.5 transform -rotate-3 scale-110">
              <CheckCircle2 className="w-4 h-4" />
              CONCLUÍDO
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Badge variant="outline" className={cn('font-medium shadow-sm bg-white/90', st.color)}>
            {st.label}
          </Badge>
        </div>
        <div className="absolute bottom-2 left-3.5">
          <Badge
            variant="secondary"
            className="bg-black/70 text-white border-none hover:bg-black/80 shadow-sm"
          >
            Cód: {prop.code}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 pl-5 flex-grow flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-semibold text-lg line-clamp-1 flex-1" title={prop.neighborhood}>
            {prop.neighborhood}
          </h4>
          <span
            className={cn(
              'font-bold whitespace-nowrap',
              isClosed ? 'text-emerald-700' : 'text-primary',
            )}
          >
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

        {!isClosed && (
          <div className="mt-2 p-2.5 rounded-md bg-muted/30 border border-muted/50 flex flex-col gap-0.5">
            <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
              ⏰ Criado em {createdDate.toLocaleDateString('pt-BR')}
            </span>
            <span
              className={cn(
                'flex items-center gap-1.5 text-sm font-bold',
                urgencyLevel === 'green' && 'text-emerald-600',
                urgencyLevel === 'yellow' && 'text-yellow-600',
                urgencyLevel === 'orange' && 'text-orange-600',
                urgencyLevel === 'red' && 'text-red-600',
              )}
            >
              {text}
              {urgencyLevel === 'red' && <span title="Atenção Crítica">⚠️</span>}
            </span>
          </div>
        )}

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

        {isClosed && prop.fechamentoDate && (
          <div className="mt-2 bg-emerald-100/50 p-2.5 rounded-md border border-emerald-200 text-xs text-emerald-900 space-y-1.5 flex-1">
            <p className="font-bold text-sm text-emerald-700 flex items-center gap-1.5 mb-1">
              💰 Negócio Fechado
            </p>
            <p className="font-medium flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Em:{' '}
              {new Date(prop.fechamentoDate + 'T00:00:00').toLocaleDateString('pt-BR')}
            </p>
            <p className="font-medium">
              <span className="text-emerald-700">Valor Final:</span>{' '}
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 2,
              }).format(prop.fechamentoValue || 0)}
            </p>
            {prop.fechamentoType && (
              <p className="font-medium text-emerald-700/80">
                Tipo: <span className="font-semibold text-emerald-800">{prop.fechamentoType}</span>
              </p>
            )}
          </div>
        )}
      </CardContent>
      <div className="p-4 pl-5 pt-0 mt-auto flex flex-col gap-2">
        {!isClosed && (
          <Button
            size="sm"
            variant={demand.status === 'Visita' ? 'secondary' : 'outline'}
            className="w-full justify-start text-xs font-semibold"
            disabled={demand.status === 'Negócio'}
            onClick={() => onAction('visita', demand)}
          >
            👁️ VISITA AGENDADA
          </Button>
        )}
        <Button
          size="sm"
          variant={demand.status === 'Negócio' ? 'default' : 'outline'}
          className={cn(
            'w-full justify-start text-xs font-semibold',
            isClosed && 'bg-emerald-600 hover:bg-emerald-700 text-white',
            !isClosed &&
              demand.status === 'Visita' &&
              'hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300',
          )}
          disabled={demand.status !== 'Visita'}
          onClick={() => onAction('negocio', demand)}
        >
          {isClosed ? '🎉 NEGÓCIO FECHADO' : '💰 NEGÓCIO FECHADO'}
        </Button>
      </div>
    </Card>
  )
}
