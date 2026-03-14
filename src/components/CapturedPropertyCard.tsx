import { Demand, CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Eye, Handshake, BookOpen } from 'lucide-react'

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

  const status = isClosed ? 'Negócio' : isVisita ? 'Visita' : 'Captado'
  const badgeClass = isClosed
    ? 'bg-[#00AA00]/10 text-[#00AA00] border-none'
    : isVisita
      ? 'bg-[#FFD700]/20 text-[#B8860B] border-none'
      : 'bg-[#4444FF]/10 text-[#4444FF] border-none'
  const badgeIcon = isClosed ? '🟢' : isVisita ? '🟠' : '🟡'

  const propType = property.propertyType || demand?.type || 'Venda'
  const isAluguel = propType === 'Aluguel'
  const typeColor = isAluguel ? 'bg-[#4444FF]' : 'bg-[#FF4444]'

  return (
    <Card className="w-full min-h-[140px] md:min-h-[160px] rounded-[12px] mb-[16px] border border-[#E5E5E5] hover:shadow-md flex flex-col bg-[#FFFFFF] transition-all duration-200">
      <CardContent className="p-[16px] flex flex-col flex-1">
        <div className="flex justify-between items-start mb-[12px] gap-[8px]">
          <Badge className={cn('font-bold text-[10px] text-white px-2 py-1', typeColor)}>
            {isAluguel ? '🏠 ALUGUEL' : '🏢 VENDA'}
          </Badge>
          <Badge variant="outline" className={cn('font-bold text-[10px]', badgeClass)}>
            {badgeIcon} {status}
          </Badge>
        </div>

        <div className="flex flex-col gap-[4px] flex-grow">
          <h3 className="text-[14px] font-bold text-[#333333] leading-tight">
            🏠 Cód: {property.code}
          </h3>
          <p className="text-[12px] text-[#999999] leading-tight">
            📍 Localização: <span className="text-[#333333]">{property.neighborhood}</span>
          </p>
          <p className="text-[14px] font-bold text-[#333333] mt-[4px]">
            💰 Valor: R$ {formatPrice(property.value)}
          </p>
          <p className="text-[12px] text-[#333333] mt-[2px]">
            🏠 Perfil: {property.bedrooms || 0} dorm, {property.bathrooms || 0} banh,{' '}
            {property.parkingSpots || 0} vagas
          </p>
          <p className="text-[12px] text-[#999999] mt-[4px]">
            👤 Captador: <span className="text-[#333333] font-medium">{capturerName}</span>
          </p>
          <p className="text-[12px] text-[#999999]">
            📅 Data de Captação:{' '}
            <span className="text-[#333333] font-medium">
              {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
            </span>
          </p>

          {demand && (
            <div className="mt-[12px] pt-[12px] border-t border-[#E5E5E5] text-[12px] text-[#999999]">
              Demanda: <strong className="text-[#333333]">{demand.clientName}</strong> em{' '}
              {demand.location}
            </div>
          )}
        </div>

        <div className="flex flex-row flex-wrap sm:flex-nowrap gap-[8px] mt-[16px] w-full">
          {!isClosed && !isVisita && (
            <Button
              className="flex-1 h-[44px] min-w-[100px] bg-[#FFD700] hover:bg-[#E6C200] text-[#333333] font-bold text-[14px] px-2 shadow-sm"
              onClick={() => handleAction('visita')}
            >
              <Eye className="w-[16px] h-[16px] sm:mr-[6px]" />
              <span className="hidden sm:inline">Visita</span>
            </Button>
          )}
          {isVisita && (
            <Button
              className="flex-1 h-[44px] min-w-[100px] bg-[#00AA00] hover:bg-[#009000] text-white font-bold text-[14px] px-2 shadow-sm"
              onClick={() => handleAction('negocio')}
            >
              <Handshake className="w-[16px] h-[16px] sm:mr-[6px]" />
              <span className="hidden sm:inline">Negócio</span>
            </Button>
          )}
          <Button
            variant="outline"
            className="flex-1 h-[44px] min-w-[100px] border-[#4444FF] text-[#4444FF] hover:bg-[#4444FF] hover:text-white font-bold text-[14px] px-2"
            onClick={() => handleAction('details')}
          >
            <BookOpen className="w-[16px] h-[16px] sm:mr-[6px]" />
            <span className="hidden sm:inline">Detalhes</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
