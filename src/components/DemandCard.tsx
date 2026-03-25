import { useState, useEffect, useRef } from 'react'
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
import { Building2, Home, Eye, Zap, Clock, Maximize2, MessageCircle, X } from 'lucide-react'

interface DemandCardProps {
  demand: Demand
  index?: number
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-[4px] pointer-events-none">
    <span className="text-[12px] text-[#999999] font-bold uppercase tracking-wider leading-tight">
      {label}
    </span>
    <span className="text-[14px] font-bold text-[#333333] break-words whitespace-normal leading-tight">
      {value}
    </span>
  </div>
)

export function DemandCard({ demand, index, onAction }: DemandCardProps) {
  const { users, logSolicitorContactAttempt, markDemandLost, currentUser } = useAppStore()
  const [showDetails, setShowDetails] = useState(false)
  const [showLostModal, setShowLostModal] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const prevStatus = useRef(demand.status)
  const [isJustLost, setIsJustLost] = useState(false)
  const [isJustPrioritized, setIsJustPrioritized] = useState(false)

  const creator = users.find((u) => u.id === demand.createdBy)
  const creatorName = creator?.name || 'Desconhecido'

  const { text: timeElapsedText, hoursElapsed } = useTimeElapsed(demand.createdAt)

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

  const latestNaoEncontrei = (demand as any).respostas_captador
    ?.filter((r: any) => r.resposta === 'nao_encontrei')
    .sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]

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
      if (latestNaoEncontrei) {
        if (latestNaoEncontrei.motivo === 'Buscando outras opções') {
          bgCol = 'bg-[#FF9800]'
        } else {
          bgCol = 'bg-[#EF4444]'
        }
      } else {
        if (slaLevel === 'red') bgCol = 'bg-[#F44336]'
        else if (slaLevel === 'yellow') bgCol = 'bg-[#FF9800]'
        else bgCol = 'bg-[#4CAF50]'
      }
    }

    let badgeContent = isPending ? slaBadgeText || '⏳ PENDENTE' : demand.status

    if (isPending && latestNaoEncontrei) {
      if (latestNaoEncontrei.motivo === 'Buscando outras opções') {
        badgeContent = '🟠 BUSCANDO'
      } else {
        badgeContent = `🔴 NÃO ENCONTRADO`
      }
    }

    statusBadge = (
      <Badge
        className={cn(
          'border-none text-[11px] uppercase tracking-wider font-bold px-2 py-1 shadow-sm transition-colors duration-300',
          bgCol,
          textCol,
        )}
        title={
          latestNaoEncontrei?.observacao
            ? `Observação: ${latestNaoEncontrei.observacao}`
            : undefined
        }
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
    if (import.meta.env.DEV) {
      console.log(`Botão [prorrogar] clicado em [DemandCard]`, { id: demand.id })
    }
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

  const creationDateStr = demand.createdAt
    ? new Date(demand.createdAt).toLocaleDateString('pt-BR')
    : (() => {
        if (import.meta.env.DEV) console.error(`Data ausente em card demanda [${demand.id}]`)
        return 'Data pendente'
      })()

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full relative h-full flex flex-col"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <Card
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          setShowDetails(true)
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
          <span className="text-[12px] text-[#6B7280] font-sans font-bold bg-white px-2.5 py-1.5 rounded-[6px] border border-[#E5E5E5] shadow-sm flex items-center gap-1.5 pointer-events-auto">
            📅 {creationDateStr}
          </span>

          <div className="flex items-center gap-2 pointer-events-auto flex-wrap justify-end">
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
            <h3 className="text-[20px] font-black text-[#1A3A52] break-words whitespace-normal leading-tight group-hover:text-[#2E5F8A] transition-colors pr-2">
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
            <InfoItem label="Localização" value={demand.location} />
            <InfoItem
              label="Orçamento"
              value={`R$ ${formatPrice(demand.minBudget)} - R$ ${formatPrice(demand.maxBudget)}`}
            />
            <InfoItem
              label="Perfil"
              value={`${demand.bedrooms || 0} dorm, ${demand.bathrooms || 0} banh, ${demand.parkingSpots || 0} vagas`}
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
              'h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto',
              btnSoft,
            )}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (import.meta.env.DEV) {
                console.log(`Botão [detalhes] clicado em [DemandCard]`, { id: demand.id })
              }
              setShowDetails(true)
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
                      'h-11 min-h-[44px] flex-1 font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out hover:scale-[1.02] active:shadow-inner relative z-10 w-full lg:w-auto',
                      btnSolid,
                    )}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (import.meta.env.DEV) {
                        console.log(`Botão [encontrei] clicado em [DemandCard]`, { id: demand.id })
                      }
                      onAction?.(demand.id, 'encontrei')
                    }}
                    disabled={isLost}
                    aria-label={`Encontrei imóvel para demanda ${demand.clientName}`}
                  >
                    ✅ Encontrei
                  </Button>
                  <Button
                    className="h-11 min-h-[44px] flex-1 font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out hover:scale-[1.02] active:shadow-inner bg-[#EF4444] hover:bg-[#DC2626] text-white border-none relative z-10 w-full lg:w-auto"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (import.meta.env.DEV) {
                        console.log(`Botão [nao_encontrei] clicado em [DemandCard]`, {
                          id: demand.id,
                        })
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
                  className="h-11 min-h-[44px] flex-1 font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out hover:scale-[1.02] active:shadow-inner bg-[#3B82F6] hover:bg-[#2563EB] text-white border-none relative z-10 w-full lg:w-auto"
                  onClick={handleProrrogar}
                  disabled={isExtending}
                  aria-label={`Prorrogar Prazo da demanda ${demand.clientName}`}
                >
                  <Clock className="w-[16px] h-[16px] mr-1.5" /> Prorrogar (+48h)
                </Button>
              )}
            </>
          )}

          <Button
            className="h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 bg-white text-[#1A3A52] hover:bg-gray-100 dark:hover:bg-gray-800 border border-[#1A3A52]/30 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (import.meta.env.DEV) {
                console.log(`Botão [contato] clicado em [DemandCard]`, { id: demand.id })
              }
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

          {canMarkLost && (
            <Button
              variant="destructive"
              className="h-11 min-h-[44px] flex-1 font-bold text-[13px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (import.meta.env.DEV) {
                  console.log(`Botão [lost_modal] clicado em [DemandCard]`, { id: demand.id })
                }
                setShowLostModal(true)
              }}
              aria-label={`Marcar demanda ${demand.clientName} como Perdida`}
            >
              <X className="w-[16px] h-[16px] mr-1.5" /> Perdida
            </Button>
          )}
        </div>
      </Card>

      <DemandDetailsModal open={showDetails} onOpenChange={setShowDetails} demand={demand as any} />

      <LostModal
        open={showLostModal}
        onOpenChange={setShowLostModal}
        onConfirm={(reason, obs) => markDemandLost(demand.id, reason, obs)}
      />
    </div>
  )
}
