import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
import { LostModal } from '@/components/LostModal'
import { useSlaCountdown, useTimeElapsed } from '@/hooks/useTimeElapsed'
import { useMatchCount } from '@/hooks/use-match-count'
import { RespostasBadge, RespostasHistory } from './RespostasHistory'
import {
  Building2,
  Home,
  Eye,
  Zap,
  Clock,
  Maximize2,
  MessageCircle,
  X,
  RefreshCw,
} from 'lucide-react'

interface DemandCardProps {
  demand: Demand
  index?: number
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-[4px] pointer-events-none min-w-0">
    <span className="text-[12px] text-[#999999] font-bold uppercase tracking-wider leading-tight truncate">
      {label}
    </span>
    <span className="text-[14px] font-bold text-[#333333] break-words whitespace-normal leading-tight line-clamp-2">
      {value}
    </span>
  </div>
)

export function DemandCard({ demand, index, onAction }: DemandCardProps) {
  const { users, logSolicitorContactAttempt, markDemandLost, currentUser } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
  const navigate = useNavigate()
  const [showLostModal, setShowLostModal] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const prevStatus = useRef(demand.status)
  const [isJustLost, setIsJustLost] = useState(false)
  const [isJustPrioritized, setIsJustPrioritized] = useState(false)

  const creator = users.find((u) => u.id === demand.createdBy)
  const creatorName = creator?.name || 'Desconhecido'

  const { text: timeElapsedText, hoursElapsed } = useTimeElapsed(demand.createdAt)
  const { count: matchCount } = useMatchCount('demanda', demand.id || '')

  // Extrai o prazo real da estrutura mapeada para sincronização em tempo real
  const prazoDb = (demand as any).prazos_captacao?.[0]
  const isPending = demand.status === 'Pendente' || demand.status === 'aberta'

  const {
    text: slaText,
    progress: slaProgress,
    badgeText: slaBadgeText,
    level: slaLevel,
    isExpired,
  } = useSlaCountdown(
    demand.createdAt,
    prazoDb?.prazo_resposta,
    isPending ? 'aberta' : demand.status,
    prazoDb?.prorrogacoes_usadas,
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

  const isSale = demand.type === 'Venda'
  const isLost = demand.status === 'Perdida' || demand.status === 'impossivel'
  const isPrioritized = demand.isPrioritized && !isLost
  const isNew = hoursElapsed <= 24 && isPending && !isLost && !isPrioritized

  const canMarkLost =
    !isLost &&
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'gestor' ||
      (demand.createdBy === currentUser?.id &&
        (currentUser?.role === 'sdr' || currentUser?.role === 'corretor')))

  const canReopen =
    isLost &&
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'gestor' ||
      (demand.createdBy === currentUser?.id &&
        (currentUser?.role === 'sdr' || currentUser?.role === 'corretor')))

  let cardBg = 'bg-[#FFFFFF] border-[#E5E5E5]'
  let headerBg = 'bg-[#F5F5F5]/50 border-[#E5E5E5]'
  if (isLost) {
    cardBg = 'bg-[#F5F5F5] opacity-80 border-[#E5E5E5]'
    headerBg = 'bg-[#E5E5E5] border-[#D4D4D4]'
  } else if (isPrioritized) {
    cardBg = 'bg-[#FFFBEB] border-[#FCD34D]'
    headerBg = 'bg-[#FCD34D]/10 border-[#FCD34D]/50'
  } else if (isNew) {
    cardBg = 'bg-[#F2FBF5] border-[#4CAF50]'
    headerBg = 'bg-[#4CAF50]/10 border-[#4CAF50]/30'
  } else {
    cardBg = 'bg-[#FFFFFF] border-[#E5E5E5] hover:border-[#1A3A52]/30'
  }

  const respostasNaoEncontrei = ((demand as any).respostas_captador || []).filter(
    (r: any) => r.resposta === 'nao_encontrei',
  )

  let statusBadge = null
  if (isLost) {
    statusBadge = (
      <Badge className="bg-[#999999] text-[#FFFFFF] border-none font-bold text-[11px] px-2 py-1 shadow-sm uppercase tracking-wider">
        ⚫ PERDIDA
      </Badge>
    )
  } else if (isPrioritized) {
    statusBadge = (
      <Badge
        className={cn(
          'bg-[#F44336] text-[#FFFFFF] border-none font-bold text-[11px] px-2 py-1 shadow-sm uppercase tracking-wider',
          isJustPrioritized && 'animate-bounce-scale',
        )}
      >
        🔴 PRIORIZADA
      </Badge>
    )
  } else if (isNew) {
    statusBadge = (
      <Badge className="bg-[#4CAF50] text-[#FFFFFF] border-none font-bold text-[11px] px-2 py-1 shadow-sm uppercase tracking-wider animate-pulse flex items-center gap-1">
        <Zap className="w-3.5 h-3.5 fill-current" /> NOVA DEMANDA
      </Badge>
    )
  } else {
    let bgCol = 'bg-[#2E5F8A]'
    let textCol = 'text-[#FFFFFF]'

    if (
      demand.status === 'Captado sob demanda' ||
      demand.status === 'Em Captação' ||
      demand.status === 'atendida'
    ) {
      bgCol = 'bg-[#4CAF50]'
    } else if (demand.status === 'Visita') {
      bgCol = 'bg-[#FF9800]'
    } else if (demand.status === 'Negócio' || demand.status === 'ganho') {
      bgCol = 'bg-[#388E3C]'
    } else if (isPending) {
      if (slaLevel === 'red') bgCol = 'bg-[#F44336]'
      else if (slaLevel === 'yellow') bgCol = 'bg-[#FF9800]'
      else bgCol = 'bg-[#4CAF50]'
    }

    let badgeContent = isPending ? slaBadgeText || '⏳ PENDENTE' : demand.status

    statusBadge = (
      <Badge
        className={cn(
          'border-none text-[11px] uppercase tracking-wider font-bold px-2 py-1 shadow-sm transition-colors duration-300',
          bgCol,
          textCol,
        )}
      >
        {badgeContent}
      </Badge>
    )
  }

  const btnSolid = 'bg-[#10B981] hover:bg-[#059669] text-white border-none'
  const btnSoft =
    'bg-[#F5F5F5] text-[#333333] hover:bg-gray-100 dark:hover:bg-gray-800 border border-[#E5E5E5]'

  let indicatorColor = 'bg-[#4CAF50]'
  if (slaLevel === 'yellow') indicatorColor = 'bg-[#FF9800]'
  else if (slaLevel === 'red') indicatorColor = 'bg-[#F44336]'
  else if (slaLevel === 'orange') indicatorColor = 'bg-[#FF9800]'

  const handleProrrogar = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!prazoDb || isExtending) return
    setIsExtending(true)
    try {
      const currentPrazo = new Date(prazoDb.prazo_resposta)
      currentPrazo.setHours(currentPrazo.getHours() + 48)

      const { error } = await supabase
        .from('prazos_captacao')
        .update({
          prazo_resposta: currentPrazo.toISOString(),
          prorrogacoes_usadas: (prazoDb.prorrogacoes_usadas || 0) + 1,
        })
        .eq('id', prazoDb.id)

      if (error) throw error
    } catch (e: any) {
      toast({ title: 'Erro ao prorrogar', description: e.message, variant: 'destructive' })
    } finally {
      setIsExtending(false)
    }
  }

  const handleReabrir = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isExtending) return
    setIsExtending(true)
    try {
      const table = demand.type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
      const { error } = await supabase
        .from(table)
        .update({ status_demanda: 'aberta' })
        .eq('id', demand.id)
      if (error) throw error

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: { tipo: demand.type, data: { id: demand.id, status_demanda: 'aberta' } },
        }),
      )
      toast({
        title: 'Demanda reaberta!',
        description: 'Sincronizado com os captadores.',
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (e: any) {
      toast({ title: 'Erro ao reabrir', description: e.message, variant: 'destructive' })
    } finally {
      setIsExtending(false)
    }
  }

  const creationDateStr = demand.createdAt
    ? new Date(demand.createdAt).toLocaleDateString('pt-BR')
    : (() => {
        return 'Data pendente'
      })()

  const activeCaptadores = ((demand as any).captadores_busca || []).filter(
    (c: any) => new Date(c.data_clique).getTime() > Date.now() - 24 * 3600000,
  )
  const isMeSearching = activeCaptadores.some((c: any) => c.captador_id === currentUser?.id)
  const captadoresNames = activeCaptadores.map((c: any) => c.nome?.split(' ')[0]).join(' + ')
  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor' ||
    demand.createdBy === currentUser?.id

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full relative h-full flex flex-col"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <Card
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          if (demand.id) {
            navigate(`/demanda/${demand.id}`)
          } else {
            toast({ title: 'Detalhes indisponíveis', variant: 'destructive' })
          }
        }}
        className={cn(
          'w-full h-full flex flex-col rounded-[16px] transition-all duration-200 ease-in-out shadow-sm hover:shadow-[0_8px_24px_rgba(26,58,82,0.12)] relative overflow-visible z-0 border-[2px] cursor-pointer group',
          cardBg,
          isJustPrioritized && 'animate-glow-pulse',
          isJustLost && 'animate-fade-out opacity-0',
        )}
      >
        {/* Header fixo no topo com data e status */}
        <div
          className={cn(
            'px-4 pt-4 pb-3 flex items-start justify-between border-b shrink-0 pointer-events-none relative z-10 rounded-t-[14px]',
            headerBg,
          )}
        >
          <span className="text-[12px] text-[#6B7280] font-sans font-bold bg-white px-2.5 py-1.5 rounded-[6px] border border-[#E5E5E5] shadow-sm flex items-center gap-1.5 pointer-events-auto shrink-0 mr-2">
            📅 {creationDateStr}
          </span>

          <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
            {currentUser?.role === 'captador' && (
              <>
                {activeCaptadores.length > 0 && (
                  <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100 text-[10px] font-black px-2 py-1 flex items-center gap-1 shadow-sm border border-blue-200">
                    🔵 {captadoresNames} - {activeCaptadores[0]?.regiao || 'Região'}
                  </Badge>
                )}

                {!isMeSearching && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-6 text-[10px] font-bold px-2 py-0 border-dashed border-blue-500 text-blue-600 hover:bg-blue-50 z-10 relative pointer-events-auto shadow-sm"
                    onClick={async (e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (isSubmitting) return
                      setIsSubmitting(true)
                      try {
                        const { error } = await supabase.rpc('append_captador_busca', {
                          p_demanda_id: demand.id,
                          p_tipo_demanda: demand.type,
                          p_captador_id: currentUser?.id,
                          p_nome: currentUser?.name || currentUser?.nome || 'Captador',
                          p_regiao: demand.location?.split(',')[0] || 'Região',
                        })

                        if (error) throw error

                        const newEntry = {
                          captador_id: currentUser?.id,
                          nome: currentUser?.name || currentUser?.nome || 'Captador',
                          regiao: demand.location?.split(',')[0] || 'Região',
                          data_clique: new Date().toISOString(),
                        }
                        const currentList = ((demand as any).captadores_busca || []).filter(
                          (c: any) => new Date(c.data_clique).getTime() > Date.now() - 24 * 3600000,
                        )
                        const newList = [
                          ...currentList.filter((c: any) => c.captador_id !== currentUser?.id),
                          newEntry,
                        ]

                        window.dispatchEvent(
                          new CustomEvent('demanda-updated', {
                            detail: {
                              tipo: demand.type,
                              data: { id: demand.id, captadores_busca: newList },
                            },
                          }),
                        )

                        toast({
                          title: 'Busca Iniciada',
                          description:
                            'Você e outros captadores podem buscar imóveis para esta demanda.',
                          className: 'bg-[#10B981] text-white border-none',
                        })
                      } catch (err: any) {
                        toast({
                          title: 'Erro ao atribuir',
                          description: err.message,
                          variant: 'destructive',
                        })
                      } finally {
                        setIsSubmitting(false)
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    🔍 Eu busco este imóvel
                  </Button>
                )}
              </>
            )}

            {isOwnerOrAdmin && activeCaptadores.length > 0 && (
              <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-100 text-[10px] font-black px-2 py-1 flex items-center gap-1 shadow-sm border border-purple-200">
                👀 {activeCaptadores.length} captadores buscando - Adicione imóveis ou marque
                visitas
              </Badge>
            )}

            <RespostasBadge respostas={respostasNaoEncontrei} />
            {matchCount > 0 &&
              !isLost &&
              demand.status !== 'Atendida' &&
              demand.status !== 'ganho' &&
              demand.status !== 'Negócio' && (
                <Badge
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                    navigate('/app/match-inteligentes')
                  }}
                  className="bg-[#3B82F6] hover:bg-[#2563EB] text-white border-none font-bold text-[10px] px-2 py-1 shadow-sm cursor-pointer animate-pulse flex items-center gap-1 pointer-events-auto"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" /> {matchCount} Match
                  {matchCount !== 1 ? 'es' : ''}
                </Badge>
              )}
            <div
              className={cn(
                'flex items-center justify-center px-2 py-1 gap-[4px] rounded-[6px] shadow-sm shrink-0',
                isSale ? 'bg-[#FF9800]' : 'bg-[#1A3A52]',
              )}
            >
              {isSale ? (
                <Building2 className="w-[12px] h-[12px] text-white shrink-0" />
              ) : (
                <Home className="w-[12px] h-[12px] text-white shrink-0" />
              )}
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                {isSale ? 'VENDA' : 'ALUGUEL'}
              </span>
            </div>
            {statusBadge}
          </div>
        </div>

        {/* Conteúdo central */}
        <div className="p-4 flex flex-col gap-[12px] flex-1 relative z-0 pointer-events-none">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
            <h3 className="text-[18px] sm:text-[20px] font-black text-[#1A3A52] break-words whitespace-normal leading-tight group-hover:text-[#2E5F8A] transition-colors pr-2 line-clamp-2 min-w-0">
              {demand.clientName}
            </h3>
            {isPending && !isLost && (
              <span
                className={cn(
                  'text-[14px] font-black whitespace-nowrap shrink-0 transition-colors duration-200 bg-white px-2 py-1 rounded-md border shadow-sm',
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

          {isPending && !isLost && (
            <div className="w-full">
              <Progress
                value={slaProgress}
                className="h-[6px] bg-[#E5E5E5] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                indicatorClassName={indicatorColor}
              />
            </div>
          )}

          <div className="grid grid-cols-1 min-[480px]:grid-cols-2 gap-3 mt-2 bg-[#F8FAFC] p-3 rounded-[12px] border border-[#E5E5E5]">
            <InfoItem
              label="Localização"
              value={
                <span className="line-clamp-2" title={demand.location}>
                  {demand.location}
                </span>
              }
            />
            <InfoItem
              label="Orçamento"
              value={`R$ ${formatPrice(demand.minBudget)} - R$ ${formatPrice(demand.maxBudget)}`}
            />
            <InfoItem
              label="Perfil"
              value={`${demand.bedrooms ?? 0} dorm, ${demand.bathrooms ?? 0} banh, ${demand.parkingSpots ?? 0} vagas`}
            />
            <InfoItem label="Solicitado por" value={creatorName} />
          </div>

          <div className="flex items-center justify-between text-[12px] font-bold text-[#666666] mt-auto pt-2">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" /> Criado {timeElapsedText}
            </span>
            <span className="bg-[#E8F0F8] text-[#1A3A52] px-2 py-1 rounded-md border border-[#2E5F8A]/20">
              📦{' '}
              {demand.capturedProperties?.length || (demand as any).imoveis_captados?.length || 0}{' '}
              imóveis
            </span>
          </div>

          {respostasNaoEncontrei.length > 0 && (
            <div className="mt-2 pointer-events-auto relative z-10">
              <RespostasHistory respostas={respostasNaoEncontrei} />
            </div>
          )}
        </div>

        {/* Rodapé com Botões */}
        <div
          className={cn(
            'flex flex-col lg:flex-row flex-wrap gap-2 px-4 pt-4 pb-4 border-t shrink-0 z-10 relative mt-auto bg-white pointer-events-auto rounded-b-[14px]',
            isLost ? 'border-[#E5E5E5] opacity-80 grayscale' : 'border-[#E5E5E5]',
          )}
        >
          <Button
            className={cn(
              'h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto whitespace-nowrap',
              btnSoft,
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (demand.id) {
                navigate(`/demanda/${demand.id}`)
              } else {
                toast({ title: 'Detalhes indisponíveis', variant: 'destructive' })
              }
            }}
            aria-label={`Ver Detalhes da demanda ${demand.clientName}`}
          >
            <Maximize2 className="w-[16px] h-[16px] mr-1.5" /> Detalhes
          </Button>

          {currentUser?.role === 'captador' && isPending && (
            <>
              {(!isExpired || (prazoDb?.prorrogacoes_usadas || 0) >= 3) && (
                <>
                  <Button
                    className={cn(
                      'h-11 min-h-[44px] flex-1 font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out hover:scale-[1.02] active:shadow-inner relative z-10 w-full lg:w-auto whitespace-nowrap',
                      btnSolid,
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      onAction?.(demand.id, 'encontrei')
                    }}
                    disabled={isLost}
                    aria-label={`Encontrei imóvel para demanda ${demand.clientName}`}
                  >
                    ✅ Encontrei
                  </Button>
                  <Button
                    className="h-11 min-h-[44px] flex-1 font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out hover:scale-[1.02] active:shadow-inner bg-[#EF4444] hover:bg-[#DC2626] text-white border-none relative z-10 w-full lg:w-auto whitespace-nowrap"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const hasAnswered = respostasNaoEncontrei.some(
                        (r: any) => r.captador_id === currentUser?.id,
                      )
                      if (hasAnswered) {
                        toast({
                          title: 'Aviso',
                          description: 'Você já marcou esta demanda como não encontrada.',
                          variant: 'destructive',
                        })
                        return
                      }
                      onAction?.(demand.id, 'nao_encontrei')
                    }}
                    disabled={isLost}
                    aria-label={`Não encontrei imóvel para demanda ${demand.clientName}`}
                  >
                    ❌ Não Encontrei
                  </Button>
                </>
              )}
              {isPending && !isLost && (prazoDb?.prorrogacoes_usadas || 0) < 3 && (
                <Button
                  className="h-11 min-h-[44px] flex-1 font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out hover:scale-[1.02] active:shadow-inner bg-[#3B82F6] hover:bg-[#2563EB] text-white border-none relative z-10 w-full lg:w-auto whitespace-nowrap"
                  onClick={handleProrrogar}
                  disabled={isExtending}
                  aria-label={`Prorrogar Prazo da demanda ${demand.clientName}`}
                >
                  <Clock className="w-[16px] h-[16px] mr-1.5" /> Prorrogar (+48h)
                </Button>
              )}
            </>
          )}

          {!isLost && (
            <Button
              className="h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 bg-white text-[#1A3A52] hover:bg-gray-100 dark:hover:bg-gray-800 border border-[#1A3A52]/30 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                logSolicitorContactAttempt(
                  demand.id,
                  'interno',
                  'Olá, gostaria de falar sobre esta demanda.',
                )
              }}
              aria-label={`Contatar solicitante da demanda ${demand.clientName}`}
            >
              <MessageCircle className="w-[16px] h-[16px] mr-1.5" /> Contato
            </Button>
          )}

          {canMarkLost && (
            <Button
              variant="destructive"
              className="h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                setShowLostModal(true)
              }}
              aria-label={`Marcar demanda ${demand.clientName} como Perdida`}
            >
              <X className="w-[16px] h-[16px] mr-1.5" /> Perdida
            </Button>
          )}

          {canReopen && (
            <Button
              className="h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 transition-all duration-150 bg-[#1A3A52] hover:bg-[#2E5F8A] text-white w-full lg:w-auto shadow-sm"
              onClick={handleReabrir}
              disabled={isExtending}
            >
              <RefreshCw className="w-[16px] h-[16px] mr-1.5" /> Reabrir Demanda
            </Button>
          )}
        </div>
      </Card>

      <DemandDetailsModal open={showDetails} onOpenChange={setShowDetails} demand={demand as any} />

      <LostModal
        open={showLostModal}
        onOpenChange={setShowLostModal}
        onConfirm={async (reason, obs) => {
          try {
            const table = demand.type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
            const { error } = await supabase
              .from(table)
              .update({ status_demanda: 'impossivel' })
              .eq('id', demand.id)

            if (error) throw error

            markDemandLost(demand.id, reason, obs)
            toast({
              title: 'Sucesso',
              description: 'Demanda marcada como perdida com sucesso.',
              className: 'bg-[#10B981] text-white border-none',
            })
          } catch (err: any) {
            toast({
              title: 'Falha ao marcar como perdido',
              description: err.message,
              variant: 'destructive',
            })
            console.error(err)
          }
        }}
      />
    </div>
  )
}
