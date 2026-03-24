import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Home,
  MapPin,
  DollarSign,
  BedDouble,
  Car,
  Clock,
  CheckCircle,
  Star,
  Pencil,
  X,
  Maximize2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { PrazoCounter } from './PrazoCounter'
import useAppStore from '@/stores/useAppStore'

interface Props {
  demand: SupabaseDemand
  onAction?: (action: 'details' | 'edit' | 'lost' | 'prioritize', demand: SupabaseDemand) => void
}

export function ExpandableDemandCardSDR({ demand, onAction }: Props) {
  const { currentUser } = useAppStore()

  const isSale = demand.tipo === 'Venda'
  const hasProperties = demand.imoveis_captados && demand.imoveis_captados.length > 0

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const cardAnimation = hasProperties ? 'animate-pulse-green' : ''

  const prazo = demand.prazos_captacao?.[0]
  const isPrazoExpired =
    prazo?.status === 'vencido' ||
    prazo?.status === 'sem_resposta_24h' ||
    prazo?.status === 'sem_resposta_final'

  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor' ||
    demand.sdr_id === currentUser?.id ||
    demand.corretor_id === currentUser?.id

  return (
    <Card
      onClick={(e) => {
        if (import.meta.env.DEV) {
          console.log(`🔘 [Click] ExpandableDemandCardSDR Card Action: details`, { id: demand.id })
        }
        onAction?.('details', demand)
      }}
      className={cn(
        'w-full flex flex-col rounded-[16px] overflow-hidden transition-all duration-500 ease-in-out h-full cursor-pointer group hover:shadow-lg relative z-0',
        hasProperties
          ? 'border-[2px] border-[#4CAF50] bg-[#F2FBF5] shadow-[0_4px_16px_rgba(76,175,80,0.15)]'
          : demand.is_prioritaria
            ? 'border-[2px] border-[#FCD34D] bg-[#FFFBEB] shadow-[0_4px_16px_rgba(252,211,77,0.15)]'
            : 'border-[1px] border-[#E5E5E5] bg-white shadow-sm hover:border-[#1A3A52]/30',
        cardAnimation,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'p-4 border-b flex justify-between items-start shrink-0 transition-colors duration-500 relative',
          hasProperties
            ? 'border-[#4CAF50]/20'
            : demand.is_prioritaria
              ? 'border-[#FCD34D]/50'
              : 'border-[#E5E5E5]',
        )}
      >
        <div className="flex flex-col gap-1 pr-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 border-none',
                isSale ? 'bg-[#FF9800]' : 'bg-[#1A3A52]',
              )}
            >
              {isSale ? 'VENDA' : 'ALUGUEL'}
            </Badge>

            {demand.is_prioritaria && (
              <Badge className="bg-[#FCD34D] text-[#854D0E] hover:bg-[#FCD34D] text-[10px] font-black px-2 py-0.5 flex items-center gap-1 shadow-sm border border-[#F59E0B]">
                <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
              </Badge>
            )}

            <span className="text-[12px] font-bold text-[#666666]">
              {new Date(demand.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <h3
            className="text-[18px] font-black text-[#1A3A52] leading-tight mt-1 line-clamp-2"
            title={demand.nome_cliente}
          >
            {demand.nome_cliente}
          </h3>
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0">
          {/* Quick Actions (Visible on hover desktop, always on mobile) */}
          {isOwnerOrAdmin && (
            <div className="flex items-center gap-0.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-[8px] p-1 border border-[#E5E5E5] shadow-sm z-10 absolute right-4 top-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#666666] hover:text-[#1A3A52] hover:bg-[#F5F5F5] rounded-[6px] relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV)
                    console.log(`🔘 [Click] ExpandableDemandCardSDR Quick Action: details`, {
                      id: demand.id,
                    })
                  onAction?.('details', demand)
                }}
                title="Ver Detalhes"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#666666] hover:text-[#1A3A52] hover:bg-[#F5F5F5] rounded-[6px] relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV)
                    console.log(`🔘 [Click] ExpandableDemandCardSDR Quick Action: edit`, {
                      id: demand.id,
                    })
                  onAction?.('edit', demand)
                }}
                title="Editar Demanda"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#666666] hover:text-amber-500 hover:bg-amber-50 rounded-[6px] relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV)
                    console.log(`🔘 [Click] ExpandableDemandCardSDR Quick Action: prioritize`, {
                      id: demand.id,
                    })
                  onAction?.('prioritize', demand)
                }}
                title={demand.is_prioritaria ? 'Remover Prioridade' : 'Priorizar Demanda'}
              >
                <Star
                  className={cn(
                    'w-4 h-4',
                    demand.is_prioritaria && 'fill-amber-500 text-amber-500',
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#666666] hover:text-red-500 hover:bg-red-50 rounded-[6px] relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV)
                    console.log(`🔘 [Click] ExpandableDemandCardSDR Quick Action: lost`, {
                      id: demand.id,
                    })
                  onAction?.('lost', demand)
                }}
                title="Marcar como Perdido"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="mt-10 lg:mt-0 lg:group-hover:opacity-0 transition-opacity">
            {hasProperties ? (
              <Badge className="bg-[#4CAF50] hover:bg-[#388E3C] text-white border-none font-bold text-[12px] px-2 py-1 flex items-center gap-1 shadow-sm shrink-0 transition-transform hover:scale-105">
                <CheckCircle className="w-3.5 h-3.5" />
                {demand.imoveis_captados.length} IMÓVEL
                {demand.imoveis_captados.length > 1 ? 'S' : ''}
              </Badge>
            ) : demand.status_demanda === 'aberta' ? (
              <div className="flex flex-col items-end">
                {prazo && prazo.status !== 'respondido' && (
                  <PrazoCounter prazoResposta={prazo.prazo_resposta} isExpired={isPrazoExpired} />
                )}
                {prazo && prazo.prorrogacoes_usadas > 0 && prazo.status !== 'respondido' && (
                  <span className="text-[9px] font-bold text-[#666666] mt-0.5">
                    {prazo.prorrogacoes_usadas}/3 Prorrog.
                  </span>
                )}
                {!prazo && (
                  <Badge
                    variant="outline"
                    className="bg-[#F5F5F5] text-[#999999] border-[#E5E5E5] font-bold text-[12px] shrink-0"
                  >
                    Aguardando
                  </Badge>
                )}
              </div>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  'font-bold text-[12px] shrink-0 border-none px-2 py-1',
                  demand.status_demanda === 'sem_resposta_24h' ||
                    demand.status_demanda === 'impossivel'
                    ? 'bg-[#FEF2F2] text-[#EF4444]'
                    : 'bg-[#F5F5F5] text-[#999999]',
                )}
              >
                {demand.status_demanda === 'sem_resposta_24h'
                  ? 'SEM RESPOSTA'
                  : demand.status_demanda === 'impossivel'
                    ? 'PERDIDA'
                    : 'AGUARDANDO'}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-3 flex-1 pointer-events-none">
        <div className="flex items-center gap-2 text-[14px] text-[#333333]">
          <MapPin className="w-4 h-4 text-[#F44336] shrink-0" />
          <span
            className="font-medium line-clamp-1"
            title={demand.bairros?.join(', ') || 'Não especificado'}
          >
            {demand.bairros?.join(', ') || 'Não especificado'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-[18px] font-black text-[#10B981] tracking-tight">
            R$ {formatPrice(demand.valor_minimo)} - R$ {formatPrice(demand.valor_maximo)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[13px] text-[#666666] font-medium bg-white/50 p-2.5 rounded-lg border border-[#E5E5E5]/50 flex-wrap mt-auto">
          <div className="flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-[#999999]" /> {demand.dormitorios || 'Indif.'} dorm
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4 text-[#999999]" /> {demand.vagas_estacionamento || 'Indif.'}{' '}
            vagas
          </div>
          <div className="flex items-center gap-1.5 text-[#FF9800]">
            <Clock className="w-4 h-4" /> {demand.nivel_urgencia}
          </div>
        </div>
      </div>

      {/* Captured Properties List */}
      {hasProperties && (
        <div className="bg-[#4CAF50]/10 p-4 border-t border-[#4CAF50]/20 flex flex-col gap-2 shrink-0 pointer-events-none">
          <h4 className="text-[13px] font-black text-[#2E7D32] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CAF50] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4CAF50]"></span>
            </span>
            Capturas em Tempo Real
          </h4>
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar">
            {demand.imoveis_captados.map((imovel: any, i) => (
              <div
                key={imovel.id || i}
                className="bg-white rounded-lg p-3 shadow-[0_2px_4px_rgba(76,175,80,0.1)] border border-[#4CAF50]/30 flex flex-col gap-1.5 animate-fade-in-up"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-black text-[#1A3A52] text-[14px] truncate">
                    {imovel.codigo_imovel}
                  </span>
                  <span className="text-[12px] font-bold text-[#4CAF50] shrink-0">
                    R$ {formatPrice(imovel.preco || imovel.valor)}
                  </span>
                </div>
                <span className="text-[12px] text-[#666666] line-clamp-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" /> {imovel.endereco}
                </span>
                <div className="text-[11px] text-[#999999] flex justify-between items-center mt-1 pt-1 border-t border-[#F5F5F5]">
                  <span className="truncate pr-2">
                    Captador: <strong className="text-[#333333]">{imovel.captador_nome}</strong>
                  </span>
                  <span className="shrink-0">
                    {new Date(imovel.created_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
