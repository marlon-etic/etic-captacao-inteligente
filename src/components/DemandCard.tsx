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
import { BookOpen, AlertCircle, X, Clock } from 'lucide-react'
import { useSlaCountdown } from '@/hooks/useTimeElapsed'
import { Progress } from '@/components/ui/progress'

interface DemandCardProps {
  demand: Demand
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

export function DemandCard({ demand, isNewDemand, showActions, onAction }: DemandCardProps) {
  const { currentUser, getSimilarDemands, prioritizeDemand, markDemandLost } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
  const [showPrioritize, setShowPrioritize] = useState(false)
  const [showLost, setShowLost] = useState(false)

  const similar = getSimilarDemands(demand.id)
  const totalClients = similar.length + 1
  const canPrioritize = totalClients >= 2

  const handlePrioritize = (reason: string) => {
    prioritizeDemand(demand.id, reason, totalClients)
  }

  const handleLost = (reason: string, obs: string) => {
    markDemandLost(demand.id, reason, obs)
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const isAluguel = demand.type === 'Aluguel'
  const typeColor = isAluguel ? 'bg-[#4444FF]' : 'bg-[#FF4444]'

  let statusBadge = { label: '🟢 Aberta', class: 'text-[#00AA00] bg-[#00AA00]/10 border-none' }
  if (demand.status === 'Perdida') {
    statusBadge = { label: '⚫ Perdida', class: 'text-[#333333] bg-[#E5E5E5] border-none' }
  } else if (demand.isPrioritized) {
    statusBadge = { label: '🔴 Priorizada', class: 'text-[#FF4444] bg-[#FF4444]/10 border-none' }
  }

  const {
    text: slaText,
    progress: slaProgress,
    level: slaLevel,
  } = useSlaCountdown(
    demand.createdAt,
    demand.isExtension48h,
    demand.extensionRequestedAt,
    demand.status,
  )

  const showCountdown = isNewDemand && demand.status === 'Pendente' && !demand.isExtension48h

  return (
    <>
      <Card
        className={cn(
          'w-full min-h-[140px] md:min-h-[160px] lg:min-h-[180px] rounded-[12px] border border-[#E5E5E5] transition-all duration-200 hover:bg-black/[0.02] hover:shadow-md flex flex-col overflow-hidden',
          demand.status === 'Perdida' ? 'opacity-70 bg-[#F9F9F9]' : 'bg-[#FFFFFF]',
        )}
      >
        {showCountdown && (
          <div className="bg-[#00AA00]/10 px-4 py-3 border-b border-[#00AA00]/20 flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Badge className="bg-[#00AA00] text-white font-bold text-[12px] md:text-[13px] lg:text-[14px] hover:bg-[#00AA00]">
                🆕 NOVA
              </Badge>
              <span className="text-[#00AA00] font-bold text-[12px] md:text-[13px] lg:text-[14px] flex items-center gap-1.5 leading-[16px] md:leading-[18px] lg:leading-[20px]">
                <Clock className="w-4 h-4" /> {slaText}
              </span>
            </div>
            <Progress
              value={slaProgress}
              className="h-1.5 md:h-2 bg-[#00AA00]/20"
              indicatorClassName={
                slaLevel === 'red'
                  ? 'bg-[#FF4444]'
                  : slaLevel === 'yellow'
                    ? 'bg-[#FFD700]'
                    : 'bg-[#00AA00]'
              }
            />
          </div>
        )}

        <CardContent className="p-4 md:p-4 lg:p-5 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <Badge
              className={cn(
                'font-bold text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-white px-2.5 py-1',
                typeColor,
              )}
            >
              {isAluguel ? '🏠 ALUGUEL' : '🏢 VENDA'}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                'text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold px-2.5 py-1',
                statusBadge.class,
              )}
            >
              {statusBadge.label}
            </Badge>
          </div>

          <div className="flex flex-col gap-1 flex-grow">
            <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold text-[#333333] leading-[24px] md:leading-[28px] lg:leading-[30px]">
              👤 Cliente: {demand.clientName}
            </h3>
            <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#999999] leading-[16px] md:leading-[18px] lg:leading-[20px]">
              📍 Localização: <span className="text-[#333333]">{demand.location}</span>
            </p>
            <p className="text-[14px] md:text-[16px] lg:text-[18px] font-bold text-[#333333] mt-1 leading-[20px] md:leading-[24px] lg:leading-[28px]">
              💰 Orçamento: R$ {formatPrice(demand.minBudget)} - R$ {formatPrice(demand.maxBudget)}
            </p>
            <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#333333] mt-0.5 leading-[16px] md:leading-[18px] lg:leading-[20px]">
              🏠 Perfil: {demand.bedrooms || 0} dorm, {demand.bathrooms || 0} banh,{' '}
              {demand.parkingSpots || 0} vagas
            </p>

            {similar.length > 0 && (
              <div className="mt-2 bg-[#00AA00]/10 text-[#00AA00] font-bold text-[12px] md:text-[13px] lg:text-[14px] p-2 rounded-md w-fit border border-[#00AA00]/20 leading-[16px] md:leading-[18px] lg:leading-[20px]">
                👥 {totalClients} clientes com este perfil
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 mt-auto pt-4 w-full">
            <Button
              className="w-full xl:w-auto flex-1 h-[48px] md:h-[44px] lg:h-[40px] min-w-[48px] bg-[#4444FF] hover:bg-[#4444FF]/90 text-white text-[14px] font-bold px-2 leading-[20px]"
              onClick={() => setShowDetails(true)}
            >
              <BookOpen className="w-4 h-4 mr-1.5" />
              <span>Detalhes</span>
            </Button>
            <Button
              className={cn(
                'w-[calc(50%-4px)] xl:w-auto flex-1 h-[48px] md:h-[44px] lg:h-[40px] min-w-[48px] text-[14px] font-bold px-2 leading-[20px]',
                canPrioritize && !demand.isPrioritized
                  ? 'bg-[#FF4444] hover:bg-[#FF4444]/90 text-white'
                  : 'bg-[#E5E5E5] text-[#999999] cursor-not-allowed',
              )}
              disabled={!canPrioritize || demand.isPrioritized}
              onClick={() => setShowPrioritize(true)}
            >
              <AlertCircle className="w-4 h-4 mr-1.5 xl:hidden" />
              <span className="hidden xl:inline">Priorizar</span>
              <span className="xl:hidden">Prio.</span>
            </Button>
            <Button
              className="w-[calc(50%-4px)] xl:w-auto flex-1 h-[48px] md:h-[44px] lg:h-[40px] min-w-[48px] bg-[#999999] hover:bg-[#333333] text-white text-[14px] font-bold px-2 leading-[20px]"
              onClick={() => setShowLost(true)}
            >
              <X className="w-4 h-4 mr-1.5 xl:hidden" />
              <span className="hidden xl:inline">Perdido</span>
              <span className="xl:hidden">Perd.</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <DemandDetailsModal open={showDetails} onOpenChange={setShowDetails} demand={demand} />
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
