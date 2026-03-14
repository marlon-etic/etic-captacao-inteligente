import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
import { PrioritizeModal } from '@/components/PrioritizeModal'
import { LostModal } from '@/components/LostModal'

export function DemandCard({ demand }: { demand: Demand }) {
  const { getSimilarDemands, prioritizeDemand, markDemandLost } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
  const [showPrioritize, setShowPrioritize] = useState(false)
  const [showLost, setShowLost] = useState(false)

  const similar = getSimilarDemands(demand.id)
  const totalClients = similar.length + 1
  const isHighUrgency = demand.timeframe === 'Urgente' || demand.timeframe === 'Até 15 dias'
  const canPrioritize = totalClients >= 2 || isHighUrgency

  const handlePrioritize = (reason: string) => {
    prioritizeDemand(demand.id, reason, totalClients)
  }

  const handleLost = (reason: string, obs: string) => {
    markDemandLost(demand.id, reason, obs)
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 0,
    }).format(val)
  }

  const isAluguel = demand.type === 'Aluguel'
  const badgeLabel = isAluguel ? '🏠 ALUGUEL' : '🏢 VENDA'
  const badgeColor = isAluguel
    ? 'bg-[#4444FF] hover:bg-[#4444FF]/90 text-white'
    : 'bg-[#FF4444] hover:bg-[#FF4444]/90 text-white'

  let statusBadge = { label: '🟢 Aberta', class: 'bg-green-100 text-green-800 border-green-200' }
  if (demand.status === 'Perdida') {
    statusBadge = { label: '⚫ Perdida', class: 'bg-gray-200 text-gray-800 border-gray-300' }
  } else if (demand.isPrioritized) {
    statusBadge = { label: '🔴 Priorizada', class: 'bg-red-100 text-red-800 border-red-200' }
  }

  let cardBg = 'bg-card'
  if (demand.status === 'Perdida') cardBg = 'bg-gray-50/50 opacity-80'
  else if (demand.isPrioritized) cardBg = 'bg-red-50/30 border-red-200'

  return (
    <>
      <Card
        className={cn(
          'w-full min-h-[120px] rounded-[12px] mb-[12px] border transition-all hover:shadow-md',
          cardBg,
        )}
      >
        <CardContent className="p-[16px] flex flex-col">
          <div className="flex justify-between items-start mb-[8px]">
            <Badge className={cn('font-bold text-[12px] h-[24px] border-transparent', badgeColor)}>
              {badgeLabel}
            </Badge>
            <Badge variant="outline" className={cn('text-[11px] font-medium', statusBadge.class)}>
              {statusBadge.label}
            </Badge>
          </div>

          <div className="flex flex-col gap-[2px]">
            <div className="text-[14px] font-bold leading-[20px]">
              👤 Cliente: {demand.clientName}
            </div>
            <div className="text-[12px] leading-[16px]">📍 Localização: {demand.location}</div>
            <div className="text-[14px] font-bold leading-[20px]">
              💰 Orçamento: R$ {formatPrice(demand.minBudget)} - R$ {formatPrice(demand.maxBudget)}
            </div>
            <div className="text-[12px] leading-[16px]">
              🏠 Perfil: {demand.bedrooms || 0} dorm, {demand.bathrooms || 0} banh,{' '}
              {demand.parkingSpots || 0} vagas
            </div>

            <div className="mt-[8px] flex flex-col gap-[4px]">
              <Badge
                variant="outline"
                className={cn(
                  'w-fit text-[11px]',
                  totalClients >= 2
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-muted/50 text-muted-foreground',
                )}
              >
                👥 {totalClients} cliente{totalClients !== 1 ? 's' : ''} com este perfil
              </Badge>
              <div className="text-[11px] leading-[16px] text-muted-foreground mt-[4px]">
                📅 Criado em: {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-[8px] mt-[16px]">
            <Button
              className="h-[44px] md:h-[40px] flex-1 text-[14px] leading-[20px] bg-primary/10 text-primary hover:bg-primary/20 min-w-0 w-full"
              variant="outline"
              onClick={() => setShowDetails(true)}
            >
              📖 Ver Detalhes
            </Button>
            {demand.status !== 'Perdida' && (
              <>
                <Button
                  className="h-[44px] md:h-[40px] flex-1 text-[14px] leading-[20px] text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 min-w-0 w-full"
                  variant="outline"
                  disabled={!canPrioritize || demand.isPrioritized}
                  onClick={() => setShowPrioritize(true)}
                >
                  🔴 PRIORIZAR
                </Button>
                <Button
                  className="h-[44px] md:h-[40px] flex-1 text-[14px] leading-[20px] text-gray-600 hover:text-gray-700 hover:bg-gray-100 border-gray-200 min-w-0 w-full"
                  variant="outline"
                  onClick={() => setShowLost(true)}
                >
                  ❌ PERDIDO
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <DemandDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        demand={demand}
        onPrioritize={
          demand.status !== 'Perdida' && !demand.isPrioritized
            ? () => setShowPrioritize(true)
            : undefined
        }
        onLost={demand.status !== 'Perdida' ? () => setShowLost(true) : undefined}
      />

      <PrioritizeModal
        open={showPrioritize}
        onOpenChange={setShowPrioritize}
        onConfirm={handlePrioritize}
        similarCount={totalClients}
      />

      <LostModal open={showLost} onOpenChange={setShowLost} onConfirm={handleLost} />
    </>
  )
}
