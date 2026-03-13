import { useState } from 'react'
import {
  Clock,
  ArrowUpCircle,
  RefreshCw,
  Trophy,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Demand, DemandStatus } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { useTimeElapsed, useSlaCountdown } from '@/hooks/useTimeElapsed'
import { PrioritizeModal } from '@/components/PrioritizeModal'
import { LostModal } from '@/components/LostModal'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
import { ContactSolicitorAction } from '@/components/ContactSolicitorAction'

export function DemandCard({
  demand,
  showActions = false,
  onAction,
  isNewDemand = false,
}: {
  demand: Demand
  showActions?: boolean
  onAction?: (id: string, a: 'encontrei' | 'nao_encontrei') => void
  isNewDemand?: boolean
}) {
  const { currentUser, prioritizeDemand, markDemandLost, getSimilarDemands, users } = useAppStore()
  const similarDemands = getSimilarDemands(demand.id)
  const totalInterested = similarDemands.length + 1 + (demand.interestedClientsCount || 0)
  const isHighPriority = totalInterested >= 5 || demand.isPrioritized

  const solicitor = users.find((u) => u.id === demand.createdBy)

  const [showSimilar, setShowSimilar] = useState(false)
  const [showPrioritize, setShowPrioritize] = useState(false)
  const [showLost, setShowLost] = useState(false)
  const [showPriorityModal, setShowPriorityModal] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const { text, urgencyLevel } = useTimeElapsed(demand.createdAt)
  const {
    text: slaText,
    progress: slaProgress,
    level: slaLevel,
    badgeText: slaBadgeText,
  } = useSlaCountdown(
    demand.createdAt,
    demand.isExtension48h,
    demand.extensionRequestedAt,
    demand.status,
  )

  const isOwnerSDR =
    currentUser &&
    (currentUser.role === 'sdr' || currentUser.role === 'corretor') &&
    demand.createdBy === currentUser.id
  const canManage = isOwnerSDR && demand.status !== 'Perdida'

  const isAssignedCaptador =
    currentUser?.role === 'captador' && (demand.assignedTo === currentUser.id || !demand.assignedTo)
  const canCapture =
    (isAssignedCaptador || currentUser?.role === 'admin') &&
    demand.status !== 'Perdida' &&
    demand.status !== 'Impossível'

  const propCount = demand.capturedProperties?.length || 0

  const formatCurrency = (val?: number) =>
    val
      ? new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          maximumFractionDigits: 0,
        }).format(val)
      : 'Não informado'

  const statusColors: Record<DemandStatus, string> = {
    Pendente: 'bg-orange-100 text-orange-700 border-orange-200',
    'Em Captação': 'bg-blue-100 text-blue-700 border-blue-200',
    'Captado sob demanda': 'bg-green-100 text-green-700 border-green-200',
    'Captado independente': 'bg-teal-100 text-teal-700 border-teal-200',
    'Sem demanda': 'bg-red-100 text-red-700 border-red-200',
    Aguardando: 'bg-gray-100 text-gray-700 border-gray-200',
    Visita: 'bg-purple-100 text-purple-700 border-purple-200',
    Proposta: 'bg-indigo-100 text-indigo-700 border-indigo-200 font-medium',
    Negócio: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    Arquivado: 'bg-muted text-muted-foreground',
    Impossível: 'bg-gray-800 text-white border-gray-900 font-medium',
    Perdida: 'bg-gray-200 text-gray-800 border-gray-400 font-medium',
  }

  const isPendente = demand.status === 'Pendente'

  return (
    <>
      <Card
        className={cn(
          'w-full transition-all hover:shadow-md flex flex-col h-full relative overflow-hidden border-2',
          isPendente &&
            slaLevel === 'green' &&
            'bg-green-50/30 border-green-200 shadow-sm shadow-green-100/50',
          isPendente &&
            slaLevel === 'yellow' &&
            'bg-yellow-50/50 border-yellow-300 shadow-sm shadow-yellow-100/50',
          isPendente &&
            slaLevel === 'red' &&
            'bg-red-50/50 border-red-400 shadow-sm shadow-red-200/50',
          isPendente &&
            slaLevel === 'orange' &&
            'bg-orange-50/50 border-orange-300 shadow-sm shadow-orange-100/50',
          !isPendente &&
            isNewDemand &&
            'bg-green-50/50 border-green-300 shadow-sm shadow-green-100',
          !isPendente &&
            !isNewDemand &&
            urgencyLevel === 'green' &&
            'border-emerald-200 shadow-sm shadow-emerald-100/50',
          !isPendente &&
            !isNewDemand &&
            urgencyLevel === 'yellow' &&
            'border-yellow-300 shadow-sm shadow-yellow-100/50',
          !isPendente &&
            !isNewDemand &&
            urgencyLevel === 'orange' &&
            'border-orange-300 shadow-sm shadow-orange-100/50',
          !isPendente &&
            !isNewDemand &&
            urgencyLevel === 'red' &&
            'border-red-400 shadow-sm shadow-red-200/50',
          isHighPriority && 'ring-2 ring-purple-300 ring-offset-1',
          demand.isRepescagem && 'border-amber-400 shadow-amber-200 ring-1 ring-amber-400/50',
          demand.isPrioritized &&
            'bg-pink-50 border-pink-400 shadow-sm shadow-pink-200 ring-1 ring-pink-400/50',
          demand.status === 'Perdida' && 'bg-gray-50 border-gray-200 opacity-80',
        )}
      >
        <div
          className={cn(
            'absolute top-0 left-0 w-[6px] h-full',
            demand.status === 'Perdida'
              ? 'bg-gray-400'
              : demand.isPrioritized
                ? 'bg-pink-500'
                : demand.isRepescagem
                  ? 'bg-amber-500 animate-pulse'
                  : isPendente
                    ? slaLevel === 'green'
                      ? 'bg-green-500'
                      : slaLevel === 'yellow'
                        ? 'bg-yellow-400'
                        : slaLevel === 'red'
                          ? 'bg-red-500'
                          : slaLevel === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-emerald-500'
                    : isNewDemand
                      ? 'bg-green-500'
                      : urgencyLevel === 'green'
                        ? 'bg-emerald-500'
                        : urgencyLevel === 'yellow'
                          ? 'bg-yellow-400'
                          : urgencyLevel === 'orange'
                            ? 'bg-orange-500'
                            : 'bg-red-500',
          )}
        />
        <CardContent className="p-4 md:p-6 flex flex-col gap-4 flex-grow pl-[22px] md:pl-[30px]">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-[18px] md:text-[20px] truncate flex items-center gap-2">
                {isNewDemand && (
                  <span title="Nova Demanda" className="text-xl leading-none">
                    🆕
                  </span>
                )}
                {demand.clientName}
                {isHighPriority && !demand.isPrioritized && (
                  <span
                    title="Alta Prioridade (>5 interessados)"
                    className="flex items-center text-purple-600"
                  >
                    <ArrowUpCircle className="w-5 h-5" />
                  </span>
                )}
              </h3>
              {totalInterested > 1 && !demand.isPrioritized && (
                <button
                  onClick={() => setShowSimilar(true)}
                  className="flex items-center gap-2 text-[12px] md:text-[14px] font-medium text-purple-700 mt-2 cursor-pointer hover:underline min-h-[44px] py-1"
                  title="Ver clientes interessados"
                >
                  <Users className="w-4 h-4" />
                  <span>{totalInterested} interessados similares</span>
                </button>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              {isPendente && slaBadgeText && (
                <Badge
                  variant="secondary"
                  className={cn(
                    'text-[12px] py-1 px-3 font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm min-h-[28px]',
                    slaLevel === 'green' && 'bg-green-100 text-green-800 border-green-300',
                    slaLevel === 'yellow' && 'bg-yellow-100 text-yellow-800 border-yellow-300',
                    slaLevel === 'red' && 'bg-red-100 text-red-800 border-red-300',
                    slaLevel === 'orange' && 'bg-orange-100 text-orange-800 border-orange-300',
                  )}
                >
                  {slaBadgeText}
                </Badge>
              )}
              {!isPendente && isNewDemand && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 border-green-300 text-[12px] py-1 px-3 font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm min-h-[28px]"
                >
                  ⭐ NOVA - {text}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  'px-3 py-1 text-[12px] whitespace-nowrap min-h-[28px]',
                  statusColors[demand.status],
                )}
              >
                {demand.status}
              </Badge>
              {demand.isPrioritized && (
                <button onClick={() => setShowPriorityModal(true)}>
                  <Badge
                    variant="secondary"
                    className="bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-300 text-[12px] py-1 px-3 font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors shadow-sm min-h-[44px]"
                  >
                    <span>🔴</span> PRIORIZADA - {demand.interestedClientsCount || 1} interessados
                  </Badge>
                </button>
              )}
              {demand.status === 'Perdida' && (
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-800 border-gray-400 text-[12px] py-1 px-3 font-bold flex items-center gap-1.5 whitespace-nowrap min-h-[28px]"
                >
                  ❌ PERDIDA
                </Badge>
              )}
              {demand.isRepescagem && demand.status === 'Pendente' && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 border-amber-300 text-[12px] py-1 px-3 font-bold flex items-center gap-1.5 whitespace-nowrap min-h-[28px]"
                >
                  <RefreshCw className="w-4 h-4" /> Repescagem
                </Badge>
              )}
            </div>
          </div>
          <p className="text-[14px] md:text-[16px] line-clamp-2 text-foreground/80 leading-relaxed">
            {demand.description}
          </p>

          {isPendente && slaText && (
            <div className="mt-2 mb-2 min-h-[60px] flex flex-col justify-center">
              <div className="flex justify-between items-center text-[12px] md:text-[14px] font-bold mb-2">
                <span
                  className={cn(
                    slaLevel === 'green' && 'text-green-700',
                    slaLevel === 'yellow' && 'text-yellow-700',
                    slaLevel === 'red' && 'text-red-700',
                    slaLevel === 'orange' && 'text-orange-700',
                  )}
                >
                  {slaText} restantes
                </span>
              </div>
              <Progress
                value={slaProgress}
                className={cn(
                  'h-2',
                  slaLevel === 'green' && 'bg-green-100',
                  slaLevel === 'yellow' && 'bg-yellow-100',
                  slaLevel === 'red' && 'bg-red-100',
                  slaLevel === 'orange' && 'bg-orange-100',
                )}
                indicatorClassName={cn(
                  slaLevel === 'green' && 'bg-green-500',
                  slaLevel === 'yellow' && 'bg-yellow-400',
                  slaLevel === 'red' && 'bg-red-500',
                  slaLevel === 'orange' && 'bg-orange-500',
                )}
              />
            </div>
          )}

          <div className="mt-2 space-y-2 text-[14px] text-muted-foreground bg-muted/20 p-4 md:p-5 rounded-lg border border-border/50">
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">👤</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Cliente:</span> {demand.clientName}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">👤</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Solicitado por:</span>{' '}
                {solicitor?.name || 'Desconhecido'}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">📍</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Localização:</span> {demand.location}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">💰</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Orçamento:</span>{' '}
                {formatCurrency(demand.minBudget)} - {formatCurrency(demand.maxBudget)}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">🏠</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Perfil:</span> {demand.bedrooms || 0}{' '}
                dorm, {demand.bathrooms || 0} banh, {demand.parkingSpots || 0} vagas
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">⏰</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Urgência:</span> {demand.timeframe}
              </span>
            </p>
            <p className="flex items-start gap-3">
              <span className="shrink-0 text-lg leading-none">📅</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Criado há:</span> {text}
              </span>
            </p>
          </div>

          <Button
            className="w-full mt-4 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 shadow-none font-medium min-h-[44px] text-[14px]"
            variant="outline"
            onClick={() => setShowDetails(true)}
          >
            📖 Ver Detalhes Completos
          </Button>

          {propCount > 0 && (
            <div className="mt-4 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[14px] font-semibold p-4 rounded-lg flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>
                  {propCount} imóvel{propCount !== 1 ? 'eis' : ''} encontrado
                  {propCount !== 1 ? 's' : ''} para {demand.clientName}
                </span>
              </div>
            </div>
          )}

          {propCount > 0 && isAssignedCaptador && (
            <div className="mt-2 space-y-2">
              <p className="text-[12px] font-bold text-muted-foreground uppercase mb-2">
                Imóveis Vinculados:
              </p>
              {demand.capturedProperties?.map((p) => (
                <div
                  key={p.code}
                  className="bg-muted/40 p-3 rounded-lg border text-[14px] flex justify-between items-center"
                >
                  <span className="font-semibold">{p.code}</span>
                  <span className="text-muted-foreground truncate max-w-[150px]">
                    {p.neighborhood}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="mt-auto flex flex-col border-t bg-muted/10">
          <div className="p-4 md:p-6 flex flex-col gap-4 pl-[22px] md:pl-[30px]">
            {showActions && demand.status === 'Pendente' && propCount === 0 && (
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm min-h-[44px] text-[14px]"
                  onClick={() => onAction?.(demand.id, 'encontrei')}
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />{' '}
                  {demand.isRepescagem ? 'Assumir & Registar' : 'Encontrei'}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive min-h-[44px] text-[14px]"
                  onClick={() => onAction?.(demand.id, 'nao_encontrei')}
                >
                  <XCircle className="w-5 h-5 mr-2" /> Não Encontrei
                </Button>
              </div>
            )}

            {canCapture && (propCount > 0 || demand.status !== 'Pendente') && (
              <Button
                variant="outline"
                className="w-full border-dashed border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 transition-colors min-h-[44px] text-[14px]"
                onClick={() => onAction?.(demand.id, 'encontrei')}
              >
                <Plus className="w-5 h-5 mr-2" /> Adicionar Imóvel
              </Button>
            )}

            {canManage && (
              <div className="flex flex-col sm:flex-row gap-4">
                {!demand.isPrioritized && (
                  <Button
                    variant="outline"
                    className="flex-1 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 border-pink-200 shadow-sm min-h-[44px] text-[14px]"
                    onClick={() => setShowPrioritize(true)}
                  >
                    🔴 PRIORIZAR
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 shadow-sm min-h-[44px] text-[14px]"
                  onClick={() => setShowLost(true)}
                >
                  ❌ PERDIDO
                </Button>
              </div>
            )}

            <ContactSolicitorAction
              demand={demand}
              solicitor={solicitor}
              buttonClassName="w-full min-h-[44px]"
            />
          </div>
        </div>
      </Card>

      <Dialog open={showSimilar} onOpenChange={setShowSimilar}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[18px]">
              <Users className="w-6 h-6 text-purple-600" /> Clientes Interessados
            </DialogTitle>
            <DialogDescription className="text-[14px]">
              Perfis com demandas similares (Mesmo bairro, tipo, quartos, vagas e orçamento ±10%).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex items-center gap-4 p-4 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="flex-1">
                <p className="font-bold text-[16px] text-purple-900">{demand.clientName}</p>
                <p className="text-[14px] text-purple-700/80">
                  {demand.clientEmail || 'Sem email'}
                </p>
              </div>
              <Badge
                variant="outline"
                className="bg-white text-purple-700 border-purple-200 px-3 py-1"
              >
                Demanda Original
              </Badge>
            </div>
            {similarDemands.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-semibold text-[16px] text-foreground">{d.clientName}</p>
                  <p className="text-[14px] text-muted-foreground">
                    {d.clientEmail || 'Sem email'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge variant="secondary" className="text-[12px] bg-secondary/50 px-2 py-0.5">
                    {d.status}
                  </Badge>
                  <span className="text-[14px] font-bold text-muted-foreground">
                    {formatCurrency(d.budget || d.maxBudget)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showPriorityModal} onOpenChange={setShowPriorityModal}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[18px]">
              🔴 Demanda Priorizada
            </DialogTitle>
            <DialogDescription className="text-[14px]">
              Esta demanda possui alta probabilidade de conversão imediata.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-pink-50 border border-pink-100 rounded-lg">
              <Users className="w-8 h-8 text-pink-600 shrink-0" />
              <p className="font-medium text-pink-900 text-[14px]">
                <strong className="text-[18px]">{demand.interestedClientsCount || 1}</strong>{' '}
                clientes estão interessados neste perfil
              </p>
            </div>
            <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
              <Trophy className="w-8 h-8 text-amber-600 shrink-0" />
              <p className="font-medium text-amber-900 text-[14px]">
                <strong className="text-[16px]">+25 pontos adicionais</strong> se captar este imóvel
              </p>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <Button
              className="min-h-[44px] px-6 text-[14px]"
              onClick={() => setShowPriorityModal(false)}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <PrioritizeModal
        open={showPrioritize}
        onOpenChange={setShowPrioritize}
        onConfirm={(count) => prioritizeDemand(demand.id, count)}
      />

      <LostModal
        open={showLost}
        onOpenChange={setShowLost}
        onConfirm={(reason, obs) => markDemandLost(demand.id, reason, obs)}
      />

      <DemandDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        demand={demand}
        onAction={
          showActions
            ? (act) => {
                setShowDetails(false)
                if (onAction) onAction(demand.id, act)
              }
            : undefined
        }
      />
    </>
  )
}
