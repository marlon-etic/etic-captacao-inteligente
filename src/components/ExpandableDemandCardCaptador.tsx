import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  User as UserIcon,
  CheckCircle2,
  X,
  AlertTriangle,
  Home,
  BedDouble,
  Car,
  Tag,
  Info,
  Lock,
  Star,
  CheckCircle,
  XCircle,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { DemandDetailModal } from './DemandDetailModal'
import { CapturePropertyModal } from './CapturePropertyModal'
import { NaoEncontreiModal } from './NaoEncontreiModal'
import { PrazoCounter } from './PrazoCounter'

export function ExpandableDemandCardCaptador({ demand }: { demand: SupabaseDemand }) {
  const [expanded, setExpanded] = useState(false)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [captureModalOpen, setCaptureModalOpen] = useState(false)
  const [naoEncontreiModalOpen, setNaoEncontreiModalOpen] = useState(false)

  const { currentUser } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    e.stopPropagation()
    setCaptureModalOpen(true)
  }

  const handleNaoEncontrei = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNaoEncontreiModalOpen(true)
  }

  const handleNaoEncontreiConfirm = async (
    reason: string,
    obs: string,
    continueSearch: boolean,
  ) => {
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

      if (reason === 'Fora do mercado' || !continueSearch) {
        const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        await supabase.from(table).update({ status_demanda: 'impossivel' }).eq('id', demand.id)
      } else {
        const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        await supabase.from(table).update({ status_demanda: 'aberta' }).eq('id', demand.id)

        // Se escolheu tentar em 24h, tentamos prorrogar o prazo se possível
        const prazo = demand.prazos_captacao?.[0]
        if (prazo && prazo.prorrogacoes_usadas < 3) {
          const newPrazo = new Date()
          newPrazo.setTime(Date.now() + 24 * 3600000)
          await supabase
            .from('prazos_captacao')
            .update({
              prazo_resposta: newPrazo.toISOString(),
              prorrogacoes_usadas: prazo.prorrogacoes_usadas + 1,
              status: 'ativo',
            })
            .eq('id', prazo.id)
        }
      }

      toast({
        title: 'Feedback Enviado',
        description: `Sua resposta foi registrada com sucesso.`,
        className: 'bg-[#10B981] text-white border-none',
      })

      setNaoEncontreiModalOpen(false)
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

  const prazo = demand.prazos_captacao?.[0]
  const isPrazoExpired =
    prazo?.status === 'vencido' ||
    prazo?.status === 'sem_resposta_24h' ||
    prazo?.status === 'sem_resposta_final'

  const handleProrrogar = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!prazo || prazo.prorrogacoes_usadas >= 3) return

    setIsSubmitting(true)
    try {
      const newPrazo = new Date()
      const currentPrazo = new Date(prazo.prazo_resposta)
      if (currentPrazo.getTime() > Date.now()) {
        newPrazo.setTime(currentPrazo.getTime() + 48 * 3600000)
      } else {
        newPrazo.setTime(Date.now() + 48 * 3600000)
      }

      const { error } = await supabase
        .from('prazos_captacao')
        .update({
          prazo_resposta: newPrazo.toISOString(),
          prorrogacoes_usadas: prazo.prorrogacoes_usadas + 1,
          captador_id: currentUser?.id,
          status: 'ativo',
        })
        .eq('id', prazo.id)

      if (error) throw error

      if (demand.status_demanda === 'sem_resposta_24h') {
        const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        await supabase.from(table).update({ status_demanda: 'aberta' }).eq('id', demand.id)
      }

      toast({
        title: 'Prazo prorrogado!',
        description: `Novo prazo de +48h.`,
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (err: any) {
      toast({ title: 'Erro ao prorrogar', description: err.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const capturedCount = demand.imoveis_captados?.length || 0
  const isBrandNew = new Date().getTime() - new Date(demand.created_at).getTime() < 1000 * 60 * 5

  return (
    <>
      <Card
        className={cn(
          'w-full relative overflow-hidden rounded-[16px] border shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b flex flex-col h-full z-0',
          demand.is_prioritaria
            ? 'from-[#FFFBEB] to-white border-[#FCD34D]'
            : 'from-[#F2FBF5] to-white border-[#E5E5E5]',
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 flex items-center shadow-sm border-b bg-white flex-wrap gap-2 justify-between relative z-10',
            demand.is_prioritaria ? 'border-[#FCD34D]/50' : 'border-[#E5E5E5]/50',
          )}
        >
          <div className="flex items-center gap-2 flex-wrap pointer-events-none">
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
          {prazo &&
            (demand.status_demanda === 'aberta' || demand.status_demanda === 'sem_resposta_24h') &&
            prazo.status !== 'respondido' && (
              <div className="flex flex-col items-end pointer-events-none">
                <PrazoCounter prazoResposta={prazo.prazo_resposta} isExpired={isPrazoExpired} />
                {prazo.prorrogacoes_usadas > 0 && (
                  <span className="text-[9px] font-bold text-[#666666] mt-0.5">
                    {prazo.prorrogacoes_usadas}/3 Prorrog.
                  </span>
                )}
              </div>
            )}
        </div>

        <div
          className="p-4 flex flex-col gap-3 flex-1 cursor-pointer relative z-0"
          onClick={() => setDetailsModalOpen(true)}
        >
          <h3
            className="text-[18px] font-black text-[#1A3A52] leading-tight pr-24 line-clamp-1 group-hover:text-[#2E5F8A] transition-colors"
            title={demand.nome_cliente}
          >
            {demand.nome_cliente}
          </h3>

          <div className="flex flex-col gap-1.5 mt-1 pointer-events-none">
            <div className="flex items-center gap-2 text-[14px] text-[#333333]">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="font-medium line-clamp-1" title={demand.bairros?.join(', ')}>
                {demand.bairros?.join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#333333]">
              <Home className="w-4 h-4 text-[#1A3A52] shrink-0" />
              <span className="font-medium">
                {demand.tipo_imovel || 'Imóvel para ' + demand.tipo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1 pointer-events-none">
            <DollarSign className="w-5 h-5 text-[#10B981] shrink-0" />
            <span className="text-[20px] font-black text-[#10B981] tracking-tight">
              {formatPrice(demand.valor_minimo)} - {formatPrice(demand.valor_maximo)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-[#666666] font-medium bg-white p-2.5 rounded-lg mt-1 border border-[#E5E5E5] flex-wrap shadow-sm pointer-events-none">
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

          <div className="flex items-start gap-2.5 bg-[#E8F5E9] text-[#065F46] p-3 rounded-lg text-[13px] mt-1 border border-[#A7F3D0] shadow-sm pointer-events-none">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
            <p className="leading-snug font-medium line-clamp-3">
              {demand.observacoes ||
                'Nenhum cliente específico — qualquer imóvel que se encaixe serve!'}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#E5E5E5] flex-wrap gap-2 pointer-events-auto">
            <Badge
              className={cn(
                'border-none px-3 h-6 flex items-center justify-center font-bold text-[11px] shadow-sm',
                capturedCount > 0
                  ? 'bg-[#10B981] text-white'
                  : 'bg-white text-[#999999] border border-[#E5E5E5]',
              )}
            >
              {capturedCount} imóveis captados
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-[#1A3A52] font-bold hover:bg-[#F5F5F5] rounded-[8px] relative z-10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setExpanded(!expanded)
              }}
            >
              {expanded ? (
                <>
                  <ChevronUp className="w-4 h-4 mr-1" /> Ocultar
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 mr-1" /> Ver Propriedades
                </>
              )}
            </Button>
          </div>

          {(demand.status_demanda === 'aberta' || demand.status_demanda === 'sem_resposta_24h') && (
            <div className="flex flex-col gap-2 mt-3 pt-3 border-t border-[#E5E5E5] pointer-events-auto">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleEncontrei(e)
                  }}
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[14px] lg:text-[16px] px-1 lg:px-2 shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02] relative z-10"
                >
                  <CheckCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 shrink-0" />{' '}
                  <span className="truncate">ENCONTREI</span>
                </Button>
                <Button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleNaoEncontrei(e)
                  }}
                  disabled={isSubmitting}
                  className="w-full min-h-[48px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-[14px] lg:text-[16px] px-1 lg:px-2 shadow-[0_4px_12px_rgba(239,68,68,0.3)] transition-transform hover:scale-[1.02] relative z-10"
                >
                  <XCircle className="w-4 h-4 lg:w-5 lg:h-5 mr-1.5 shrink-0" />{' '}
                  <span className="truncate">NÃO ENCONTREI</span>
                </Button>
              </div>
              {prazo && prazo.prorrogacoes_usadas < 3 && prazo.status !== 'respondido' && (
                <Button
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleProrrogar(e)
                  }}
                  disabled={isSubmitting}
                  className="w-full h-[40px] text-[12px] font-bold border-[#1A3A52]/20 text-[#1A3A52] hover:bg-[#F8FAFC] relative z-10"
                >
                  <Clock className="w-4 h-4 mr-1.5" /> Prorrogar Prazo (+48h)
                </Button>
              )}
              {prazo && prazo.prorrogacoes_usadas >= 3 && prazo.status !== 'respondido' && (
                <div className="text-[11px] text-center text-[#EF4444] font-bold mt-1">
                  Máximo de 3 prorrogações atingido.
                </div>
              )}
            </div>
          )}
        </div>

        {expanded && (
          <div className="bg-[#FAFAFA] p-4 border-t border-[#E5E5E5] rounded-b-[16px] animate-in fade-in slide-in-from-top-2 relative z-0">
            {capturedCount === 0 ? (
              <div className="py-6 text-center text-[#999999] text-[13px] border border-dashed border-[#E5E5E5] rounded-lg bg-white pointer-events-none">
                Nenhum imóvel captado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-3 mt-2">
                {demand.imoveis_captados.map((imovel) => {
                  return (
                    <div
                      key={imovel.id}
                      className="bg-white p-3.5 rounded-lg border border-[#E5E5E5] shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center hover:border-[#1A3A52]/30 transition-colors pointer-events-none"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-black text-[#1A3A52] text-[14px] truncate">
                            {imovel.codigo_imovel || 'Sem código'}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[9px] h-5 py-0 px-2 uppercase border-none font-bold shrink-0',
                              imovel.etapa_funil === 'fechado'
                                ? 'bg-[#D1FAE5] text-[#065F46]'
                                : imovel.etapa_funil === 'perdido'
                                  ? 'bg-[#FEE2E2] text-[#EF4444]'
                                  : imovel.etapa_funil === 'visitado'
                                    ? 'bg-[#FEF3C7] text-[#B45309]'
                                    : 'bg-[#E0E7FF] text-[#3730A3]',
                            )}
                          >
                            {imovel.etapa_funil || 'Pendente'}
                          </Badge>
                        </div>
                        <div className="text-[12px] text-[#666666] flex flex-col gap-2 font-medium">
                          <div className="flex items-center gap-2 truncate">
                            <MapPin className="w-4 h-4 shrink-0 text-[#999999]" />{' '}
                            <span className="truncate">
                              {imovel.endereco || 'Endereço não informado'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 shrink-0 text-[#10B981]" />{' '}
                            <span className="font-bold text-[#333333] text-[13px]">
                              {formatPrice(imovel.preco || 0)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 truncate">
                            <UserIcon className="w-4 h-4 shrink-0 text-[#999999]" /> Captador:{' '}
                            <span className="truncate text-[#333333]">{imovel.captador_nome}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </Card>

      <DemandDetailModal
        demand={demand}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onFoundProperty={() => {
          setDetailsModalOpen(false)
          setCaptureModalOpen(true)
        }}
      />

      <CapturePropertyModal
        demand={demand}
        isOpen={captureModalOpen}
        onClose={() => setCaptureModalOpen(false)}
        onSuccess={() => {
          setCaptureModalOpen(false)
        }}
      />

      <NaoEncontreiModal
        isOpen={naoEncontreiModalOpen}
        onClose={() => setNaoEncontreiModalOpen(false)}
        onConfirm={handleNaoEncontreiConfirm}
      />
    </>
  )
}
