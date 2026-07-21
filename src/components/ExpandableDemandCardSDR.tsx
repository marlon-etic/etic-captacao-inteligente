import { useState, memo, useMemo, useCallback, lazy } from 'react'
import { LinkText } from '@/lib/link-formatter'
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
  X,
  Search,
  MessageCircle,
  Star,
  Zap,
  Calendar,
  Home,
  Link as LinkIcon,
} from 'lucide-react'
import { useSlaCountdown, useTimeElapsed } from '@/hooks/useTimeElapsed'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { useMatchCount } from '@/hooks/use-match-count'
import { useNavigate } from 'react-router-dom'
import { toggleDemandPriority } from '@/services/priority-service'
import { supabase } from '@/lib/supabase/client'
import type { LinkedProperty } from './VisitRegistrationModal'
import { formatCurrency } from '@/lib/format-utils'
import { LazyModalBoundary } from './LazyModalBoundary'

const PrioritizeModal = lazy(() =>
  import('./PrioritizeModal').then((m) => ({ default: m.PrioritizeModal })),
)
const LostModal = lazy(() => import('./LostModal').then((m) => ({ default: m.LostModal })))
const DemandMatchModal = lazy(() =>
  import('./DemandMatchModal').then((m) => ({ default: m.DemandMatchModal })),
)
const VisitRegistrationModal = lazy(() =>
  import('./VisitRegistrationModal').then((m) => ({ default: m.VisitRegistrationModal })),
)
const DemandLifecycleTimeline = lazy(() =>
  import('./DemandLifecycleTimeline').then((m) => ({ default: m.DemandLifecycleTimeline })),
)
const SugerirLinksModal = lazy(() =>
  import('./SugerirLinksModal').then((m) => ({ default: m.SugerirLinksModal })),
)

