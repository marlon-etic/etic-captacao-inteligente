import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
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
  <div className="flex flex-col gap-1">
    <span className="text-[12px] min-[480px]:text-[13px] md:text-[14px] text-[#999999] leading-tight font-medium">
      {label}
    </span>
    <span className="text-[13px] min-[480px]:text-[14px] md:text-[15px] font-bold text-[#333333] break-words whitespace-normal leading-tight">
      {value}
    </span>
  </div>
)

export function DemandCard({ demand, index, onAction }: DemandCardProps) {
  const { users, logSolicitorContactAttempt } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
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

  let cardBg = 'bg-[#FFFFFF]'
  if (isLost) cardBg = 'bg-gray-100'
  else if (isPrioritized) cardBg = 'bg-red-50'
  else if (isNew) cardBg = 'bg-green-50'

  let statusBadge = null
  if (isLost) {
    statusBadge = (
      <Badge className="bg-gray-200 text-gray-800 border-none font-bold text-[12px] min-h-[24px]">
        ⚫ PERDIDA
      </Badge>
    )
  } else if (isPrioritized) {
    statusBadge = (
      <Badge
        className={cn(
          'bg-red-100 text-red-800 border-none font-bold text-[12px] min-h-[24px]',
          isJustPrioritized && 'animate-bounce-scale',
        )}
      >
        🔴 PRIORIZADA
      </Badge>
    )
  } else if (isNew) {
    statusBadge = (
      <Badge className="bg-green-100 text-green-800 border-none font-bold text-[12px] min-h-[24px]">
        🆕 NOVA - Responda em 24h
      </Badge>
    )
  } else {
    statusBadge = (
      <Badge
        className={cn(
          'border-none text-[12px] font-bold min-h-[24px]',
          isPending ? 'bg-[#ffedd5] text-[#9a3412]' : 'bg-gray-100 text-gray-800',
        )}
      >
        {isPending ? slaBadgeText || '⏳ Pendente' : demand.status}
      </Badge>
    )
  }

  const btnSolid = isSale
    ? 'bg-[#FF4444] hover:bg-[#e03e3e] text-white'
    : 'bg-[#4444FF] hover:bg-[#3b3be0] text-white'
  const btnSoft = isSale ? 'bg-[#ffe5e5] text-[#FF4444]' : 'bg-[#e5e5ff] text-[#4444FF]'
  const btnOutline = isSale
    ? 'border border-[#FF4444] text-[#FF4444] bg-transparent'
    : 'border border-[#4444FF] text-[#4444FF] bg-transparent'
  const btnGhost = isSale ? 'bg-transparent text-[#FF4444]' : 'bg-transparent text-[#4444FF]'

  let indicatorColor = 'bg-[#00AA00]'
  if (slaLevel === 'yellow') indicatorColor = 'bg-[#FF9900]'
  else if (slaLevel === 'red') indicatorColor = 'bg-[#FF4444]'
  else if (slaLevel === 'orange') indicatorColor = 'bg-[#FF8C00]'

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full relative h-full flex"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <Card
        className={cn(
          'w-full h-full p-[16px] flex flex-col rounded-[12px] transition-all duration-150 ease-in-out hover:brightness-95 hover:shadow-lg relative overflow-hidden',
          cardBg,
          isJustPrioritized && 'animate-glow-pulse',
          isJustLost && 'animate-fade-out opacity-0',
          'border border-gray-200 border-l-[3px]',
          isSale ? 'border-l-[#FF4444]' : 'border-l-[#4444FF]',
          'min-h-[auto] min-[480px]:min-h-[200px] md:min-h-[220px] min-[1440px]:min-h-[240px]',
        )}
      >
        {isJustLost && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gray-400 absolute animate-confetti-burst"
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

        {/* Section 1: Type & Status Badges */}
        <div className="flex justify-between items-start mb-4 gap-2 z-0 relative">
          <div
            className={cn(
              'flex items-center justify-start px-1 gap-0.5 rounded shadow-sm shrink-0 overflow-hidden',
              isSale ? 'bg-[#FF4444]' : 'bg-[#4444FF]',
            )}
            style={{ width: '80px', height: '32px' }}
          >
            {isSale ? (
              <Building2 className="w-[24px] h-[24px] text-white shrink-0" />
            ) : (
              <Home className="w-[24px] h-[24px] text-white shrink-0" />
            )}
            <span className="text-[12px] font-bold text-white leading-none tracking-tighter whitespace-normal break-words">
              {isSale ? 'VENDA' : 'ALUGUEL'}
            </span>
          </div>

          <div className="flex items-center justify-end flex-wrap gap-2">
            {!isLost && !isPrioritized && !isNew && isPending && (
              <Badge className="bg-[#dcfce7] text-[#166534] hover:bg-[#dcfce7] border-none text-[12px] font-bold whitespace-normal break-words text-center min-h-[24px]">
                🟢 Ativa
              </Badge>
            )}
            {statusBadge}
          </div>
        </div>

        {/* Section 2: Title & Countdown */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4 z-0 relative">
          <h3 className="text-[16px] min-[480px]:text-[18px] md:text-[20px] font-bold text-[#333333] break-words whitespace-normal leading-tight m-0 pr-2">
            {demand.clientName}
          </h3>
          {isPending && !isLost && (
            <span
              className={cn(
                'text-[16px] font-bold whitespace-normal mt-2 sm:mt-0 break-words transition-colors duration-200',
                slaLevel === 'red'
                  ? 'text-[#FF4444]'
                  : slaLevel === 'yellow'
                    ? 'text-[#FF9900]'
                    : 'text-[#00AA00]',
              )}
            >
              {slaText} restantes
            </span>
          )}
        </div>

        {/* Section 3: Progress Bar */}
        {isPending && !isLost && (
          <div className="pb-4 z-0 relative">
            <Progress
              value={slaProgress}
              className="h-2 bg-gray-200"
              indicatorClassName={indicatorColor}
            />
          </div>
        )}

        {/* Section 4: Primary Information Grid */}
        <div
          className={cn(
            'grid grid-cols-1 min-[480px]:grid-cols-2 gap-[12px] py-4 border-t flex-1 z-0 relative',
            isLost ? 'border-gray-300' : 'border-gray-100',
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

        {/* Section 5: Action Buttons Command Center */}
        <div
          className={cn(
            'flex flex-col min-[480px]:flex-row flex-wrap gap-2 pt-4 mt-auto border-t shrink-0 z-0 relative',
            isLost ? 'border-gray-300 opacity-70 grayscale' : 'border-gray-100',
          )}
        >
          <Button
            className={cn(
              'h-auto min-h-[44px] py-2 w-full min-[480px]:flex-1 font-bold whitespace-normal break-words',
              btnSoft,
            )}
            onClick={() => setShowDetails(true)}
          >
            Ver Detalhes
          </Button>
          <Button
            className={cn(
              'h-auto min-h-[44px] py-2 w-full min-[480px]:flex-1 font-bold whitespace-normal break-words',
              btnSolid,
            )}
            onClick={() => onAction?.(demand.id, 'encontrei')}
            disabled={isLost}
          >
            Encontrei
          </Button>
          <Button
            className={cn(
              'h-auto min-h-[44px] py-2 w-full min-[480px]:flex-1 font-bold whitespace-normal break-words',
              btnOutline,
            )}
            onClick={() => onAction?.(demand.id, 'nao_encontrei')}
            disabled={isLost}
          >
            Não Encontrei
          </Button>
          <Button
            className={cn(
              'h-auto min-h-[44px] py-2 w-full min-[480px]:flex-1 font-bold whitespace-normal break-words',
              btnGhost,
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
    </div>
  )
}
