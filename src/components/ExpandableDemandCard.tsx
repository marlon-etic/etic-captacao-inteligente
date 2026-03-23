import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  MapPin,
  DollarSign,
  Home,
  BedDouble,
  Car,
  Tag,
  Info,
  Lock,
  Star,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import useAppStore from '@/stores/useAppStore'

export function ExpandableDemandCard({ demand }: { demand: SupabaseDemand }) {
  const { currentUser, submitDemandResponse } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const statusConfig =
    demand.status_demanda === 'aberta'
      ? { label: 'DISPONÍVEL PARA TODOS', bg: 'bg-[#10B981]', text: 'text-white', icon: Lock }
      : demand.status_demanda === 'atendida'
        ? {
            label: 'ATENDIDA / EM NEGOCIAÇÃO',
            bg: 'bg-blue-500',
            text: 'text-white',
            icon: CheckCircle,
          }
        : demand.status_demanda === 'sem_resposta_24h'
          ? { label: 'SEM RESPOSTA', bg: 'bg-yellow-500', text: 'text-white', icon: Info }
          : { label: 'PERDIDA / CANCELADA', bg: 'bg-gray-500', text: 'text-white', icon: XCircle }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const handleEncontrei = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSubmitting) return
    setIsSubmitting(true)

    // Call the mock function or real logic to submit capture
    submitDemandResponse(demand.id, 'encontrei', {
      value: demand.valor_maximo,
      neighborhood: demand.bairros[0],
    })

    setTimeout(() => setIsSubmitting(false), 1000)
  }

  const handleNaoEncontrei = async (e: React.MouseEvent) => {
    e.stopPropagation()
    // Optional logic for não encontrei
  }

  const isBrandNew = new Date().getTime() - new Date(demand.created_at).getTime() < 1000 * 60 * 5

  return (
    <Card className="w-full relative overflow-hidden rounded-[16px] border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b from-[#F2FBF5] to-white">
      {demand.is_prioritaria && (
        <div className="absolute top-11 right-3 z-10 bg-[#FCD34D] text-[#854D0E] text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-[#F59E0B]">
          <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
        </div>
      )}

      <div
        className={cn(
          'px-4 py-2.5 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-sm',
          statusConfig.bg,
          statusConfig.text,
        )}
      >
        <statusConfig.icon className="w-3.5 h-3.5" />
        {statusConfig.label}
        {isBrandNew && (
          <span className="ml-auto bg-white/20 px-2 rounded-sm text-[9px] animate-pulse">NOVA</span>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3">
        <h3
          className="text-[18px] font-black text-[#1A3A52] leading-tight pr-24 line-clamp-1"
          title={demand.nome_cliente}
        >
          {demand.nome_cliente}
        </h3>

        <div className="flex flex-col gap-1.5 mt-1">
          <div className="flex items-center gap-2 text-[14px] text-[#333333]">
            <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
            <span className="font-medium line-clamp-1" title={demand.bairros?.join(', ')}>
              {demand.bairros?.join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[14px] text-[#333333]">
            <Home className="w-4 h-4 text-[#1A3A52] shrink-0" />
            <span className="font-medium">{demand.tipo_imovel || 'Imóvel Residencial'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <DollarSign className="w-5 h-5 text-[#10B981] shrink-0" />
          <span className="text-[20px] font-black text-[#10B981] tracking-tight">
            {formatPrice(demand.valor_minimo)} - {formatPrice(demand.valor_maximo)}
          </span>
        </div>

        <div className="flex items-center gap-4 text-[13px] text-[#666666] font-medium bg-white p-2.5 rounded-lg mt-1 border border-[#E5E5E5] flex-wrap shadow-sm">
          <div className="flex items-center gap-1.5">
            <BedDouble className="w-4 h-4 text-[#999999]" /> {demand.dormitorios || 'Indif.'} dorm
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4 text-[#999999]" /> {demand.vagas_estacionamento || 'Indif.'}{' '}
            vagas
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-[#999999]" /> {demand.tipo}
          </div>
        </div>

        <div className="flex items-start gap-2.5 bg-[#E8F5E9] text-[#065F46] p-3 rounded-lg text-[13px] mt-1 border border-[#A7F3D0] shadow-sm">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
          <p className="leading-snug font-medium">
            {demand.observacoes ||
              'Nenhum cliente específico — qualquer imóvel que se encaixe serve!'}
          </p>
        </div>

        {demand.status_demanda === 'aberta' && currentUser?.role === 'captador' && (
          <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-[#E5E5E5]">
            <Button
              onClick={handleEncontrei}
              disabled={isSubmitting}
              className="w-full sm:flex-1 min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            >
              <CheckCircle className="w-5 h-5 mr-2" /> ENCONTREI IMÓVEL
            </Button>
            <Button
              onClick={handleNaoEncontrei}
              variant="outline"
              className="w-full sm:flex-1 min-h-[48px] text-[#EF4444] border-[#EF4444]/30 hover:bg-[#FEF2F2] font-bold"
            >
              <XCircle className="w-5 h-5 mr-2" /> Não Encontrei
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
