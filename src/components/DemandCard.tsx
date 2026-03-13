import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { useTimeElapsed } from '@/hooks/useTimeElapsed'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
import { ContactSolicitorAction } from '@/components/ContactSolicitorAction'

export function DemandCard({
  demand,
  onAction,
}: {
  demand: Demand
  onAction?: (id: string, a: 'encontrei' | 'nao_encontrei') => void
}) {
  const { users } = useAppStore()
  const solicitor = users.find((u) => u.id === demand.createdBy)
  const [showDetails, setShowDetails] = useState(false)
  const { text } = useTimeElapsed(demand.createdAt)

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 0,
    }).format(val)
  }

  const isAluguel = demand.type === 'Aluguel'
  const badgeLabel = isAluguel ? '🏠 ALUGUEL' : '🏢 VENDA'
  const badgeColor = isAluguel
    ? 'bg-[#4444FF] hover:bg-[#4444FF]/90'
    : 'bg-[#FF4444] hover:bg-[#FF4444]/90'

  return (
    <>
      <Card className="w-full min-h-[120px] rounded-[12px] mb-[12px] border transition-all hover:shadow-md">
        <CardContent className="p-[16px] flex flex-col">
          <div className="flex mb-[8px]">
            <Badge
              className={cn(
                'text-white font-bold text-[12px] h-[24px] border-transparent',
                badgeColor,
              )}
            >
              {badgeLabel}
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
            <div className="text-[11px] leading-[16px] text-muted-foreground mt-[2px]">
              ⏰ Criado há: {text}
            </div>
          </div>

          <div className="flex flex-row items-center gap-[8px] mt-[16px]">
            <Button
              className="h-[44px] flex-1 text-[14px] leading-[20px] bg-primary/10 text-primary hover:bg-primary/20 min-w-0"
              variant="outline"
              onClick={() => setShowDetails(true)}
            >
              📖 Ver Detalhes
            </Button>
            <ContactSolicitorAction
              demand={demand}
              solicitor={solicitor}
              className="flex-1 min-w-0"
              buttonClassName="h-[44px] w-full text-[14px] leading-[20px]"
              buttonText="💬 Contatar"
            />
          </div>
        </CardContent>
      </Card>

      <DemandDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        demand={demand}
        onAction={
          onAction
            ? (act) => {
                setShowDetails(false)
                onAction(demand.id, act)
              }
            : undefined
        }
      />
    </>
  )
}
