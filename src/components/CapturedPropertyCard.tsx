import { Demand, CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import useAppStore from '@/stores/useAppStore'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function CapturedPropertyCard({
  demand,
  property,
  onAction,
}: {
  demand?: Demand
  property: CapturedProperty
  onAction?: (
    t: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history',
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

  const handleAction = (type: 'visita' | 'negocio' | 'lost') => {
    if (onAction && demand) {
      onAction(type, demand, property)
    }
  }

  const isClosed = !!property.fechamentoDate
  const isProposta = !!property.propostaDate && !isClosed
  const isVisita = !!property.visitaDate && !isProposta && !isClosed

  return (
    <Card className="w-full min-h-[140px] rounded-[12px] mb-[12px] border transition-all hover:shadow-md overflow-hidden">
      <CardContent className="p-[16px] flex flex-col h-full">
        <div className="flex flex-col gap-[2px] flex-grow">
          <div className="text-[12px] leading-[16px]">🏢 Captado por: {capturerName}</div>
          <div className="text-[12px] leading-[16px]">📍 Localização: {property.neighborhood}</div>
          <div className="text-[14px] font-bold leading-[20px]">
            💰 Valor: R$ {formatPrice(property.value)}
          </div>
          <div className="text-[12px] leading-[16px]">
            🏠 Perfil: {property.bedrooms || 0} dorm, {property.bathrooms || 0} banh,{' '}
            {property.parkingSpots || 0} vagas
          </div>
          <div className="text-[11px] leading-[16px] text-muted-foreground mt-[2px]">
            📅 Captado em: {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
          </div>
        </div>

        <div className="flex flex-row gap-[8px] mt-[16px]">
          <Button
            className="h-[44px] flex-1 text-[12px] sm:text-[14px] leading-[20px] bg-background text-foreground hover:bg-muted px-2"
            variant="outline"
            onClick={() => handleAction('visita')}
            disabled={isClosed}
          >
            👁️ <span className="truncate">{isVisita ? 'AGENDADA' : 'VISITA'}</span>
          </Button>
          <Button
            className="h-[44px] flex-1 text-[12px] sm:text-[14px] leading-[20px] bg-emerald-600 text-white hover:bg-emerald-700 px-2"
            onClick={() => handleAction('negocio')}
            disabled={isClosed}
          >
            💰 <span className="truncate">{isClosed ? 'FECHADO' : 'NEGÓCIO'}</span>
          </Button>
          {!isClosed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  className="h-[44px] px-3 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleAction('lost')}
                >
                  ❌
                </Button>
              </TooltipTrigger>
              <TooltipContent>Dispensar Imóvel</TooltipContent>
            </Tooltip>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
