import { Demand, CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'

export function CapturedPropertyCard({
  demand,
  property,
  onAction,
}: {
  demand?: Demand
  property: CapturedProperty
  onAction?: (
    t: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details',
    d: Demand,
    p: CapturedProperty,
  ) => void
}) {
  const { users } = useAppStore()

  const capturer = users.find((u) => u.id === property.captador_id)
  const capturerName = capturer?.name || property.captador_name || 'Não informado'

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const handleAction = (type: 'visita' | 'negocio' | 'details') => {
    if (onAction && demand) {
      onAction(type, demand, property)
    }
  }

  const isClosed = !!property.fechamentoDate
  const isVisita = !!property.visitaDate && !isClosed

  const status = isClosed ? 'Negócio Fechado' : isVisita ? 'Visita Agendada' : 'Captado'
  const badgeClass = isClosed
    ? 'bg-green-100 text-green-800 border-green-200'
    : isVisita
      ? 'bg-orange-100 text-orange-800 border-orange-200'
      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
  const badgeIcon = isClosed ? '🟢' : isVisita ? '🟠' : '🟡'

  return (
    <Card className="w-full rounded-xl mb-3 border hover:shadow-md flex flex-col bg-card">
      <CardContent className="p-4 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-4 gap-2">
          <div className="font-bold text-[14px]">🏠 Cód: {property.code}</div>
          <Badge variant="outline" className={`font-bold text-[11px] h-6 shrink-0 ${badgeClass}`}>
            {badgeIcon} {status}
          </Badge>
        </div>

        <div className="flex flex-col gap-[4px] text-[13px] flex-grow text-muted-foreground">
          <div>
            📍 Localização:{' '}
            <span className="font-semibold text-foreground">{property.neighborhood}</span>
          </div>
          <div>
            💰 Valor:{' '}
            <span className="font-semibold text-foreground">R$ {formatPrice(property.value)}</span>
          </div>
          <div>
            🏠 Perfil:{' '}
            <span className="font-semibold text-foreground">
              {property.bedrooms || 0} dorm, {property.bathrooms || 0} banh,{' '}
              {property.parkingSpots || 0} vagas
            </span>
          </div>
          <div>
            👤 Captador: <span className="font-semibold text-foreground">{capturerName}</span>
          </div>
          <div>
            📅 Data de Captação:{' '}
            <span className="font-semibold text-foreground">
              {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
            </span>
          </div>

          <div className="mt-3 pt-3 border-t text-[12px]">
            Demanda Atendida: <strong className="text-foreground">{demand?.clientName}</strong> em{' '}
            {demand?.location}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t w-full">
          {!isClosed && !isVisita && (
            <Button
              className="h-[44px] sm:h-[40px] flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold text-[12px] min-w-0"
              onClick={() => handleAction('visita')}
            >
              👁️ VISITA AGENDADA
            </Button>
          )}
          {isVisita && (
            <Button
              className="h-[44px] sm:h-[40px] flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[12px] min-w-0"
              onClick={() => handleAction('negocio')}
            >
              💰 NEGÓCIO FECHADO
            </Button>
          )}
          <Button
            variant="outline"
            className="h-[44px] sm:h-[40px] flex-1 font-bold text-[12px] bg-secondary/50 min-w-0"
            onClick={() => handleAction('details')}
          >
            📖 Ver Detalhes
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
