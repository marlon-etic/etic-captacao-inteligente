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
import { ContactSolicitorAction } from '@/components/ContactSolicitorAction'
import { CheckCircle2, XCircle } from 'lucide-react'

interface DemandCardProps {
  demand: Demand
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

export function DemandCard({ demand, isNewDemand, showActions, onAction }: DemandCardProps) {
  const { currentUser, users, getSimilarDemands, prioritizeDemand, markDemandLost } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
  const [showPrioritize, setShowPrioritize] = useState(false)
  const [showLost, setShowLost] = useState(false)

  const similar = getSimilarDemands(demand.id)
  const totalClients = similar.length + 1
  const isHighUrgency = demand.timeframe === 'Urgente' || demand.timeframe === 'Até 15 dias'
  const canPrioritize = totalClients >= 2 || isHighUrgency

  const isCreator =
    currentUser?.id === demand.createdBy ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor'

  const isCaptador = currentUser?.role === 'captador'

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
  } else if (demand.status !== 'Pendente') {
    statusBadge = {
      label: `🔵 ${demand.status}`,
      class: 'bg-blue-100 text-blue-800 border-blue-200',
    }
  }

  let cardBg = 'bg-card'
  if (demand.status === 'Perdida') cardBg = 'bg-gray-50 opacity-80'
  else if (demand.isPrioritized) cardBg = 'bg-red-50/50 border-red-200'

  return (
    <>
      <Card
        className={cn(
          'w-full min-h-[120px] rounded-[12px] mb-[12px] border transition-all hover:shadow-md flex flex-col',
          cardBg,
        )}
      >
        <CardContent className="p-[16px] flex flex-col flex-1">
          <div className="flex justify-between items-start mb-[8px]">
            <Badge className={cn('font-bold text-[12px] h-[24px] border-transparent', badgeColor)}>
              {badgeLabel}
            </Badge>
            <div className="flex gap-2">
              {isNewDemand && (
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200 font-bold text-[11px]">
                  ✨ NOVA
                </Badge>
              )}
              <Badge variant="outline" className={cn('text-[11px] font-medium', statusBadge.class)}>
                {statusBadge.label}
              </Badge>
            </div>
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

          <div className="flex flex-col mt-auto pt-[16px] gap-[8px]">
            {showActions && onAction && (
              <div className="flex gap-2 mb-2">
                <Button
                  className="h-[40px] flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[13px] px-2"
                  onClick={() => onAction(demand.id, 'encontrei')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" /> Encontrei Imóvel
                </Button>
                <Button
                  variant="outline"
                  className="h-[40px] flex-1 text-destructive hover:bg-destructive/10 text-[13px] px-2 border-destructive/20"
                  onClick={() => onAction(demand.id, 'nao_encontrei')}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Não Encontrei
                </Button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-[8px]">
              <Button
                className="h-[44px] md:h-[40px] flex-1 text-[14px] leading-[20px] bg-primary/10 text-primary hover:bg-primary/20 min-w-0 w-full"
                variant="outline"
                onClick={() => setShowDetails(true)}
              >
                📖 Ver Detalhes
              </Button>
              {demand.status !== 'Perdida' && isCreator && (
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

            {isCaptador && demand.status !== 'Perdida' && (
              <ContactSolicitorAction
                demand={demand}
                solicitor={users.find((u) => u.id === demand.createdBy)}
                className="w-full mt-[4px]"
                buttonClassName="w-full h-[44px] md:h-[40px] text-[14px] bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-semibold"
                buttonText="💬 CONTATAR SOLICITANTE"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <DemandDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        demand={demand}
        onPrioritize={
          demand.status !== 'Perdida' && !demand.isPrioritized && isCreator
            ? () => setShowPrioritize(true)
            : undefined
        }
        onLost={demand.status !== 'Perdida' && isCreator ? () => setShowLost(true) : undefined}
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
