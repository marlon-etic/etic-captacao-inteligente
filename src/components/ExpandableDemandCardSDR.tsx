import { useState, memo, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { cn } from '@/lib/utils'
import { isDemandGloballyLost } from '@/lib/demand-status'
import {
  MapPin,
  Clock,
  DollarSign,
  Info,
  CheckCircle2,
  X,
  AlertTriangle,
  Search,
  MessageCircle,
  Eye,
  Handshake,
  Star,
  Zap,
  Calendar,
} from 'lucide-react'
import { useSlaCountdown, useTimeElapsed } from '@/hooks/useTimeElapsed'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { RespostasBadge, RespostasHistory } from './RespostasHistory'
import { useMatchCount } from '@/hooks/use-match-count'
import { useNavigate } from 'react-router-dom'
import { PrioritizeModal } from './PrioritizeModal'
import { toggleDemandPriority } from '@/services/priority-service'
import { LostModal } from './LostModal'
import { supabase } from '@/lib/supabase/client'
import { DemandMatchModal } from './DemandMatchModal'
import { VisitRegistrationModal, type LinkedProperty } from './VisitRegistrationModal'
import { DemandLifecycleTimeline } from './DemandLifecycleTimeline'

function ExpandableDemandCardSDRComponent({
  demand,
  onAction,
}: {
  demand: SupabaseDemand
  onAction?: (action: 'details' | 'edit' | 'lost' | 'prioritize', d: SupabaseDemand) => void
}) {
  const { currentUser, logSolicitorContactAttempt } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { count: matchCount } = useMatchCount('demanda', demand.id || '')
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false)
  const [isPrioritizing, setIsPrioritizing] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [linkedProperties, setLinkedProperties] = useState<LinkedProperty[]>([])

  const canPrioritize = ['sdr', 'admin', 'gestor', 'corretor'].includes(currentUser?.role)

  const { text: timeElapsedText, hoursElapsed } = useTimeElapsed(demand.created_at)

  const prazoDb = demand.prazos_captacao?.[0]
  const isPending =
    demand.status_demanda === 'aberta' || demand.status_demanda === 'sem_resposta_24h'

  const { text: slaText, level: slaLevel } = useSlaCountdown(
    demand.created_at,
    prazoDb?.prazo_resposta,
    isPending ? 'aberta' : demand.status_demanda,
    prazoDb?.prorrogacoes_usadas,
  )

  const isHighUrgency = demand.nivel_urgencia === 'Alta' || demand.nivel_urgencia === 'Urgente'
  const isPrioritized = demand.is_prioritaria
  const isLost = isDemandGloballyLost(demand.status_demanda)
  const isNew = hoursElapsed <= 24 && isPending && !isLost && !isPrioritized

  const canMarkLost =
    !isLost &&
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'gestor' ||
      currentUser?.id === demand.sdr_id ||
      currentUser?.id === demand.corretor_id)

  const respostasNaoEncontrei = useMemo(
    () =>
      (demand.respostas_captador || []).filter(
        (r: any) => r.resposta === 'nao_encontrei' || r.resposta === 'perdido',
      ),
    [demand.respostas_captador],
  )

  let statusConfig = {
    label: 'DISPONÍVEL',
    bg: 'bg-[#10B981]',
    text: 'text-white',
    icon: Search,
  }

  if (isDemandGloballyLost(demand.status_demanda)) {
    statusConfig = { label: 'PERDIDA / CANCELADA', bg: 'bg-gray-500', text: 'text-white', icon: X }
  } else if (demand.status_demanda === 'atendida' || demand.status_demanda === 'ganho') {
    statusConfig = {
      label: demand.status_demanda === 'ganho' ? 'NEGÓCIO FECHADO' : 'ATENDIDA',
      bg: demand.status_demanda === 'ganho' ? 'bg-[#388E3C]' : 'bg-blue-500',
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
  }

  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    })
    return (val: number) => formatter.format(val)
  }, [])

  const capturedCount = demand.imoveis_captados?.length || 0
  const activeCaptadores = useMemo(
    () =>
      (demand.captadores_busca || []).filter(
        (c: any) => new Date(c.data_clique).getTime() > Date.now() - 24 * 3600000,
      ),
    [demand.captadores_busca],
  )

  let progressStatus = 'Aguardando'
  let progressColor = 'bg-gray-100 text-gray-600 border-gray-200'

  if (capturedCount > 0 || matchCount > 0) {
    progressStatus = 'Imóvel Proposto'
    progressColor = 'bg-emerald-100 text-emerald-700 border-emerald-200'
  } else if (respostasNaoEncontrei.length > 0) {
    progressStatus = 'Sem Opções'
    progressColor = 'bg-red-100 text-red-700 border-red-200'
  } else if (activeCaptadores.length > 0) {
    progressStatus = 'Em Busca'
    progressColor = 'bg-blue-100 text-blue-700 border-blue-200'
  } else {
    progressStatus = 'Aguardando'
    progressColor = 'bg-gray-100 text-gray-600 border-gray-200'
  }

  const handlePrioritize = async (reason: string) => {
    if (isPrioritizing) return
    setIsPrioritizing(true)
    try {
      const demandType = demand.tipo === 'Venda' ? 'Venda' : 'Aluguel'
      const { error } = await toggleDemandPriority(demand.id, demandType, false, reason)
      if (error) throw error

      toast({
        title: '⭐ Demanda Priorizada',
        description: 'Os captadores foram notificados. Prazo de 24h iniciado.',
        className: 'bg-[#FCD34D] text-[#854D0E] border-none',
      })

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demand.tipo,
            data: { id: demand.id, is_prioritaria: true, motivo_priorizacao: reason },
          },
        }),
      )
    } catch (err: any) {
      toast({
        title: 'Erro ao priorizar',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsPrioritizing(false)
    }
  }

  const handleDeprioritize = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPrioritizing) return
    setIsPrioritizing(true)
    try {
      const demandType = demand.tipo === 'Venda' ? 'Venda' : 'Aluguel'
      const { error } = await toggleDemandPriority(demand.id, demandType, true)
      if (error) throw error

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demand.tipo,
            data: { id: demand.id, is_prioritaria: false, motivo_priorizacao: null },
          },
        }),
      )

      toast({
        title: 'Prioridade Removida',
        description: 'A demanda voltou à posição normal.',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao despriorizar',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsPrioritizing(false)
    }
  }

  const handleLostConfirm = async (reason: string, obs: string) => {
    try {
      const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
      const { error } = await supabase
        .from(table)
        .update({
          status_demanda: 'perdida',
          motivo_perda: reason,
          motivo_perda_descricao: obs,
          updated_at: new Date().toISOString(),
        })
        .eq('id', demand.id)

      if (error) throw error

      await supabase.from('audit_log').insert({
        usuario_id: currentUser?.id || null,
        acao: 'UPDATE',
        tabela: table,
        registro_id: demand.id,
        dados_novos: {
          status_demanda: 'perdida',
          motivo_perda: reason,
          motivo_perda_descricao: obs,
        },
      })

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demand.tipo,
            data: {
              id: demand.id,
              status_demanda: 'perdida',
              db_status_demanda: 'perdida',
            },
          },
        }),
      )

      toast({
        title: 'Sucesso',
        description: 'Demanda marcada como perdida com sucesso.',
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (err: any) {
      toast({
        title: 'Falha ao marcar como perdida',
        description: err.message,
        variant: 'destructive',
      })
    }
  }

  const handleOpenVisitModal = useCallback(async () => {
    try {
      const { data: matches } = await supabase
        .from('imovel_demand_match')
        .select('id, imovel_id, imoveis_captados(endereco, codigo_imovel, localizacao_texto)')
        .eq('demanda_id', demand.id)

      const props: LinkedProperty[] = (matches || []).map((m: any) => ({
        matchId: m.id,
        imovelId: m.imovel_id,
        label:
          m.imoveis_captados?.endereco ||
          m.imoveis_captados?.localizacao_texto ||
          m.imoveis_captados?.codigo_imovel ||
          'Imóvel',
      }))
      setLinkedProperties(props)
    } catch (err) {
      console.error('Error fetching linked properties:', err)
    }
    setShowVisitModal(true)
  }, [demand.id])

  return (
    <>
      <Card
        id={`demand-card-${demand.id}`}
        className={cn(
          'w-full h-full relative overflow-hidden rounded-[16px] border shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b flex flex-col z-0',
          isPrioritized
            ? 'from-[#FFFBEB] to-white border-[#FCD34D]'
            : isNew
              ? 'from-[#F2FBF5] to-white border-[#4CAF50]'
              : isLost
                ? 'bg-[#F5F5F5] opacity-90 border-[#E5E5E5]'
                : 'from-[#FFFFFF] to-white border-[#E5E5E5]',
        )}
      >
        <div
          className={cn(
            'px-4 py-2.5 flex items-center shadow-sm border-b bg-white flex-wrap gap-2 justify-between relative z-10 pointer-events-none',
            isPrioritized ? 'border-[#FCD34D]/50' : 'border-[#E5E5E5]/50',
          )}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {!isPrioritized && (
              <div
                className={cn(
                  'flex items-center gap-2 font-black text-[11px] uppercase tracking-widest px-2 py-1 rounded shadow-sm',
                  statusConfig.bg,
                  statusConfig.text,
                )}
              >
                <statusConfig.icon className="w-3.5 h-3.5" />
                {statusConfig.label}
              </div>
            )}

            {isPrioritized && (
              <Badge className="bg-[#F44336] text-[#FFFFFF] hover:bg-[#d32f2f] text-[10px] font-black px-2 py-1 flex items-center gap-1 shadow-sm border-none">
                <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
              </Badge>
            )}

            {isNew && !isPrioritized && (
              <Badge className="bg-[#4CAF50] text-[#FFFFFF] border-none font-bold text-[10px] px-2 py-1 shadow-sm uppercase tracking-wider animate-pulse flex items-center gap-1 pointer-events-auto">
                <Zap className="w-3 h-3 fill-current" /> NOVA DEMANDA
              </Badge>
            )}

            <Badge
              className={cn(
                'border font-bold text-[10px] px-2 py-1 shadow-sm uppercase tracking-wider flex items-center gap-1 pointer-events-auto',
                progressColor,
              )}
            >
              {progressStatus}
            </Badge>

            {matchCount > 0 &&
              !isLost &&
              demand.status_demanda !== 'atendida' &&
              demand.status_demanda !== 'ganho' && (
                <Badge
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    navigate('/app/match-inteligentes')
                  }}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white border-none font-bold text-[10px] px-2 py-1 shadow-sm cursor-pointer animate-pulse flex items-center gap-1 pointer-events-auto"
                >
                  <Zap className="w-3 h-3 fill-current" /> {matchCount} MATCH
                  {matchCount !== 1 ? 'ES' : ''}
                </Badge>
              )}

            <RespostasBadge respostas={respostasNaoEncontrei} />

            {activeCaptadores.length > 0 && (
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px] font-black px-2 py-1 flex items-center gap-1 shadow-sm border border-purple-200">
                👀 {activeCaptadores.length} captadores buscando - Adicione imóveis ou marque
                visitas
              </Badge>
            )}
          </div>

          {isPending && !isLost && (
            <span
              className={cn(
                'text-[11px] font-black whitespace-nowrap shrink-0 transition-colors duration-200 bg-white px-2 py-0.5 rounded border shadow-sm',
                slaLevel === 'red'
                  ? 'text-[#F44336] border-[#F44336]/30'
                  : slaLevel === 'yellow'
                    ? 'text-[#FF9800] border-[#FF9800]/30'
                    : 'text-[#4CAF50] border-[#4CAF50]/30',
              )}
            >
              {slaText}
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1 relative z-0 pointer-events-none">
          <h3
            className="text-[18px] font-black text-[#1A3A52] leading-tight pr-2 line-clamp-2"
            title={demand.nome_cliente}
          >
            {demand.nome_cliente}
          </h3>

          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-2 text-[14px] text-[#333333]">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="font-medium line-clamp-1" title={demand.bairros?.join(', ')}>
                {demand.bairros?.join(', ') || 'Sem localização'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <DollarSign className="w-5 h-5 text-[#10B981] shrink-0" />
            <span className="text-[20px] font-black text-[#10B981] tracking-tight">
              Até {formatPrice(demand.valor_maximo)}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[12px] font-bold text-[#666666] bg-[#F8FAFC] p-2.5 rounded-lg mt-1 border border-[#E5E5E5] flex-wrap shadow-sm">
            <span className={isHighUrgency ? 'text-[#F44336]' : 'text-[#FF9800]'}>
              Urgência: {demand.nivel_urgencia}
            </span>
            <span className="opacity-50">|</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {timeElapsedText}
            </span>
          </div>

          <div className="flex items-start gap-2.5 bg-[#E8F5E9] text-[#065F46] p-3 rounded-lg text-[13px] mt-1 border border-[#A7F3D0] shadow-sm">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
            <p className="leading-snug font-medium line-clamp-3">
              {demand.observacoes || 'Nenhuma observação específica fornecida.'}
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

            {isPending && !isLost && !isPrioritized && canPrioritize && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 font-bold text-[11px] border-none shadow-sm relative z-10 transition-all bg-[#FCD34D]/20 text-[#B45309] hover:bg-[#FCD34D]/40"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setIsPrioritizeModalOpen(true)
                }}
                disabled={isPrioritizing}
              >
                <Star className="w-3 h-3 mr-1" /> Priorizar
              </Button>
            )}

            {isPrioritized && canPrioritize && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2 font-bold text-[11px] border-none shadow-sm relative z-10 transition-all bg-gray-100 text-gray-600 hover:bg-gray-200"
                onClick={handleDeprioritize}
                disabled={isPrioritizing}
              >
                <Star className="w-3 h-3 mr-1 fill-current" /> Despriorizar
              </Button>
            )}
          </div>

          <RespostasHistory respostas={respostasNaoEncontrei} />

          <div className="pointer-events-auto mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full font-bold text-[#1A3A52] hover:bg-gray-100 text-[11px]"
              onClick={() => setShowTimeline(!showTimeline)}
            >
              {showTimeline ? 'Ocultar' : 'Ver'} Linha do Tempo
            </Button>
            {showTimeline && <DemandLifecycleTimeline demand={demand} />}
          </div>
        </div>

        <div className="px-4 pb-4 pt-2 mt-auto bg-white pointer-events-auto rounded-b-[14px]">
          <Button
            variant="outline"
            className="w-full font-bold border-[#3B82F6]/30 text-[#3B82F6] hover:bg-[#3B82F6]/5 min-h-[44px] mb-2 relative z-10"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMatchModal(true)
            }}
          >
            <Zap className="w-4 h-4 mr-2" /> VISUALIZAR OS MATCHES
            {matchCount > 0 && ` (${matchCount})`}
          </Button>
          {isPending && !isLost && (
            <Button
              variant="outline"
              className="w-full font-bold border-blue-600/30 text-blue-600 hover:bg-blue-50 min-h-[44px] mb-2 relative z-10"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleOpenVisitModal()
              }}
            >
              <Calendar className="w-4 h-4 mr-2" /> Registrar Visita
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2 relative z-10">
            <Button
              variant="outline"
              className="w-full font-bold border-[#2E5F8A]/30 text-[#1A3A52] hover:bg-gray-100 min-h-[44px]"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAction?.('details', demand)
              }}
            >
              Ver Detalhes
            </Button>

            {canMarkLost && (
              <Button
                variant="destructive"
                className="w-full font-bold min-h-[44px]"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowLostModal(true)
                }}
              >
                <X className="w-4 h-4 mr-1.5" /> Perdida
              </Button>
            )}

            {!canMarkLost && (
              <Button
                variant="outline"
                className="w-full font-bold border-[#E5E5E5] text-[#333333] hover:bg-gray-100 min-h-[44px]"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  logSolicitorContactAttempt(demand.id, 'whatsapp', 'Olá')
                  toast({ title: 'Aviso', description: 'Função de contato iniciada.' })
                }}
              >
                <MessageCircle className="w-4 h-4 mr-1.5" /> Contato
              </Button>
            )}
          </div>
        </div>
      </Card>

      <PrioritizeModal
        open={isPrioritizeModalOpen}
        onOpenChange={setIsPrioritizeModalOpen}
        onConfirm={handlePrioritize}
        similarCount={demand.interestedClientsCount || 0}
      />

      <LostModal
        open={showLostModal}
        onOpenChange={setShowLostModal}
        onConfirm={handleLostConfirm}
      />

      <DemandMatchModal demand={demand} open={showMatchModal} onOpenChange={setShowMatchModal} />

      <VisitRegistrationModal
        open={showVisitModal}
        onOpenChange={setShowVisitModal}
        demandId={demand.id || ''}
        tipoDemanda={demand.tipo || ''}
        imovelId={demand.imoveis_captados?.[0]?.id}
        propertyLabel={
          demand.imoveis_captados?.[0]?.endereco || demand.imoveis_captados?.[0]?.localizacao_texto
        }
        linkedProperties={linkedProperties}
      />
    </>
  )
}

export const ExpandableDemandCardSDR = memo(ExpandableDemandCardSDRComponent)
