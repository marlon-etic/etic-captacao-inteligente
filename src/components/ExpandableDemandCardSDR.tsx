import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  DollarSign,
  BedDouble,
  Car,
  Clock,
  CheckCircle,
  Star,
  Pencil,
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

  const creationDateStr = demand.created_at
    ? new Date(demand.created_at).toLocaleDateString('pt-BR')
    : 'Data não disponível'

  return (
    <Card
      onClick={(e) => {
        if ((e.target as HTMLElement).closest('button')) return
        if (import.meta.env.DEV) {
          console.log(`🔘 [Click] ExpandableDemandCardSDR Card Action: details`, { id: demand.id })
        }
        onAction?.('details', demand)
      }}
      className={cn(
        'w-full flex flex-col rounded-[16px] overflow-hidden transition-all duration-150 ease-in-out h-full cursor-pointer group hover:shadow-[0_8px_24px_rgba(26,58,82,0.12)] relative z-0',
        hasProperties
          ? 'border-[2px] border-[#4CAF50] bg-[#F2FBF5]'
          : demand.is_prioritaria
            ? 'border-[2px] border-[#FCD34D] bg-[#FFFBEB]'
            : 'border-[1px] border-[#E5E5E5] bg-white hover:border-[#1A3A52]/30',
        cardAnimation,
      )}
    >
      {/* Header */}
      <div
        className={cn(
          'p-4 border-b flex flex-col justify-between shrink-0 transition-colors duration-150 relative z-10 pointer-events-none',
          hasProperties
            ? 'border-[#4CAF50]/20 bg-[#4CAF50]/5'
            : demand.is_prioritaria
              ? 'border-[#FCD34D]/50 bg-[#FCD34D]/10'
              : 'border-[#E5E5E5] bg-[#F5F5F5]/50',
        )}
      >
        <div className="flex justify-between items-center mb-3">
          <span className="text-[12px] text-[#4B5563] font-sans font-bold bg-white px-2.5 py-1 rounded-[6px] border border-[#E5E5E5] shadow-sm flex items-center gap-1.5 pointer-events-auto">
            📅 {creationDateStr}
          </span>
          <div className="flex items-center gap-2 pointer-events-auto">
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
                {!prazo && (
                  <Badge
                    variant="outline"
                    className="bg-white text-[#999999] border-[#E5E5E5] font-bold text-[12px] shrink-0 shadow-sm"
                  >
                    Aguardando
                  </Badge>
                )}
              </div>
            ) : (
              <Badge
                variant="outline"
                className={cn(
                  'font-bold text-[12px] shrink-0 border-none px-2 py-1 shadow-sm',
                  demand.status_demanda === 'sem_resposta_24h' ||
                    demand.status_demanda === 'impossivel'
                    ? 'bg-[#FEF2F2] text-[#EF4444]'
                    : 'bg-white text-[#999999]',
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

        <div className="flex items-center gap-2 flex-wrap mb-2">
          <Badge
            className={cn(
              'text-[10px] font-bold px-2 py-1 border-none shadow-sm',
              isSale ? 'bg-[#FF9800]' : 'bg-[#1A3A52]',
            )}
          >
            {isSale ? 'VENDA' : 'ALUGUEL'}
          </Badge>

          {demand.is_prioritaria && (
            <Badge className="bg-[#FCD34D] text-[#854D0E] hover:bg-[#FCD34D] text-[10px] font-black px-2 py-1 flex items-center gap-1 shadow-sm border border-[#F59E0B]">
              <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
            </Badge>
          )}
        </div>

        <h3
          className="text-[18px] font-black text-[#1A3A52] leading-tight mt-1 line-clamp-2 group-hover:text-[#2E5F8A] transition-colors"
          title={demand.nome_cliente}
        >
          {demand.nome_cliente}
        </h3>
      </div>

      {/* Details */}
      <div className="p-4 flex flex-col gap-3 flex-1 relative z-0 pointer-events-none">
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

        <div className="flex items-center gap-4 text-[13px] text-[#666666] font-medium bg-[#F5F5F5] p-2.5 rounded-[8px] border border-[#E5E5E5] flex-wrap mt-auto">
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
        <div className="bg-[#4CAF50]/10 p-4 border-t border-[#4CAF50]/20 flex flex-col gap-2 shrink-0 relative z-0 pointer-events-none">
          <h4 className="text-[13px] font-black text-[#2E7D32] uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CAF50] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4CAF50]"></span>
            </span>
            Capturas em Tempo Real
          </h4>
          <div className="flex flex-col gap-2 max-h-[140px] overflow-y-auto pr-1 custom-scrollbar pointer-events-auto">
            {demand.imoveis_captados.map((imovel: any, i) => (
              <div
                key={imovel.id || i}
                className="bg-white rounded-[8px] p-3 shadow-[0_2px_4px_rgba(76,175,80,0.1)] border border-[#4CAF50]/30 flex flex-col gap-1.5 animate-fade-in-up"
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

      {/* Bottom Button Row */}
      <div className="p-4 pt-3 border-t border-[#E5E5E5] shrink-0 flex flex-col sm:flex-row flex-wrap gap-[8px] z-10 relative bg-white mt-auto pointer-events-auto">
        <Button
          variant="outline"
          className="flex-1 min-h-[44px] text-[#1A3A52] font-bold border-[#2E5F8A]/20 hover:bg-[#F5F5F5] transition-all duration-150 active:shadow-inner relative z-10"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (import.meta.env.DEV)
              console.log(`🔘 [Click] ExpandableDemandCardSDR Action: details bottom`, {
                id: demand.id,
              })
            onAction?.('details', demand)
          }}
          aria-label="Ver Detalhes da Demanda"
        >
          <Maximize2 className="w-4 h-4 mr-2" />
          Ver Detalhes
        </Button>

        {isOwnerOrAdmin && (
          <>
            <Button
              variant="outline"
              className="flex-1 min-h-[44px] text-[#333333] font-bold border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all duration-150 active:shadow-inner relative z-10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (import.meta.env.DEV)
                  console.log(`🔘 [Click] ExpandableDemandCardSDR Action: edit bottom`, {
                    id: demand.id,
                  })
                onAction?.('edit', demand)
              }}
              aria-label="Editar Demanda"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar
            </Button>
            <Button
              variant="outline"
              className="flex-1 min-h-[44px] text-[#854D0E] font-bold border-[#FCD34D] hover:bg-[#FEF3C7] transition-all duration-150 active:shadow-inner relative z-10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (import.meta.env.DEV)
                  console.log(`🔘 [Click] ExpandableDemandCardSDR Action: prioritize bottom`, {
                    id: demand.id,
                  })
                onAction?.('prioritize', demand)
              }}
              aria-label={demand.is_prioritaria ? 'Remover Prioridade' : 'Priorizar Demanda'}
            >
              <Star
                className={cn(
                  'w-4 h-4 mr-2 transition-all',
                  demand.is_prioritaria && 'fill-current text-[#F59E0B]',
                )}
              />
              {demand.is_prioritaria ? 'Normal' : 'Priorizar'}
            </Button>
          </>
        )}
      </div>
    </Card>
  )
}

