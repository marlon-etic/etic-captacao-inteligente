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
import { Building2, Home, Eye, Zap, Clock } from 'lucide-react'

interface DemandCardProps {
  demand: Demand
  index?: number
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col gap-[4px] pointer-events-none">
    <span className="text-[12px] text-[#333333] leading-tight font-medium">{label}</span>
    <span className="text-[16px] font-bold text-[#1A3A52] break-words whitespace-normal leading-tight">
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

  let cardBg = 'bg-[#FFFFFF]'
  if (isLost) cardBg = 'bg-[#F5F5F5] opacity-80'
  else if (isPrioritized) cardBg = 'bg-[#ffebee]'
  else if (isNew) cardBg = 'bg-[#e8f5e9] border-[#4CAF50]'

  const latestNaoEncontrei = (demand as any).respostas_captador
    ?.filter((r: any) => r.resposta === 'nao_encontrei')
    .sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]

  let statusBadge = null
  if (isLost) {
    statusBadge = (
      <Badge className="bg-[#999999] text-[#FFFFFF] border-none font-bold text-[12px] min-h-[28px] py-1 px-3 shadow-md">
        ⚫ PERDIDA
      </Badge>
    )
  } else if (isPrioritized) {
    statusBadge = (
      <Badge
        className={cn(
          'bg-[#F44336] text-[#FFFFFF] border-none font-bold text-[12px] min-h-[28px] py-1 px-3 shadow-md',
          isJustPrioritized && 'animate-bounce-scale',
        )}
      >
        🔴 PRIORIZADA
      </Badge>
    )
  } else if (isNew) {
    statusBadge = (
      <Badge className="bg-[#4CAF50] text-[#FFFFFF] border-none font-bold text-[12px] min-h-[28px] py-1 px-3 shadow-lg animate-pulse flex items-center gap-1">
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

    let badgeContent = isPending ? slaBadgeText || '⏳ Pendente' : demand.status

    if (isPending && latestNaoEncontrei) {
      if (latestNaoEncontrei.motivo === 'Buscando outras opções') {
        badgeContent = '🟠 Buscando outras opções'
      } else {
        badgeContent = `🔴 Não encontrado: ${latestNaoEncontrei.motivo}`
      }
    }

    statusBadge = (
      <Badge
        className={cn(
          'border-none text-[12px] font-bold min-h-[28px] py-1 px-3 shadow-md transition-colors duration-300',
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

  const btnSolid = 'bg-[#1A3A52] hover:bg-[#2E5F8A] text-white border-none'
  const btnSoft = 'bg-[#F5F5F5] text-[#333333] hover:bg-[#FFFFFF] border-[2px] border-[#2E5F8A]'

  let indicatorColor = 'bg-[#4CAF50]'
  if (slaLevel === 'yellow') indicatorColor = 'bg-[#FF9800]'
  else if (slaLevel === 'red') indicatorColor = 'bg-[#F44336]'
  else if (slaLevel === 'orange') indicatorColor = 'bg-[#FF9800]'

  const handleProrrogar = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`🔘 [Click] DemandCard Action: prorrogar`, { id: demand.id })
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
      // The Real-time subscription will trigger the toast and UI update instantly
    } catch (e: any) {
      toast({ title: 'Erro ao prorrogar', description: e.message, variant: 'destructive' })
    } finally {
      setIsExtending(false)
    }
  }

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full relative h-full flex"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <Card
        className={cn(
          'w-full h-full p-[16px] flex flex-col rounded-[12px] transition-all duration-300 ease-in-out shadow-[0_4px_12px_rgba(26,58,82,0.1)] hover:shadow-[0_8px_24px_rgba(26,58,82,0.15)] relative overflow-hidden z-0',
          cardBg,
          isJustPrioritized && 'animate-glow-pulse',
          isJustLost && 'animate-fade-out opacity-0',
          'border-[2px]',
          !isNew && !isPrioritized && !isLost && 'border-[#2E5F8A]',
          'min-h-[auto] min-[480px]:min-h-[200px] md:min-h-[220px] min-[1440px]:min-h-[240px]',
        )}
      >
        {isJustLost && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-[#999999] absolute animate-confetti-burst"
                style={
                  {
                    '--tx': `${(Math.random() - 0.5) * 150}px`,
                    '--ty': `${(Math.random() - 0.5) * 150}px`,
                    animationDelay: `${Math.random() * 50}ms`,
                  } as React.CSSProperties
                }
              />
            ))}
          </div>
        )}

        <div className="flex justify-between items-start mb-4 gap-2 z-0 relative pointer-events-none">
          <div
            className={cn(
              'flex items-center justify-start px-3 py-1.5 gap-[6px] rounded-[6px] shadow-[0_2px_4px_rgba(26,58,82,0.1)] shrink-0 overflow-hidden min-h-[28px]',
              isSale ? 'bg-[#FF9800]' : 'bg-[#1A3A52]',
            )}
          >
            {isSale ? (
              <Building2 className="w-[16px] h-[16px] text-white shrink-0" />
            ) : (
              <Home className="w-[16px] h-[16px] text-white shrink-0" />
            )}
            <span className="text-[12px] font-bold text-white leading-none tracking-tight whitespace-normal break-words">
              {isSale ? 'VENDA' : 'ALUGUEL'}
            </span>
          </div>

          <div className="flex items-center justify-end flex-wrap gap-2">
            {!isLost && !isPrioritized && !isNew && isPending && !isExpired && (
              <Badge className="bg-[#4CAF50] text-[#FFFFFF] hover:bg-[#388E3C] border-none text-[12px] font-bold whitespace-normal break-words text-center min-h-[28px] py-1 px-3 shadow-sm">
                🟢 Ativa
              </Badge>
            )}
            {statusBadge}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start pb-4 z-0 relative pointer-events-none">
          <h3 className="text-[20px] font-bold text-[#1A3A52] break-words whitespace-normal leading-tight m-0 pr-2">
            {demand.clientName}
          </h3>
          {isPending && !isLost && (
            <span
              className={cn(
                'text-[16px] font-bold whitespace-normal mt-2 sm:mt-0 break-words transition-colors duration-200',
                slaLevel === 'red'
                  ? 'text-[#F44336]'
                  : slaLevel === 'yellow'
                    ? 'text-[#FF9800]'
                    : 'text-[#4CAF50]',
              )}
            >
              {slaText}
            </span>
          )}
        </div>

        {isPending && !isLost && (
          <div className="pb-4 z-0 relative pointer-events-none">
            <Progress
              value={slaProgress}
              className="h-[8px] bg-[#F5F5F5] shadow-[inset_0_1px_2px_rgba(26,58,82,0.1)]"
              indicatorClassName={indicatorColor}
            />
          </div>
        )}

        <div
          className={cn(
            'grid grid-cols-1 min-[480px]:grid-cols-2 gap-[16px] py-4 border-t flex-1 z-0 relative transition-colors duration-300 pointer-events-none',
            isLost ? 'border-[#999999]/30' : isNew ? 'border-[#4CAF50]/20' : 'border-[#2E5F8A]/20',
          )}
        >
          <InfoItem label="👤 Cliente" value={demand.clientName} />
          <InfoItem label="👤 Solicitado por" value={creatorName} />
          <InfoItem label="📍 Localização" value={demand.location} />
          <InfoItem
            label="💰 Orçamento"
            value={`R$ ${formatPrice(demand.minBudget)} - R$ ${formatPrice(demand.maxBudget)}`}
          />
          <InfoItem
            label="🏠 Perfil"
            value={`${demand.bedrooms || 0} dorm, ${demand.bathrooms || 0} banh, ${demand.parkingSpots || 0} vagas`}
          />
          <InfoItem label="⚡ Urgência" value={demand.timeframe} />
          <InfoItem label="📅 Criado há" value={timeElapsedText} />
          <InfoItem
            label="📦 Imóveis"
            value={`${demand.capturedProperties?.length || (demand as any).imoveis_captados?.length || 0} imóveis`}
          />
        </div>

        <div
          className={cn(
            'flex flex-col gap-[8px] pt-4 mt-auto border-t shrink-0 z-10 relative transition-colors duration-300',
            isLost
              ? 'border-[#999999]/30 opacity-80 grayscale'
              : isNew
                ? 'border-[#4CAF50]/20'
                : 'border-[#2E5F8A]/20',
          )}
        >
          <div className="flex flex-col xl:flex-row gap-[8px] w-full">
            <Button
              className={cn(
                'min-h-[44px] w-full xl:w-auto flex-1 font-bold whitespace-normal break-words text-[14px] relative z-10',
                btnSoft,
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (import.meta.env.DEV) {
                  console.log(`🔘 [Click] DemandCard Action: details`, { id: demand.id })
                }
                setShowDetails(true)
              }}
            >
              <Eye className="w-4 h-4 mr-2" /> Ver Detalhes
            </Button>

            {currentUser?.role === 'captador' && isPending && (
              <div className="flex flex-col sm:flex-row gap-[8px] w-full xl:w-auto flex-1">
                {(!isExpired || (prazoDb?.prorrogacoes_usadas || 0) >= 3) && (
                  <>
                    <Button
                      className={cn(
                        'min-h-[44px] flex-1 font-bold whitespace-normal break-words text-[14px] px-2 shadow-md transition-transform hover:scale-[1.02] relative z-10',
                        btnSolid,
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (import.meta.env.DEV) {
                          console.log(`🔘 [Click] DemandCard Action: encontrei`, { id: demand.id })
                        }
                        onAction?.(demand.id, 'encontrei')
                      }}
                      disabled={isLost}
                    >
                      ✅ Encontrei
                    </Button>
                    <Button
                      className={cn(
                        'min-h-[44px] flex-1 font-bold whitespace-normal break-words text-[14px] px-2 shadow-md transition-transform hover:scale-[1.02] bg-[#EF4444] hover:bg-[#DC2626] text-white border-none relative z-10',
                      )}
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (import.meta.env.DEV) {
                          console.log(`🔘 [Click] DemandCard Action: nao_encontrei`, {
                            id: demand.id,
                          })
                        }
                        onAction?.(demand.id, 'nao_encontrei')
                      }}
                      disabled={isLost}
                    >
                      ❌ Não Encontrei
                    </Button>
                  </>
                )}
                {isPending && !isLost && (prazoDb?.prorrogacoes_usadas || 0) < 3 && (
                  <Button
                    className={cn(
                      'min-h-[44px] flex-1 font-bold whitespace-normal break-words text-[14px] px-2 shadow-md transition-transform hover:scale-[1.02] bg-[#3B82F6] hover:bg-[#2563EB] text-white border-none relative z-10',
                    )}
                    onClick={handleProrrogar}
                    disabled={isExtending}
                  >
                    <Clock className="w-4 h-4 mr-1.5" /> Prorrogar (+48h)
                  </Button>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-row w-full gap-[8px]">
            <Button
              className={cn(
                'min-h-[44px] flex-1 font-bold whitespace-normal break-words text-[14px] relative z-10',
                'bg-transparent text-[#1A3A52] hover:bg-[#F5F5F5] border-[2px] border-[#1A3A52]',
              )}
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                if (import.meta.env.DEV) {
                  console.log(`🔘 [Click] DemandCard Action: contato`, { id: demand.id })
                }
                logSolicitorContactAttempt(
                  demand.id,
                  'interno',
                  'Olá, gostaria de falar sobre esta demanda.',
                )
              }}
            >
              💬 Contato
            </Button>
            {canMarkLost && (
              <Button
                variant="destructive"
                className="min-h-[44px] flex-1 font-bold whitespace-normal break-words text-[14px] relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`🔘 [Click] DemandCard Action: lost modal`, { id: demand.id })
                  }
                  setShowLostModal(true)
                }}
              >
                ❌ Perdida
              </Button>
            )}
          </div>
        </div>
      </Card>

      <DemandDetailsModal open={showDetails} onOpenChange={setShowDetails} demand={demand} />

      <LostModal
        open={showLostModal}
        onOpenChange={setShowLostModal}
        onConfirm={(reason, obs) => markDemandLost(demand.id, reason, obs)}
      />
    </div>
  )
}