function ExpandableDemandCardSDRComponent({
  demand,
  onAction,
  matchCount: matchCountProp,
}: {
  demand: SupabaseDemand
  onAction?: (action: 'details' | 'edit' | 'lost' | 'prioritize', d: SupabaseDemand) => void
  matchCount?: number
}) {
  const { currentUser, logSolicitorContactAttempt } = useAppStore()
  const { toast } = useToast()
  const navigate = useNavigate()
  const { count: individualMatchCount } = useMatchCount(
    'demanda',
    demand.id || '',
    matchCountProp === undefined,
  )
  const matchCount = matchCountProp !== undefined ? matchCountProp : individualMatchCount
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false)
  const [isPrioritizing, setIsPrioritizing] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [showMatchModal, setShowMatchModal] = useState(false)
  const [showVisitModal, setShowVisitModal] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [linkedProperties, setLinkedProperties] = useState<LinkedProperty[]>([])
  const [showLinksModal, setShowLinksModal] = useState(false)

  const canPrioritize = ['sdr', 'admin', 'gestor', 'corretor'].includes(currentUser?.role || '')
  const canAddLinks = currentUser?.role === 'sdr' || currentUser?.role === 'admin'
  const suggestedLinksCount = (demand.links_sugeridos as string[])?.length || 0

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
  }

  if (isDemandGloballyLost(demand.status_demanda)) {
    statusConfig = { label: 'PERDIDA / CANCELADA', bg: 'bg-gray-500' }
  } else if (demand.status_demanda === 'atendida' || demand.status_demanda === 'ganho') {
    statusConfig = {
      label: demand.status_demanda === 'ganho' ? 'NEGÓCIO FECHADO' : 'ATENDIDA',
      bg: demand.status_demanda === 'ganho' ? 'bg-[#388E3C]' : 'bg-blue-500',
    }
  } else if (demand.status_demanda === 'sem_resposta_24h') {
    statusConfig = {
      label: 'SEM RESPOSTA',
      bg: 'bg-yellow-500',
    }
  }

  const formatPrice = useMemo(() => {
    return (val: number) => formatCurrency(val).replace('R$', '').trim()
  }, [])

  const capturedCount = demand.imoveis_captados?.length || 0
  const activeCaptadores = useMemo(
    () =>
      (demand.captadores_busca || []).filter(
        (c: any) => new Date(c.data_clique).getTime() > Date.now() - 24 * 3600000,
      ),
    [demand.captadores_busca],
  )

  let progressStatus = 'AGUARDANDO'
  let progressColor = 'bg-gray-100 text-gray-600 border-gray-200'

  if (capturedCount > 0 || matchCount > 0) {
    progressStatus = 'IMÓVEL PROPOSTO'
    progressColor = 'bg-[#D1FAE5] text-[#065F46] border-none'
  } else if (respostasNaoEncontrei.length > 0) {
    progressStatus = 'SEM OPÇÕES'
    progressColor = 'bg-red-100 text-red-700 border-none'
  } else if (activeCaptadores.length > 0) {
    progressStatus = 'EM BUSCA'
    progressColor = 'bg-blue-100 text-blue-700 border-none'
  } else {
    progressStatus = 'AGUARDANDO'
    progressColor = 'bg-gray-100 text-gray-600 border-none'
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

  const handleLinksSaved = useCallback(
    (links: string[]) => {
      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demand.tipo,
            data: { id: demand.id, links_sugeridos: links },
          },
        }),
      )
      toast({
        title: 'Links Enviados',
        description: 'Os captadores já podem ver os links de referência.',
        className: 'bg-[#10B981] text-white border-none',
      })
    },
    [demand.id, demand.tipo],
  )

  return (
    <>
      <Card
        id={`demand-card-${demand.id}`}
        className={cn(
          'w-full relative overflow-hidden rounded-[16px] border bg-white flex flex-col p-4 sm:p-5 shadow-sm hover:shadow-md transition-all z-0',
          isPrioritized
            ? 'border-[#FCD34D] bg-[#FFFBEB]/30'
            : isNew
              ? 'border-[#4CAF50]/40 bg-[#F2FBF5]/30'
              : isLost
                ? 'bg-[#F5F5F5] opacity-90 border-[#E5E5E5]'
                : 'border-[#E5E5E5]',
        )}
      >
        <div className="flex flex-col gap-2 mb-4 pointer-events-none">
          <div className="flex flex-wrap gap-2">
            {!isPrioritized && (
              <Badge
                className={cn(
                  'text-white font-bold text-[10px] uppercase px-2.5 py-1 flex items-center gap-1 border-none tracking-wider',
                  statusConfig.bg,
                )}
              >
                <Search className="w-3 h-3" /> {statusConfig.label}
              </Badge>
            )}
            {isPrioritized && (
              <Badge className="bg-[#F44336] text-[#FFFFFF] text-[10px] font-bold px-2.5 py-1 flex items-center gap-1 border-none tracking-wider">
                <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
              </Badge>
            )}
            {isNew && !isPrioritized && !isLost && (
              <Badge className="bg-[#4CAF50] text-[#FFFFFF] border-none font-bold text-[10px] px-2.5 py-1 uppercase tracking-wider animate-pulse flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> NOVA DEMANDA
              </Badge>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge
              className={cn(
                'font-bold text-[10px] uppercase px-2.5 py-1 border-none tracking-wider',
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
                  className="bg-[#818CF8] hover:bg-[#6366F1] text-white border-none font-bold text-[10px] px-2.5 py-1 cursor-pointer animate-pulse flex items-center gap-1 pointer-events-auto tracking-wider"
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    setShowMatchModal(true)
                  }}
                >
                  <Zap className="w-3 h-3 fill-current" /> {matchCount} MATCH
                  {matchCount !== 1 ? 'ES' : ''}
                </Badge>
              )}
          </div>

          {isPending && !isLost && (
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge
                variant="outline"
                className={cn(
                  'font-bold text-[11px] px-2.5 py-1 flex items-center gap-1.5 bg-white tracking-wider',
                  slaLevel === 'red'
                    ? 'text-[#F44336] border-[#F44336]/30'
                    : slaLevel === 'yellow'
                      ? 'text-[#FF9800] border-[#FF9800]/30'
                      : 'text-[#4CAF50] border-[#4CAF50]/30',
                )}
              >
                <Clock
                  className={cn(
                    'w-3.5 h-3.5',
                    slaLevel === 'red' ? 'text-red-500 animate-pulse' : 'text-[#4CAF50]',
                  )}
                />{' '}
                {slaText}
              </Badge>
            </div>
          )}
        </div>

        <h3
          className="text-xl sm:text-2xl font-black text-[#1A3A52] leading-tight mb-4 line-clamp-2 pointer-events-auto"
          title={demand.nome_cliente}
        >
          {demand.nome_cliente}
        </h3>

        <div className="flex flex-col gap-2.5 mb-4 pointer-events-none">
          <div className="flex items-start gap-2 text-[14px] sm:text-[15px] text-[#333333]">
            <MapPin className="w-[18px] h-[18px] text-pink-500 shrink-0 mt-0.5" />
            <span className="font-medium line-clamp-2">
              {demand.bairros?.join(', ') || 'Sem localização'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[14px] sm:text-[15px] text-[#333333]">
            <Home className="w-[18px] h-[18px] text-[#1A3A52] shrink-0" />
            <span className="font-medium">{demand.tipo_imovel || 'Imóvel Residencial'}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-5 pointer-events-none">
          <DollarSign className="w-6 h-6 text-[#10B981] shrink-0" />
          <span className="text-[24px] sm:text-[28px] font-black text-[#10B981] tracking-tight">
            Até R$ {formatPrice(demand.valor_maximo)}
          </span>
        </div>

        <div className="border border-gray-100 bg-white rounded-[10px] p-3.5 flex flex-wrap items-center gap-y-2 text-[13px] sm:text-[14px] font-bold text-gray-500 mb-4 shadow-sm pointer-events-none">
          <span className={cn(isHighUrgency ? 'text-[#F44336]' : 'text-[#FF9800]')}>
            Urgência: {demand.nivel_urgencia}
          </span>
          <span className="mx-3 opacity-30 hidden sm:inline">|</span>
          <span className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <Clock className="w-4 h-4" /> {timeElapsedText}
          </span>
        </div>

        <div className="border border-emerald-100 bg-[#F0FDF4] rounded-[10px] p-3.5 flex items-start gap-2.5 text-[13px] sm:text-[14px] text-emerald-800 mb-5 shadow-sm pointer-events-auto">
          <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
          <p className="font-medium leading-snug line-clamp-3">
            <LinkText
              text={demand.observacoes || 'Nenhuma observação específica fornecida.'}
              linkClassName="text-[#2E5F8A] hover:underline"
            />
          </p>
        </div>

        <div className="flex items-center justify-between mb-6 pointer-events-auto">
          <Badge
            variant="outline"
            className="text-gray-500 font-bold border-gray-200 bg-white px-3 py-1 text-[11px] sm:text-[12px]"
          >
            {capturedCount} imóveis captados
          </Badge>
          {isPending && !isLost && !isPrioritized && canPrioritize && (
            <Button
              variant="secondary"
              size="sm"
              className="bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#B45309] font-bold h-8 text-[12px] px-3 shadow-sm border border-[#FCD34D]/50 transition-colors"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setIsPrioritizeModalOpen(true)
              }}
              disabled={isPrioritizing}
            >
              <Star className="w-3.5 h-3.5 mr-1.5" /> Priorizar
            </Button>
          )}
          {isPrioritized && canPrioritize && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-3 font-bold text-[12px] shadow-sm transition-all bg-white text-gray-600 hover:bg-gray-100"
              onClick={handleDeprioritize}
              disabled={isPrioritizing}
            >
              <Star className="w-3.5 h-3.5 mr-1.5 fill-current" /> Despriorizar
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 mt-auto pt-2 pointer-events-auto">
          <Button
            variant="ghost"
            className="font-bold text-[#1A3A52] hover:bg-gray-50 text-[13px] h-9 w-max mx-auto"
            onClick={() => setShowTimeline(!showTimeline)}
          >
            {showTimeline ? 'Ocultar Linha do Tempo' : 'Ver Linha do Tempo'}
          </Button>
          {showTimeline && (
            <LazyModalBoundary>
              <DemandLifecycleTimeline demand={demand} />
            </LazyModalBoundary>
          )}

          {canAddLinks && (
            <Button
              variant="outline"
              className="w-full font-bold border-gray-200 text-[#1A3A52] hover:bg-gray-50 text-[13px] sm:text-[14px] h-[44px] sm:h-[48px] shadow-sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowLinksModal(true)
              }}
            >
              <LinkIcon className="w-4 h-4 mr-2" />
              {suggestedLinksCount > 0
                ? `Links Adicionados (${suggestedLinksCount})`
                : 'Adicionar Links'}
            </Button>
          )}

          <Button
            variant="outline"
            className="w-full font-bold border-[#818CF8]/40 text-[#6366F1] hover:bg-[#EEF2FF] text-[13px] sm:text-[14px] h-[44px] sm:h-[48px] uppercase tracking-wide shadow-sm"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setShowMatchModal(true)
            }}
          >
            <Zap className="w-4 h-4 mr-2" /> VISUALIZAR OS MATCHES{' '}
            {matchCount > 0 && `(${matchCount})`}
          </Button>

          {isPending && !isLost && (
            <Button
              variant="outline"
              className="w-full font-bold border-blue-200 text-blue-600 hover:bg-blue-50 text-[13px] sm:text-[14px] h-[44px] sm:h-[48px] shadow-sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                handleOpenVisitModal()
              }}
            >
              <Calendar className="w-4 h-4 mr-2" /> Registrar Visita
            </Button>
          )}

          <div className="grid grid-cols-2 gap-3 mt-1">
            <Button
              variant="outline"
              className="w-full font-bold border-gray-200 text-[#1A3A52] hover:bg-gray-50 text-[13px] sm:text-[14px] h-[44px] sm:h-[48px] shadow-sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAction?.('details', demand)
              }}
            >
              Ver Detalhes
            </Button>

            {canMarkLost ? (
              <Button
                variant="destructive"
                className="w-full font-bold bg-[#EF4444] hover:bg-[#DC2626] text-white text-[13px] sm:text-[14px] h-[44px] sm:h-[48px] shadow-sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  setShowLostModal(true)
                }}
              >
                <X className="w-4 h-4 mr-2" /> Perdida
              </Button>
            ) : (
              <Button
                variant="outline"
                className="w-full font-bold border-[#E5E5E5] text-[#333333] hover:bg-gray-100 min-h-[44px] sm:h-[48px]"
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

      <LazyModalBoundary>
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
            demand.imoveis_captados?.[0]?.endereco ||
            demand.imoveis_captados?.[0]?.localizacao_texto
          }
          linkedProperties={linkedProperties}
        />

        <SugerirLinksModal
          demanda={{
            id: demand.id,
            tipo: demand.tipo,
            links_sugeridos: demand.links_sugeridos as string[] | null,
          }}
          open={showLinksModal}
          onOpenChange={setShowLinksModal}
          onSuccess={handleLinksSaved}
        />
      </LazyModalBoundary>
    </>
  )
}

export const ExpandableDemandCardSDR = memo(ExpandableDemandCardSDRComponent, (prev, next) => {
  return (
    prev.demand?.id === next.demand?.id &&
    prev.demand?.updated_at === next.demand?.updated_at &&
    prev.demand?.status_demanda === next.demand?.status_demanda &&
    prev.demand?.is_prioritaria === next.demand?.is_prioritaria &&
    prev.matchCount === next.matchCount &&
    JSON.stringify(prev.demand?.links_sugeridos) === JSON.stringify(next.demand?.links_sugeridos)
  )
})
