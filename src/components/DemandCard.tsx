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
import { useTimeElapsed } from '@/hooks/useTimeElapsed'
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

  const { text, hoursElapsed, urgencyLevel } = useTimeElapsed(demand.createdAt)

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

  const isAwaiting = demand.status === 'Pendente'
  const isLate = isAwaiting && hoursElapsed > 24

  return (
    <>
      <Card
        className={cn(
          'w-full transition-all hover:shadow-md flex flex-col h-full relative overflow-hidden border-2',
          isNewDemand && 'bg-green-50/50 border-green-300 shadow-sm shadow-green-100',
          !isNewDemand &&
            urgencyLevel === 'green' &&
            'border-emerald-200 shadow-sm shadow-emerald-100/50',
          !isNewDemand &&
            urgencyLevel === 'yellow' &&
            'border-yellow-300 shadow-sm shadow-yellow-100/50',
          !isNewDemand &&
            urgencyLevel === 'orange' &&
            'border-orange-300 shadow-sm shadow-orange-100/50',
          !isNewDemand && urgencyLevel === 'red' && 'border-red-400 shadow-sm shadow-red-200/50',
          isHighPriority && 'ring-2 ring-purple-300 ring-offset-1',
          demand.isRepescagem && 'border-amber-400 shadow-amber-200 ring-1 ring-amber-400/50',
          demand.isPrioritized &&
            'bg-pink-50 border-pink-400 shadow-sm shadow-pink-200 ring-1 ring-pink-400/50',
          demand.status === 'Perdida' && 'bg-gray-50 border-gray-200 opacity-80',
        )}
      >
        <div
          className={cn(
            'absolute top-0 left-0 w-1.5 h-full',
            demand.status === 'Perdida'
              ? 'bg-gray-400'
              : demand.isPrioritized
                ? 'bg-pink-500'
                : demand.isRepescagem
                  ? 'bg-amber-500 animate-pulse'
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
        <CardContent className="p-4 flex flex-col gap-3 flex-grow pl-5">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                {isNewDemand && (
                  <span title="Nova Demanda" className="text-xl leading-none">
                    🆕
                  </span>
                )}
                {demand.clientName}
                {isLate && !demand.isRepescagem && (
                  <span
                    title="Atrasado (>24h)"
                    className="flex items-center text-red-500 animate-pulse"
                  >
                    <Clock className="w-4 h-4" />
                  </span>
                )}
                {isHighPriority && !demand.isPrioritized && (
                  <span
                    title="Alta Prioridade (>5 interessados)"
                    className="flex items-center text-purple-600"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                  </span>
                )}
              </h3>
              {totalInterested > 1 && !demand.isPrioritized && (
                <button
                  onClick={() => setShowSimilar(true)}
                  className="flex items-center gap-1 text-xs font-medium text-purple-700 mt-1 cursor-pointer hover:underline"
                  title="Ver clientes interessados"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{totalInterested} interessados similares</span>
                </button>
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              {isNewDemand && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800 border-green-300 text-[10px] py-0.5 px-2 font-bold flex items-center gap-1 whitespace-nowrap shadow-sm"
                >
                  ⭐ NOVA - {text}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn('px-2 py-0.5 whitespace-nowrap', statusColors[demand.status])}
              >
                {demand.status}
              </Badge>
              {demand.isPrioritized && (
                <Badge
                  variant="secondary"
                  className="bg-pink-100 text-pink-800 hover:bg-pink-200 border-pink-300 text-[10px] py-0.5 px-2 font-bold flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors shadow-sm"
                  onClick={() => setShowPriorityModal(true)}
                >
                  <span>🔴</span> PRIORIZADA - {demand.interestedClientsCount || 1} interessados
                </Badge>
              )}
              {demand.status === 'Perdida' && (
                <Badge
                  variant="secondary"
                  className="bg-gray-200 text-gray-800 border-gray-400 text-[10px] py-0 px-1.5 font-bold flex items-center gap-1 whitespace-nowrap"
                >
                  ❌ PERDIDA
                </Badge>
              )}
              {demand.isRepescagem && demand.status === 'Pendente' && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0 px-1.5 font-bold flex items-center gap-1 whitespace-nowrap"
                >
                  <RefreshCw className="w-3 h-3" /> Repescagem
                </Badge>
              )}
            </div>
          </div>
          <p className="text-sm line-clamp-2 mt-1 text-foreground/80">{demand.description}</p>

          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg border border-border/50">
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">👤</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Cliente:</span> {demand.clientName}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">👤</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Solicitado por:</span>{' '}
                {solicitor?.name || 'Desconhecido'}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">📍</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Localização:</span> {demand.location}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">💰</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Orçamento:</span>{' '}
                {formatCurrency(demand.minBudget)} - {formatCurrency(demand.maxBudget)}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">🏠</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Perfil:</span> {demand.bedrooms || 0}{' '}
                dorm, {demand.bathrooms || 0} banh, {demand.parkingSpots || 0} vagas
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">⏰</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Urgência:</span> {demand.timeframe}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">📅</span>
              <span className="truncate">
                <span className="font-medium text-foreground">Criado há:</span> {text}
              </span>
            </p>
          </div>

          <Button
            className="w-full mt-2 bg-primary/5 hover:bg-primary/10 text-primary border-primary/20 shadow-none font-medium"
            variant="outline"
            onClick={() => setShowDetails(true)}
          >
            📖 Ver Detalhes Completos
          </Button>

          {propCount > 0 && (
            <div className="mt-2 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold px-3 py-2 rounded-md flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>
                  {propCount} imóvel{propCount !== 1 ? 'eis' : ''} encontrado
                  {propCount !== 1 ? 's' : ''} para {demand.clientName}
                </span>
              </div>
            </div>
          )}

          {propCount > 0 && isAssignedCaptador && (
            <div className="mt-1 space-y-1.5">
              <p className="text-[10px] font-bold text-muted-foreground uppercase">
                Imóveis Vinculados:
              </p>
              {demand.capturedProperties?.map((p) => (
                <div
                  key={p.code}
                  className="bg-muted/40 p-2 rounded border text-xs flex justify-between items-center"
                >
                  <span className="font-medium">{p.code}</span>
                  <span className="text-muted-foreground truncate max-w-[120px]">
                    {p.neighborhood}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>

        <div className="mt-auto flex flex-col border-t bg-muted/10">
          <div className="px-4 pb-4 pt-4 flex flex-col gap-2 pl-5">
            {showActions && demand.status === 'Pendente' && propCount === 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                  onClick={() => onAction?.(demand.id, 'encontrei')}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1.5" />{' '}
                  {demand.isRepescagem ? 'Assumir & Registar' : 'Encontrei'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onAction?.(demand.id, 'nao_encontrei')}
                >
                  <XCircle className="w-4 h-4 mr-1.5" /> Não Encontrei
                </Button>
              </div>
            )}

            {canCapture && (propCount > 0 || demand.status !== 'Pendente') && (
              <Button
                size="sm"
                variant="outline"
                className="w-full border-dashed border-emerald-500/50 text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50 transition-colors"
                onClick={() => onAction?.(demand.id, 'encontrei')}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Adicionar Imóvel
              </Button>
            )}

            {canManage && (
              <div className="flex flex-wrap gap-2 mt-1">
                {!demand.isPrioritized && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 bg-pink-50 text-pink-700 hover:bg-pink-100 hover:text-pink-800 border-pink-200 shadow-sm"
                    onClick={() => setShowPrioritize(true)}
                  >
                    🔴 PRIORIZAR
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200 shadow-sm"
                  onClick={() => setShowLost(true)}
                >
                  ❌ PERDIDO
                </Button>
              </div>
            )}

            <ContactSolicitorAction demand={demand} solicitor={solicitor} />
          </div>
        </div>
      </Card>

      <Dialog open={showSimilar} onOpenChange={setShowSimilar}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" /> Clientes Interessados
            </DialogTitle>
            <DialogDescription>
              Perfis com demandas similares (Mesmo bairro, tipo, quartos, vagas e orçamento ±10%).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2 max-h-[60vh] overflow-y-auto pr-2">
            <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-100 rounded-lg">
              <div className="flex-1">
                <p className="font-semibold text-purple-900">{demand.clientName}</p>
                <p className="text-xs text-purple-700/80">{demand.clientEmail || 'Sem email'}</p>
              </div>
              <Badge variant="outline" className="bg-white text-purple-700 border-purple-200">
                Demanda Original
              </Badge>
            </div>
            {similarDemands.map((d) => (
              <div
                key={d.id}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-medium text-foreground">{d.clientName}</p>
                  <p className="text-xs text-muted-foreground">{d.clientEmail || 'Sem email'}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="secondary" className="text-[10px] bg-secondary/50">
                    {d.status}
                  </Badge>
                  <span className="text-xs font-medium text-muted-foreground">
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
            <DialogTitle className="flex items-center gap-2">🔴 Demanda Priorizada</DialogTitle>
            <DialogDescription>
              Esta demanda possui alta probabilidade de conversão imediata.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="flex items-center gap-3 p-3 bg-pink-50 border border-pink-100 rounded-lg">
              <Users className="w-5 h-5 text-pink-600" />
              <p className="font-medium text-pink-900">
                <strong className="text-lg">{demand.interestedClientsCount || 1}</strong> clientes
                estão interessados neste perfil
              </p>
            </div>
            <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
              <Trophy className="w-5 h-5 text-amber-600" />
              <p className="font-medium text-amber-900">
                <strong>+25 pontos adicionais</strong> se captar este imóvel
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setShowPriorityModal(false)}>Entendi</Button>
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
