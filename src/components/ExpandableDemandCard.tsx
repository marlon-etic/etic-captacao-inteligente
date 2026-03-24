import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  AlertTriangle,
  X,
  CheckCircle2,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { CapturePropertyModal } from './CapturePropertyModal'
import { DemandDetailsModal } from './DemandDetailsModal'
import { NaoEncontreiModal } from './NaoEncontreiModal'
import { PrazoCounter } from './PrazoCounter'

export function ExpandableDemandCard({ demand }: { demand: SupabaseDemand }) {
  const { currentUser } = useAppStore()
  const { toast } = useToast()

  const [isCaptureModalOpen, setIsCaptureModalOpen] = useState(false)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isNaoEncontreiModalOpen, setIsNaoEncontreiModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPrioritizing, setIsPrioritizing] = useState(false)

  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor' ||
    demand.sdr_id === currentUser?.id ||
    demand.corretor_id === currentUser?.id

  const togglePriority = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV)
      console.log(`🔘 [Click] ExpandableDemandCard Action: prioritize`, { id: demand.id })
    if (isPrioritizing || !isOwnerOrAdmin) return
    setIsPrioritizing(true)

    const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
    const newStatus = !demand.is_prioritaria

    try {
      const { error } = await supabase
        .from(table)
        .update({ is_prioritaria: newStatus })
        .eq('id', demand.id)

      if (error) throw error

      toast({
        title: newStatus ? '⭐ Demanda Priorizada' : 'Prioridade Removida',
        description: newStatus
          ? 'A demanda subiu para o topo do feed dos captadores.'
          : 'A demanda voltou à posição normal.',
        className: newStatus ? 'bg-[#FCD34D] text-[#854D0E] border-none' : '',
      })
    } catch (err: any) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a prioridade.',
        variant: 'destructive',
      })
    } finally {
      setIsPrioritizing(false)
    }
  }

  const latestResp = demand.respostas_captador?.[0]
  const isNaoEncontrei = latestResp?.resposta === 'nao_encontrei'

  let statusConfig = {
    label: 'DISPONÍVEL PARA TODOS',
    bg: 'bg-[#10B981]',
    text: 'text-white',
    icon: Lock,
  }

  if (demand.status_demanda === 'impossivel') {
    statusConfig = { label: 'PERDIDA / CANCELADA', bg: 'bg-gray-500', text: 'text-white', icon: X }
  } else if (demand.status_demanda === 'atendida') {
    statusConfig = {
      label: 'ATENDIDA / EM NEGOCIAÇÃO',
      bg: 'bg-blue-500',
      text: 'text-white',
      icon: CheckCircle2,
    }
  } else if (demand.status_demanda === 'ganho') {
    statusConfig = {
      label: 'NEGÓCIO FECHADO',
      bg: 'bg-[#10B981]',
      text: 'text-white',
      icon: CheckCircle2,
    }
  } else if (demand.status_demanda === 'sem_resposta_24h') {
    statusConfig = {
      label: 'SEM RESPOSTA',
      bg: 'bg-yellow-500',
      text: 'text-white',
      icon: AlertTriangle,
    }
  } else if (demand.status_demanda === 'aberta' && isNaoEncontrei) {
    if (latestResp.motivo === 'Buscando outras opções') {
      statusConfig = { label: 'BUSCANDO', bg: 'bg-[#F97316]', text: 'text-white', icon: Search }
    } else {
      statusConfig = {
        label: 'NÃO ENCONTRADO',
        bg: 'bg-[#EF4444]',
        text: 'text-white',
        icon: XCircle,
      }
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const handleEncontrei = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV)
      console.log(`🔘 [Click] ExpandableDemandCard Action: encontrei`, { id: demand.id })
    setIsCaptureModalOpen(true)
  }

  const handleNaoEncontrei = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV)
      console.log(`🔘 [Click] ExpandableDemandCard Action: nao_encontrei`, { id: demand.id })
    setIsNaoEncontreiModalOpen(true)
  }

  const handleNaoEncontreiConfirm = async (reason: string, obs: string) => {
    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const payload = {
        captador_id: currentUser?.id,
        resposta: 'nao_encontrei',
        motivo: reason,
        observacao: obs,
        demanda_locacao_id: demand.tipo === 'Aluguel' ? demand.id : null,
        demanda_venda_id: demand.tipo === 'Venda' ? demand.id : null,
      }

      const { error } = await supabase.from('respostas_captador').insert(payload)
      if (error) throw error

      if (reason === 'Fora do mercado') {
        const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        await supabase.from(table).update({ status_demanda: 'impossivel' }).eq('id', demand.id)
      } else if (reason === 'Buscando outras opções') {
        const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        await supabase.from(table).update({ status_demanda: 'aberta' }).eq('id', demand.id)
      }

      toast({
        title: 'Feedback Enviado',
        description: `Sua resposta foi registrada e o solicitante notificado.`,
        className: 'bg-[#10B981] text-white border-none',
      })

      setIsNaoEncontreiModalOpen(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar resposta',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openDetails = (e: React.MouseEvent) => {
    e.preventDefault() // prevent default if it's within a link or something
    if (import.meta.env.DEV)
      console.log(`🔘 [Click] ExpandableDemandCard Card Action: details`, { id: demand.id })
    setIsDetailsModalOpen(true)
  }

  const isBrandNew = new Date().getTime() - new Date(demand.created_at).getTime() < 1000 * 60 * 5

  const prazo = demand.prazos_captacao?.[0]
  const isPrazoExpired =
    prazo?.status === 'vencido' ||
    prazo?.status === 'sem_resposta_24h' ||
    prazo?.status === 'sem_resposta_final'

  const mappedDemand = {
    id: demand.id,
    clientName: demand.nome_cliente,
    type: demand.tipo,
    location: demand.bairros,
    minBudget: demand.valor_minimo,
    maxBudget: demand.valor_maximo,
    bedrooms: demand.dormitorios,
    bathrooms: 0,
    parkingSpots: demand.vagas_estacionamento,
    timeframe: demand.nivel_urgencia,
    description: demand.observacoes,
    status:
      demand.status_demanda === 'aberta'
        ? 'Pendente'
        : demand.status_demanda === 'atendida'
          ? 'Atendida'
          : demand.status_demanda === 'ganho'
            ? 'Ganho'
            : 'Perdida',
    createdAt: demand.created_at,
    isPrioritized: demand.is_prioritaria,
    createdBy: demand.sdr_id || demand.corretor_id || '',
    capturedProperties: demand.imoveis_captados?.map((i) => ({
      id: i.id,
      code: i.codigo_imovel,
      value: i.preco,
      neighborhood: i.endereco,
      capturedAt: i.created_at,
      status: i.status_captacao,
      captador_id: i.user_captador_id,
      captador_name: i.captador_nome,
      etapa_funil: i.etapa_funil || 'capturado',
      data_visita: i.data_visita,
      data_fechamento: i.data_fechamento,
      dormitorios: i.dormitorios,
      vagas: i.vagas,
      observacoes: i.observacoes,
    })),
  } as any

  return (
    <>
      <Card
        onClick={openDetails}
        className={cn(
          'w-full relative overflow-hidden rounded-[16px] border shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b cursor-pointer group z-0',
          demand.is_prioritaria
            ? 'from-[#FFFBEB] to-white border-[#FCD34D]'
            : 'from-[#F2FBF5] to-white border-[#E5E5E5]',
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 flex items-center shadow-sm border-b bg-white flex-wrap gap-2 justify-between relative',
            demand.is_prioritaria ? 'border-[#FCD34D]/50' : 'border-[#E5E5E5]/50',
          )}
        >
          <div className="flex items-center gap-2 flex-wrap pr-8">
            <div
              className={cn(
                'flex items-center gap-2 font-black text-[11px] uppercase tracking-widest px-2 py-1 rounded shadow-sm',
                statusConfig.bg,
                statusConfig.text,
              )}
            >
              <statusConfig.icon className="w-3.5 h-3.5" />
              {statusConfig.label}
              {isBrandNew && (
                <span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-sm text-[9px] animate-pulse">
                  NOVA
                </span>
              )}
            </div>

            {demand.is_prioritaria && (
              <Badge className="bg-[#FCD34D] text-[#854D0E] hover:bg-[#FCD34D] text-[10px] font-black px-2 py-1 flex items-center gap-1 shadow-sm border border-[#F59E0B]">
                <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {prazo && demand.status_demanda === 'aberta' && prazo.status !== 'respondido' && (
              <PrazoCounter prazoResposta={prazo.prazo_resposta} isExpired={isPrazoExpired} />
            )}

            {isOwnerOrAdmin && (
              <button
                onClick={togglePriority}
                disabled={isPrioritizing}
                className={cn(
                  'flex items-center justify-center w-8 h-8 rounded-full transition-all border shadow-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B] focus:ring-offset-1 disabled:opacity-50 shrink-0 absolute right-4 sm:relative sm:right-auto relative z-10',
                  demand.is_prioritaria
                    ? 'bg-[#FFFBEB] border-[#FCD34D] hover:bg-[#FEF3C7]'
                    : 'bg-white border-[#E5E5E5] hover:bg-[#F5F5F5] hover:border-[#FCD34D] group-hover:border-[#FCD34D]/50',
                )}
                title={demand.is_prioritaria ? 'Remover prioridade' : 'Marcar como prioritária'}
              >
                <Star
                  className={cn(
                    'w-4 h-4 transition-all',
                    demand.is_prioritaria
                      ? 'fill-[#F59E0B] text-[#F59E0B]'
                      : 'text-[#999999] hover:text-[#F59E0B]',
                  )}
                />
              </button>
            )}
          </div>
        </div>

        <div className="p-4 flex flex-col gap-3 pointer-events-none">
          <h3
            className="text-[18px] font-black text-[#1A3A52] leading-tight pr-24 line-clamp-1 group-hover:text-[#2E5F8A] transition-colors"
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
            <p className="leading-snug font-medium line-clamp-2">
              {demand.observacoes ||
                'Nenhum cliente específico — qualquer imóvel que se encaixe serve!'}
            </p>
          </div>
        </div>

        {(demand.status_demanda === 'aberta' || demand.status_demanda === 'sem_resposta_24h') &&
          currentUser?.role === 'captador' && (
            <div className="grid grid-cols-2 gap-2 mt-3 p-4 pt-3 border-t border-[#E5E5E5]">
              <Button
                onClick={handleEncontrei}
                disabled={isSubmitting}
                className="w-full min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[14px] lg:text-[16px] px-1 lg:px-2 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02] relative z-10"
              >
                <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 shrink-0" />{' '}
                <span className="truncate">ENCONTREI</span>
              </Button>
              <Button
                onClick={handleNaoEncontrei}
                disabled={isSubmitting}
                className="w-full min-h-[48px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-[14px] lg:text-[16px] px-1 lg:px-2 shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-transform hover:scale-[1.02] relative z-10"
              >
                <XCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 shrink-0" />{' '}
                <span className="truncate">NÃO ENCONTREI</span>
              </Button>
            </div>
          )}
      </Card>

      <DemandDetailsModal
        open={isDetailsModalOpen}
        onOpenChange={setIsDetailsModalOpen}
        demand={mappedDemand}
        onEncontrei={
          currentUser?.role === 'captador' &&
          (demand.status_demanda === 'aberta' || demand.status_demanda === 'sem_resposta_24h')
            ? () => {
                setIsDetailsModalOpen(false)
                setTimeout(() => setIsCaptureModalOpen(true), 300)
              }
            : undefined
        }
      />

      <CapturePropertyModal
        isOpen={isCaptureModalOpen}
        onClose={() => setIsCaptureModalOpen(false)}
        demand={demand}
        onSuccess={() => {
          setIsCaptureModalOpen(false)
        }}
      />

      <NaoEncontreiModal
        isOpen={isNaoEncontreiModalOpen}
        onClose={() => setIsNaoEncontreiModalOpen(false)}
        onConfirm={handleNaoEncontreiConfirm}
      />
    </>
  )
}
