import { useState } from 'react'
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
    <span className="text-[12px] text-[#999999] leading-tight font-medium">{label}</span>
    <span className="text-[14px] font-bold text-[#333333] break-words whitespace-normal leading-tight">
      {value}
    </span>
  </div>
)

export function DemandCard({ demand, index, onAction }: DemandCardProps) {
  const { users, logSolicitorContactAttempt } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)

  const creator = users.find((u) => u.id === demand.createdBy)
  const creatorName = creator?.name || 'Desconhecido'

  const { text: timeElapsedText, hoursElapsed } = useTimeElapsed(demand.createdAt)
  const {
    text: slaText,
    progress: slaProgress,
    badgeText,
  } = useSlaCountdown(
    demand.createdAt,
    demand.isExtension48h,
    demand.extensionRequestedAt,
    demand.status,
  )

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const isPending = demand.status === 'Pendente'
  const isSale = demand.type === 'Venda'

  const btnSolid = isSale
    ? 'bg-[#FF4444] hover:bg-[#e03e3e] text-white'
    : 'bg-[#4444FF] hover:bg-[#3b3be0] text-white'
  const btnSoft = isSale
    ? 'bg-[#ffe5e5] hover:bg-[#fcd5d5] text-[#FF4444]'
    : 'bg-[#e5e5ff] hover:bg-[#d5d5fc] text-[#4444FF]'
  const btnOutline = isSale
    ? 'border border-[#FF4444] text-[#FF4444] bg-transparent hover:bg-[#fff0f0]'
    : 'border border-[#4444FF] text-[#4444FF] bg-transparent hover:bg-[#f0f0ff]'
  const btnGhost = isSale
    ? 'bg-transparent text-[#FF4444] hover:bg-[#fff0f0]'
    : 'bg-transparent text-[#4444FF] hover:bg-[#f0f0ff]'

  let indicatorColor = 'bg-[#999999]'
  if (isSale) {
    if (hoursElapsed < 12) indicatorColor = 'bg-[#FF4444]'
    else if (hoursElapsed < 24) indicatorColor = 'bg-[#FF9900]'
  } else {
    if (hoursElapsed < 12) indicatorColor = 'bg-[#4444FF]'
    else if (hoursElapsed < 24) indicatorColor = 'bg-[#00CCCC]'
  }

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full relative"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <Card
        className={cn(
          'w-full bg-[#FFFFFF] p-4 flex flex-col rounded-[12px] transition-shadow hover:shadow-lg',
          'border border-gray-200 border-l-[3px]',
          isSale ? 'border-l-[#FF4444]' : 'border-l-[#4444FF]',
          'min-[768px]:min-w-[400px] min-[768px]:min-h-[200px]',
          'min-[480px]:max-[767px]:min-w-[350px] min-[480px]:max-[767px]:min-h-[180px]',
        )}
      >
        {/* Section 1: Type & Status Badges */}
        <div className="flex justify-between items-start mb-4 gap-2">
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
            <span className="text-[12px] font-bold text-white leading-none tracking-tighter truncate">
              {isSale ? 'VENDA' : 'ALUGUEL'}
            </span>
          </div>

          <div className="flex items-center justify-end flex-wrap gap-2">
            <Badge className="bg-[#dcfce7] text-[#166534] hover:bg-[#dcfce7] border-none text-[12px] font-bold whitespace-normal text-center min-h-[24px]">
              {isPending && badgeText ? badgeText : '🟢 Ativa'}
            </Badge>
            <Badge
              className={cn(
                'border-none text-[12px] font-bold min-h-[24px]',
                isPending
                  ? 'bg-[#ffedd5] text-[#9a3412] hover:bg-[#ffedd5]'
                  : 'bg-gray-100 text-gray-800',
              )}
            >
              {isPending ? '⏳ Pendente' : demand.status}
            </Badge>
          </div>
        </div>

        {/* Section 2: Title & Countdown */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4">
          <h3 className="text-[18px] font-bold text-[#333333] break-words whitespace-normal leading-tight m-0 pr-2">
            {demand.clientName}
          </h3>
          {isPending && (
            <span
              className={cn(
                'text-[16px] font-bold whitespace-nowrap mt-2 sm:mt-0',
                isSale ? 'text-[#FF4444]' : 'text-[#4444FF]',
              )}
            >
              {slaText} restantes
            </span>
          )}
        </div>

        {/* Section 3: Progress Bar */}
        {isPending && (
          <div className="pb-4">
            <Progress
              value={slaProgress}
              className="h-2 bg-gray-100"
              indicatorClassName={cn('transition-colors duration-300', indicatorColor)}
            />
          </div>
        )}

        {/* Section 4: Primary Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[12px] py-4 border-t border-gray-100">
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
        <div className="flex flex-col min-[480px]:flex-row flex-wrap gap-2 pt-4 mt-auto border-t border-gray-100">
          <Button
            className={cn(
              'h-[44px] min-[480px]:min-w-[100px] flex-1 font-bold transition-transform active:scale-95 duration-100',
              btnSoft,
            )}
            onClick={() => setShowDetails(true)}
          >
            Ver Detalhes
          </Button>
          <Button
            className={cn(
              'h-[44px] min-[480px]:min-w-[100px] flex-1 font-bold transition-transform active:scale-95 duration-100',
              btnSolid,
            )}
            onClick={() => onAction?.(demand.id, 'encontrei')}
          >
            Encontrei
          </Button>
          <Button
            className={cn(
              'h-[44px] min-[480px]:min-w-[100px] flex-1 font-bold transition-transform active:scale-95 duration-100',
              btnOutline,
            )}
            onClick={() => onAction?.(demand.id, 'nao_encontrei')}
          >
            Não Encontrei
          </Button>
          <Button
            className={cn(
              'h-[44px] min-[480px]:min-w-[100px] flex-1 font-bold transition-transform active:scale-95 duration-100',
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
