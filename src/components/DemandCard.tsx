import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

import { LostModal } from '@/components/LostModal'
import { useSlaCountdown, useTimeElapsed } from '@/hooks/useTimeElapsed'
import { RespostasBadge } from './RespostasHistory'
import {
  MapPin,
  Home,
  DollarSign,
  Clock,
  Info,
  Star,
  RefreshCw,
  MessageCircle,
  Maximize2,
} from 'lucide-react'
import { PrioritizeModal } from '@/components/PrioritizeModal'
import { toggleDemandPriority } from '@/services/priority-service'
import { markDemandAsLost } from '@/services/lost-demand-service'
import { DemandLifecycleTimeline } from '@/components/DemandLifecycleTimeline'

interface DemandCardProps {
  demand: Demand
  index?: number
  isNewDemand?: boolean
  showActions?: boolean
  onAction?: (id: string, type: 'encontrei' | 'nao_encontrei') => void
}

export const DemandCard = React.memo(function DemandCard({
  demand,
  index,
  onAction,
}: DemandCardProps) {
  const { users, logSolicitorContactAttempt, currentUser } = useAppStore()
  const navigate = useNavigate()
  const [showLostModal, setShowLostModal] = useState(false)
  const [isExtending, setIsExtending] = useState(false)
  const prevStatus = useRef(demand.status)
  const [isJustLost, setIsJustLost] = useState(false)
  const [isPrioritizeModalOpen, setIsPrioritizeModalOpen] = useState(false)
  const [isPrioritizing, setIsPrioritizing] = useState(false)

  const { hoursElapsed } = useTimeElapsed(demand.createdAt)
  const prazoDb = (demand as any).prazos_captacao?.[0]
  const isPending =
    demand.status === 'Pendente' ||
    demand.status === 'aberta' ||
    demand.status === 'sem_resposta_24h' ||
    demand.status === 'em busca' ||
    demand.status === 'em_busca'

  const { text: slaText, isExpired } = useSlaCountdown(
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
    prevStatus.current = demand.status
  }, [demand.status])

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const isSale = demand.type === 'Venda'
  const isLost =
    demand.status === 'Perdida' ||
    demand.status === 'impossivel' ||
    demand.status === 'perdida' ||
    demand.status === 'PERDIDA_BAIXA'

  const canPrioritize =
    !isLost &&
    (currentUser?.role === 'admin' ||
      currentUser?.role === 'gestor' ||
      (demand.createdBy === currentUser?.id &&
        (currentUser?.role === 'sdr' || currentUser?.role === 'corretor')))

  const handleTogglePriority = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isPrioritizing) return
    if (demand.isPrioritized) {
      setIsPrioritizing(true)
      try {
        const { error } = await toggleDemandPriority(demand.id, isSale ? 'Venda' : 'Aluguel', true)
        if (error) throw error
        window.dispatchEvent(
          new CustomEvent('demanda-updated', {
            detail: {
              tipo: demand.type,
              data: { id: demand.id, is_prioritaria: false },
            },
          }),
        )
        toast({ title: 'Prioridade Removida', description: 'A demanda voltou à posição normal.' })
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível remover a prioridade.',
          variant: 'destructive',
        })
      } finally {
        setIsPrioritizing(false)
      }
    } else {
      setIsPrioritizeModalOpen(true)
    }
  }

  const handlePrioritizeConfirm = async (reason: string) => {
    setIsPrioritizing(true)
    try {
      const { error } = await toggleDemandPriority(
        demand.id,
        isSale ? 'Venda' : 'Aluguel',
        false,
        reason,
      )
      if (error) throw error
      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demand.type,
            data: { id: demand.id, is_prioritaria: true, motivo_priorizacao: reason },
          },
        }),
      )
      toast({
        title: '⭐ Demanda Priorizada',
        description: 'A demanda subiu para o topo do feed dos captadores.',
        className: 'bg-[#FCD34D] text-[#854D0E] border-none',
      })
    } catch {
      toast({
        title: 'Erro',
        description: 'Não foi possível priorizar a demanda.',
        variant: 'destructive',
      })
    } finally {
      setIsPrioritizing(false)
    }
  }

  const cardBg = isLost ? 'bg-[#F5F5F5] opacity-80' : 'bg-[#F6FAF7]'

  const capturedCount =
    demand.capturedProperties?.length || (demand as any).imoveis_captados?.length || 0

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

  const horasTexto = hoursElapsed === 1 ? 'Há 1 hora' : `Há ${hoursElapsed} horas`

  return (
    <div
      className="opacity-0 animate-cascade-fade w-full"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      <div
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('a'))
            return
          navigate(`/demanda/${demand.id}`)
        }}
        className={cn(
          'w-full flex flex-col rounded-[24px] border border-[#E5E5E5] p-6 shadow-sm transition-all duration-200 hover:shadow-md relative overflow-hidden cursor-pointer',
          cardBg,
          isJustLost && 'animate-fade-out opacity-0',
        )}
      >
        {/* Header - Timer */}
        {isPending && !isLost && (
          <div className="flex items-center mb-4">
            <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E5] px-3 py-1.5 rounded-[8px] shadow-sm">
              <Clock className="w-4 h-4 text-[#E53935]" />
              <span className="text-[13px] font-black text-[#2E7D32] tracking-wide">{slaText}</span>
            </div>
          </div>
        )}

        {/* Title */}
        <h2 className="text-[28px] font-black text-[#1A3A52] leading-tight mb-5 break-words">
          {demand.clientName}
        </h2>

        {/* Location & Property Type */}
        <div className="flex flex-col gap-3 mb-6">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-[#E53935] shrink-0 mt-0.5" />
            <span className="text-[16px] font-medium text-[#4A5568] leading-snug line-clamp-2">
              {demand.location || 'Localização não informada'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Home className="w-5 h-5 text-[#4A5568] shrink-0" />
            <span className="text-[16px] font-medium text-[#4A5568]">
              {(demand as any).tipo_imovel || 'Apartamento'}
            </span>
          </div>
        </div>

        {/* Budget */}
        <div className="flex items-center gap-3 mb-8">
          <DollarSign className="w-8 h-8 text-[#4CAF50]" />
          <span className="text-[34px] font-black text-[#4CAF50] leading-none tracking-tight">
            Até R$ {formatPrice(demand.maxBudget)}
          </span>
        </div>

        {/* Status Boxes */}
        <div className="flex flex-col gap-3.5 mb-8 pointer-events-auto">
          {/* Urgency Box */}
          <div className="flex items-center gap-3 bg-white border border-[#E2E8F0] px-5 py-4 rounded-[14px] shadow-sm">
            <span className="text-[15px] font-bold text-[#FF9800]">
              Urgência: {demand.nivel_urgencia || 'Média'}
            </span>
            <div className="w-[1px] h-4 bg-[#E2E8F0]" />
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#718096]" />
              <span className="text-[15px] font-bold text-[#718096]">{horasTexto}</span>
            </div>
          </div>

          {/* Observations Box */}
          <div className="flex items-start gap-3 bg-[#F0FDF4] border border-[#DCFCE7] px-5 py-4 rounded-[14px] shadow-sm">
            <Info className="w-5 h-5 text-[#22C55E] shrink-0 mt-0.5" />
            <span className="text-[15px] font-medium text-[#166534] leading-snug">
              {demand.description ||
                demand.observacoes ||
                'Nenhuma observação específica fornecida.'}
            </span>
          </div>
        </div>

        {/* Action Row - Counter & Prioritize */}
        <div className="flex items-center justify-between gap-4 mb-4 flex-wrap pointer-events-auto">
          <Badge
            variant="outline"
            className="bg-white border-[#E2E8F0] text-[#4A5568] text-[14px] font-bold px-4 py-2 shadow-sm h-[42px] flex items-center justify-center"
          >
            {capturedCount} imóveis captados
          </Badge>

          {canPrioritize && (
            <Button
              className={cn(
                'h-[42px] font-bold text-[14px] px-5 rounded-[10px] shadow-sm transition-all flex items-center justify-center gap-2',
                demand.isPrioritized
                  ? 'bg-[#FFF3D6] text-[#B45309] border border-[#FDE68A] hover:bg-[#FDE68A]'
                  : 'bg-[#FFFBF0] text-[#D97706] border border-[#FEF3C7] hover:bg-[#FEF3C7]',
              )}
              onClick={handleTogglePriority}
              disabled={isPrioritizing}
            >
              <Star className={cn('w-4 h-4', demand.isPrioritized && 'fill-current')} />
              {demand.isPrioritized ? 'Priorizado' : 'Priorizar'}
            </Button>
          )}
        </div>

        {/* Timeline */}
        <div className="pointer-events-auto w-full">
          <DemandLifecycleTimeline demand={demand as any} />
        </div>

        {/* Extra Bottom Actions (Only for Captadores or specific statuses, kept subtle to not break layout) */}
        <div className="flex flex-wrap gap-3 mt-6 pt-5 border-t border-[#E2E8F0] pointer-events-auto">
          <Button
            variant="outline"
            className="flex-1 h-[44px] text-[14px] font-bold bg-white text-[#1A3A52] border-[#E2E8F0] hover:bg-gray-50"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              navigate(`/demanda/${demand.id}`)
            }}
          >
            <Maximize2 className="w-4 h-4 mr-1.5" /> Detalhes
          </Button>

          {currentUser?.role === 'captador' && isPending && !isExpired && (
            <Button
              className="flex-1 h-[44px] text-[14px] font-bold bg-[#10B981] hover:bg-[#059669] text-white shadow-sm border-none"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onAction?.(demand.id, 'encontrei')
              }}
            >
              ✅ Encontrei
            </Button>
          )}

          {!isLost && (
            <Button
              variant="outline"
              className="flex-1 h-[44px] text-[14px] font-bold bg-white text-[#1A3A52] border-[#E2E8F0] hover:bg-gray-50 shadow-sm"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                logSolicitorContactAttempt(
                  demand.id,
                  'interno',
                  'Olá, gostaria de falar sobre esta demanda.',
                )
              }}
            >
              <MessageCircle className="w-4 h-4 mr-1.5" /> Contato
            </Button>
          )}

          {(currentUser?.role === 'admin' || currentUser?.role === 'gestor') && isLost && (
            <Button
              className="flex-1 h-[44px] text-[14px] font-bold bg-[#1A3A52] hover:bg-[#2E5F8A] text-white shadow-sm border-none"
              onClick={handleReabrir}
              disabled={isExtending}
            >
              <RefreshCw className="w-4 h-4 mr-1.5" /> Reabrir
            </Button>
          )}
        </div>
      </div>

      <PrioritizeModal
        open={isPrioritizeModalOpen}
        onOpenChange={setIsPrioritizeModalOpen}
        onConfirm={handlePrioritizeConfirm}
        similarCount={demand.interestedClientsCount || 0}
      />

      {showLostModal && (
        <LostModal
          open={showLostModal}
          onOpenChange={setShowLostModal}
          onConfirm={async (reason, obs) => {
            const result = await markDemandAsLost({
              demandId: demand.id,
              tipo: demand.type,
              reason,
              observacao: obs,
              userId: currentUser?.id,
            })
            if (!result.error) {
              window.dispatchEvent(
                new CustomEvent('demanda-updated', {
                  detail: {
                    tipo: demand.type,
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
                description: 'Marcada como perdida.',
                className: 'bg-[#10B981] text-white border-none',
              })
            }
          }}
        />
      )}
    </div>
  )
})
