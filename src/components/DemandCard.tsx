import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
import { LostModal } from '@/components/LostModal'
import { useSlaCountdown, useTimeElapsed } from '@/hooks/useTimeElapsed'
import { Building2, Home } from 'lucide-react'

interface DemandCardProps {
  demand: Demand
  index?: number
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-[4px]">
    <span className="text-[12px] text-[#333333] leading-tight font-medium">{label}</span>
    <span className="text-[16px] font-bold text-[#1A3A52] break-words whitespace-normal leading-tight">
      {value}
    </span>
  </div>
)

export function DemandCard({ demand, index, onAction }: DemandCardProps) {
  const { users, logSolicitorContactAttempt, markDemandLost, currentUser } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const prevStatus = useRef(demand.status)
  const [isJustLost, setIsJustLost] = useState(false)
  const [isJustPrioritized, setIsJustPrioritized] = useState(false)

  const creator = users.find((u) => u.id === demand.createdBy)
  const creatorName = creator?.name || 'Desconhecido'

  const { text: timeElapsedText, hoursElapsed } = useTimeElapsed(demand.createdAt)
  const {
    text: slaText,
    progress: slaProgress,
    badgeText: slaBadgeText,
    level: slaLevel,
  } = useSlaCountdown(
    demand.createdAt,
    demand.isExtension48h,
    demand.extensionRequestedAt,
    demand.status,
  )

  useEffect(() => {
    if (prevStatus.current !== 'Perdida' && demand.status === 'Perdida') {
      setIsJustLost(true)
      const t = setTimeout(() => setIsJustLost(false), 700)
      return () => clearTimeout(t)
    }
    if (demand.isPrioritized && !isJustPrioritized) {
      setIsJustPrioritized(true)
      const t = setTimeout(() => setIsJustPrioritized(false), 400)
      return () => clearTimeout(t)
    }
    prevStatus.current = demand.status
  }, [demand.status, demand.isPrioritized])

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const isPending = demand.status === 'Pendente'
  const isSale = demand.type === 'Venda'
  const isLost = demand.status === 'Perdida'
  const isPrioritized = demand.isPrioritized && !isLost
  const isNew = hoursElapsed <= 24 && isPending && !isLost && !isPrioritized

  const canMarkLost =
    !isLost &&
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'gestor' ||
      (demand.createdBy === currentUser?.id &&
        (currentUser?.role === 'sdr' || currentUser?.role === 'corretor')))

  let cardBg = 'bg-[#FFFFFF]'
  if (isLost) cardBg = 'bg-[#F5F5F5] opacity-80'
  else if (isPrioritized) cardBg = 'bg-[#ffebee]'
  else if (isNew) cardBg = 'bg-[#e8f5e9]'

  let statusBadge = null
  if (isLost) {
    statusBadge = (
      <Badge className="bg-[#999999] text-[#FFFFFF] border-none font-bold text-[12px] min-h-[24px]">
        ⚫ PERDIDA
      </Badge>
    )
  } else if (isPrioritized) {
    statusBadge = (
      <Badge
        className={cn(
          'bg-[#F44336] text-[#FFFFFF] border-none font-bold text-[12px] min-h-[24px]',
          isJustPrioritized && 'animate-bounce-scale',
        )}
      >
        🔴 PRIORIZADA
      </Badge>
    )
  } else if (isNew) {
    statusBadge = (
      <Badge className="bg-[#4CAF50] text-[#FFFFFF] border-none font-bold text-[12px] min-h-[24px]">
        🆕 NOVA - Responda em 24h
      </Badge>
    )
  } else {
    let bgCol = 'bg-[#2E5F8A]'
    let textCol = 'text-[#FFFFFF]'

    if (demand.status === 'Captado sob demanda' || demand.status === 'Em Captação') {
      bgCol = 'bg-[#4CAF50]'
    } else if (demand.status === 'Visita') {
      bgCol = 'bg-[#FF9800]'
    } else if (demand.status === 'Negócio') {
      bgCol = 'bg-[#388E3C]'
    } else if (isPending) {
      if (slaLevel === 'red') bgCol = 'bg-[#F44336]'
      else if (slaLevel === 'yellow') bgCol = 'bg-[#FF9800]'
      else bgCol = 'bg-[#4CAF50]'
    }

    statusBadge = (
      <Badge className={cn('border-none text-[12px] font-bold min-h-[24px]', bgCol, textCol)}>
        {isPending ? slaBadgeText || '⏳ Pendente' : demand.status}
      </Badge>
    )
  }

  const btnSolid = 'bg-[#1A3A52] hover:bg-[#2E5F8A] text-white border-none'
  const btnSoft = 'bg-[#F5F5F5] text-[#333333] hover:bg-[#FFFFFF] border-[2px] border-[#2E5F8A]'
  const btnOutline = 'bg-[#FFFFFF] text-[#333333] hover:bg-[#F5F5F5] border-[2px] border-[#2E5F8A]'

  let indicatorColor = 'bg-[#4CAF50]'
  if (slaLevel === 'yellow') indicatorColor = 'bg-[#FF9800]'
  else if (slaLevel === 'red') indicatorColor = 'bg-[#F44336]'
  else if (slaLevel === 'orange') indicatorColor = 'bg-[#FF9800]'

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full relative h-full flex"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <Card
        className={cn(
          'w-full h-full p-[16px] flex flex-col rounded-[12px] transition-all duration-200 ease-in-out shadow-[0_4px_12px_rgba(26,58,82,0.1)] hover:shadow-[0_8px_24px_rgba(26,58,82,0.15)] relative overflow-hidden',
          cardBg,
          isJustPrioritized && 'animate-glow-pulse',
          isJustLost && 'animate-fade-out opacity-0',
          'border-[2px] border-[#2E5F8A]',
          'min-h-[auto] min-[480px]:min-h-[200px] md:min-h-[220px] min-[1440px]:min-h-[240px]',
        )}
      >
        {isJustLost && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#999999] absolute animate-confetti-burst"
                style={
                  {
                    '--tx': `${(Math.random() - 0.5) * 150}px`,
                    '--ty': `${(Math.random() - 0.5) * 150}px`,
                    animationDelay: `${Math.random() * 50}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-start mb-4 gap-2 z-0 relative">
          <div
            className={cn(
              'flex items-center justify-start px-2 py-1 gap-[4px] rounded-[6px] shadow-[0_2px_4px_rgba(26,58,82,0.1)] shrink-0 overflow-hidden',
              isSale ? 'bg-[#FF9800]' : 'bg-[#1A3A52]',
            )}
            style={{ minWidth: '80px', height: '28px' }}
          >
            {isSale ? (
              <Building2 className="w-[16px] h-[16px] text-white shrink-0" />
            ) : (
              <Home className="w-[16px] h-[16px] text-white shrink-0" />
            )}
            <span className="text-[12px] font-bold text-white leading-none tracking-tight whitespace-normal break-words">
              {isSale ? 'VENDA' : 'ALUGUEL'}
            </span>
          </div>

          <div className="flex items-center justify-end flex-wrap gap-2">
            {!isLost && !isPrioritized && !isNew && isPending && (
              <Badge className="bg-[#4CAF50] text-[#FFFFFF] hover:bg-[#388E3C] border-none text-[12px] font-bold whitespace-normal break-words text-center min-h-[24px]">
                🟢 Ativa
              </Badge>
            )}
            {statusBadge}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4 z-0 relative">
          <h3 className="text-[20px] font-bold text-[#1A3A52] break-words whitespace-normal leading-tight m-0 pr-2">
            {demand.clientName}
          </h3>
          {isPending && !isLost && (
            <span
              className={cn(
                'text-[16px] font-bold whitespace-normal mt-2 sm:mt-0 break-words transition-colors duration-200',
                slaLevel === 'red'
                  ? 'text-[#F44336]'
                  : slaLevel === 'yellow'
                    ? 'text-[#FF9800]'
                    : 'text-[#4CAF50]',
              )}
            >
              {slaText} restantes
            </span>
          )}
        </div>

        {isPending && !isLost && (
          <div className="pb-4 z-0 relative">
            <Progress
              value={slaProgress}
              className="h-[8px] bg-[#F5F5F5] shadow-[inset_0_1px_2px_rgba(26,58,82,0.1)]"
              indicatorClassName={indicatorColor}
            />
          </div>
        )}

        <div
          className={cn(
            'grid grid-cols-1 min-[480px]:grid-cols-2 gap-[16px] py-4 border-t flex-1 z-0 relative',
            isLost ? 'border-[#999999]/30' : 'border-[#2E5F8A]/20',
          )}
        >
          <InfoItem label="👤 Cliente" value={demand.clientName} />
          <InfoItem label="👤 Solicitado por" value={creatorName} />
          <InfoItem label="📍 Localização" value={demand.location} />
          <InfoItem
            label="💰 Orçamento"
            value={`R$ ${formatPrice(demand.minBudget)} - R$ ${formatPrice(demand.maxBudget)}`}
          />
          <InfoItem
            label="🏠 Perfil"
            value={`${demand.bedrooms || 0} dorm, ${demand.bathrooms || 0} banh, ${demand.parkingSpots || 0} vagas`}
          />
          <InfoItem label="⚡ Urgência" value={demand.timeframe} />
          <InfoItem label="📅 Criado há" value={timeElapsedText} />
        </div>

        <div
          className={cn(
            'flex flex-col min-[480px]:flex-row flex-wrap gap-[8px] pt-4 mt-auto border-t shrink-0 z-0 relative',
            isLost ? 'border-[#999999]/30 opacity-80 grayscale' : 'border-[#2E5F8A]/20',
          )}
        >
          <Button
            className={cn(
              'h-auto min-h-[44px] px-[12px] py-[8px] w-full min-[480px]:flex-1 font-bold whitespace-normal break-words text-[14px]',
              btnSoft,
            )}
            onClick={() => setShowDetails(true)}
          >
            Ver Detalhes
          </Button>

          {currentUser?.role === 'captador' && (
            <>
              <Button
                className={cn(
                  'h-auto min-h-[44px] px-[12px] py-[8px] w-full min-[480px]:flex-1 font-bold whitespace-normal break-words text-[14px]',
                  btnSolid,
                )}
                onClick={() => onAction?.(demand.id, 'encontrei')}
                disabled={isLost}
              >
                Encontrei
              </Button>
              <Button
                className={cn(
                  'h-auto min-h-[44px] px-[12px] py-[8px] w-full min-[480px]:flex-1 font-bold whitespace-normal break-words text-[14px]',
                  btnOutline,
                )}
                onClick={() => onAction?.(demand.id, 'nao_encontrei')}
                disabled={isLost}
              >
                Não Encontrei
              </Button>
            </>
          )}

          {canMarkLost && (
            <Button
              variant="destructive"
              className="h-auto min-h-[44px] px-[12px] py-[8px] w-full min-[480px]:flex-1 font-bold whitespace-normal break-words text-[14px]"
              onClick={() => setShowLostModal(true)}
            >
              Marcar Perdida
            </Button>
          )}

          <Button
            className={cn(
              'h-auto min-h-[44px] px-[12px] py-[8px] w-full min-[480px]:flex-1 font-bold whitespace-normal break-words text-[14px]',
              'bg-transparent text-[#1A3A52] hover:bg-[#F5F5F5] border-none shadow-none',
            )}
            onClick={() =>
              logSolicitorContactAttempt(
                demand.id,
                'interno',
                'Olá, gostaria de falar sobre esta demanda.',
              )
            }
          >
            Contato
          </Button>
        </div>
      </Card>

      <DemandDetailsModal open={showDetails} onOpenChange={setShowDetails} demand={demand} />

      <LostModal
        open={showLostModal}
        onOpenChange={setShowLostModal}
        onConfirm={(reason, obs) => markDemandLost(demand.id, reason, obs)}
      />
    </div>
  )
}
