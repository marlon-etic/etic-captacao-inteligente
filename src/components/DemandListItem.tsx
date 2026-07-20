import { memo } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Star, MapPin, Clock, DollarSign, Zap, Eye, Home } from 'lucide-react'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { cn } from '@/lib/utils'
import { useTimeElapsed } from '@/hooks/useTimeElapsed'
import { useMatchCount } from '@/hooks/use-match-count'
import { isDemandGloballyLost } from '@/lib/demand-status'

const GRID_COLS = 'grid-cols-[1.5fr_1fr_1.5fr_1fr_auto_auto]'

function DemandListItemComponent({
  demand,
  onClick,
}: {
  demand: SupabaseDemand
  onClick: () => void
}) {
  const { text: timeElapsedText } = useTimeElapsed(demand.created_at)
  const { count: matchCount } = useMatchCount('demanda', demand.id || '')

  const isPrioritized = demand.is_prioritaria
  const isLost = isDemandGloballyLost(demand.status_demanda)
  const capturedCount = demand.imoveis_captados?.length || 0

  const formatPrice = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)

  const bairrosText = demand.bairros?.join(', ') || 'Sem localização'

  return (
    <Card
      className={cn(
        'w-full p-3 sm:p-4 cursor-pointer transition-all duration-200 hover:shadow-md border rounded-[12px] group',
        isPrioritized
          ? 'bg-[#FFFBEB] border-[#FCD34D]'
          : isLost
            ? 'bg-[#F5F5F5] opacity-80 border-[#E5E5E5]'
            : 'bg-white border-[#E5E5E5] hover:border-[#3B82F6]/40',
      )}
      onClick={onClick}
    >
      {/* Mobile layout */}
      <div className="flex items-center gap-3 sm:hidden">
        {isPrioritized && <Star className="w-4 h-4 text-[#F44336] fill-current shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[14px] font-black text-[#1A3A52] truncate">
              {demand.nome_cliente}
            </span>
            <Badge className="text-[9px] font-bold px-1.5 py-0.5 border-none bg-[#1A3A52] text-white">
              {demand.tipo === 'Venda' ? 'VENDA' : 'ALUGUEL'}
            </Badge>
            <span className="text-[10px] text-[#999999] font-medium truncate">
              · {demand.tipo_imovel || 'N/A'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[12px] text-[#666666] flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <MapPin className="w-3 h-3 text-pink-500 shrink-0" />
              <span className="truncate max-w-[120px]">{bairrosText}</span>
            </span>
            <span className="font-bold text-[#10B981]">{formatPrice(demand.valor_maximo)}</span>
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {timeElapsedText}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          {matchCount > 0 && !isLost && (
            <Badge className="bg-[#3B82F6] text-white border-none font-bold text-[10px] px-2 py-0.5 flex items-center gap-1 animate-pulse">
              <Zap className="w-2.5 h-2.5 fill-current" /> {matchCount}
            </Badge>
          )}
          {isPrioritized && (
            <Badge className="bg-[#F44336] text-white border-none font-black text-[9px] px-1.5 py-0.5">
              PRIORITÁRIA
            </Badge>
          )}
          <Eye className="w-4 h-4 text-[#999999] group-hover:text-[#3B82F6] transition-colors" />
        </div>
      </div>

      {/* Desktop layout - grid columns */}
      <div className={cn('hidden sm:grid gap-3 items-center', GRID_COLS)}>
        <div className="flex items-center gap-2 min-w-0">
          {isPrioritized && <Star className="w-4 h-4 text-[#F44336] fill-current shrink-0" />}
          <span className="text-[14px] font-black text-[#1A3A52] truncate">
            {demand.nome_cliente}
          </span>
          <Badge className="text-[9px] font-bold px-1.5 py-0.5 border-none shrink-0 bg-[#1A3A52] text-white">
            {demand.tipo === 'Venda' ? 'VENDA' : 'ALUGUEL'}
          </Badge>
          <span className="text-[11px] text-[#666666] font-medium truncate">
            · {demand.tipo_imovel || 'N/A'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
          <span className="text-[13px] font-bold text-[#10B981]">
            {formatPrice(demand.valor_maximo)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 min-w-0">
          <MapPin className="w-3.5 h-3.5 text-pink-500 shrink-0" />
          <span className="text-[12px] text-[#666666] font-medium truncate" title={bairrosText}>
            {bairrosText}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-[#999999] shrink-0" />
          <span className="text-[12px] text-[#666666] font-medium">{timeElapsedText}</span>
        </div>

        <div className="flex items-center gap-1.5 justify-center">
          {matchCount > 0 && !isLost && (
            <Badge className="bg-[#3B82F6] text-white border-none font-bold text-[10px] px-2 py-1 flex items-center gap-1 animate-pulse">
              <Zap className="w-3 h-3 fill-current" /> {matchCount}
            </Badge>
          )}
          {capturedCount > 0 && (
            <Badge className="bg-[#10B981] text-white border-none font-bold text-[10px] px-2 py-1 flex items-center gap-1">
              <Home className="w-3 h-3" /> {capturedCount}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 justify-end">
          {isPrioritized && (
            <Badge className="bg-[#F44336] text-white border-none font-black text-[9px] px-2 py-1 flex items-center gap-1">
              <Star className="w-2.5 h-2.5 fill-current" /> PRIORITÁRIA
            </Badge>
          )}
          <Eye className="w-4 h-4 text-[#999999] group-hover:text-[#3B82F6] transition-colors" />
        </div>
      </div>
    </Card>
  )
}

export const DemandListItem = memo(DemandListItemComponent, (prev, next) => {
  return (
    prev.demand?.id === next.demand?.id &&
    prev.demand?.updated_at === next.demand?.updated_at &&
    prev.demand?.status_demanda === next.demand?.status_demanda &&
    prev.demand?.is_prioritaria === next.demand?.is_prioritaria
  )
})
