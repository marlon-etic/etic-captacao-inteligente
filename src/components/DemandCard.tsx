import { useState } from 'react'
import {
  MapPin,
  DollarSign,
  Tag,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Bed,
  Car,
  ArrowUpCircle,
  RefreshCw,
} from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
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

export function DemandCard({
  demand,
  showActions = false,
  onAction,
}: {
  demand: Demand
  showActions?: boolean
  onAction?: (id: string, a: 'encontrei' | 'nao_encontrei') => void
}) {
  const { getSimilarDemands } = useAppStore()
  const similarDemands = getSimilarDemands(demand.id)
  const totalInterested = similarDemands.length + 1
  const isHighPriority = totalInterested >= 5

  const [showSimilar, setShowSimilar] = useState(false)

  const statusColors: Record<DemandStatus, string> = {
    Pendente: 'bg-orange-100 text-orange-700 border-orange-200',
    'Em Captação': 'bg-blue-100 text-blue-700 border-blue-200',
    'Captado sob demanda': 'bg-green-100 text-green-700 border-green-200',
    'Captado independente': 'bg-teal-100 text-teal-700 border-teal-200',
    'Sem demanda': 'bg-red-100 text-red-700 border-red-200',
    Aguardando: 'bg-gray-100 text-gray-700 border-gray-200',
    Visita: 'bg-purple-100 text-purple-700 border-purple-200',
    Negócio: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    Arquivado: 'bg-muted text-muted-foreground',
    Impossível: 'bg-gray-800 text-white border-gray-900 font-medium',
  }

  const timeframeColors: Record<string, string> = {
    Urgente: 'text-red-700 bg-red-100 border-red-200 ring-red-500/20',
    'Até 15 dias': 'text-orange-700 bg-orange-100 border-orange-200 ring-orange-500/20',
    'Até 30 dias': 'text-yellow-700 bg-yellow-100 border-yellow-200 ring-yellow-500/20',
    'Até 60 dias': 'text-emerald-700 bg-emerald-100 border-emerald-200 ring-emerald-500/20',
    'Até 90 dias ou +': 'text-blue-700 bg-blue-100 border-blue-200 ring-blue-500/20',
  }

  const hoursElapsed = (Date.now() - new Date(demand.createdAt).getTime()) / 3600000
  const isAwaiting = demand.status === 'Pendente'
  const isLate = isAwaiting && hoursElapsed > 24
  const isUrgente = demand.timeframe === 'Urgente' || demand.timeframe === 'Até 15 dias'

  return (
    <>
      <Card
        className={cn(
          'w-full transition-all hover:shadow-md border-border/50 flex flex-col h-full relative overflow-hidden',
          isAwaiting && 'border-orange-200 shadow-sm shadow-orange-100/50',
          isLate && 'border-red-300 shadow-red-100',
          isHighPriority && 'border-purple-300 shadow-purple-100',
          demand.isRepescagem && 'border-amber-400 shadow-amber-200 ring-1 ring-amber-400/50',
        )}
      >
        {(isAwaiting || isHighPriority || demand.isRepescagem || isUrgente) && (
          <div
            className={cn(
              'absolute top-0 left-0 w-1 h-full',
              demand.isRepescagem
                ? 'bg-amber-500 animate-pulse'
                : isLate
                  ? 'bg-red-500 animate-pulse'
                  : demand.timeframe === 'Urgente'
                    ? 'bg-red-500'
                    : demand.timeframe === 'Até 15 dias'
                      ? 'bg-orange-500'
                      : isHighPriority
                        ? 'bg-purple-500'
                        : 'bg-orange-400',
            )}
          />
        )}
        <CardContent className="p-4 flex flex-col gap-3 flex-grow">
          <div className="flex justify-between items-start gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate flex items-center gap-2">
                {demand.clientName}
                {isLate && !demand.isRepescagem && (
                  <span
                    title="Mais de 24h sem resposta"
                    className="flex items-center text-red-500 animate-pulse"
                  >
                    <Clock className="w-4 h-4" />
                  </span>
                )}
                {isHighPriority && (
                  <span
                    title="Alta Prioridade (>5 interessados)"
                    className="flex items-center text-purple-600"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                  </span>
                )}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{demand.location}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className={cn('px-2 py-0.5 whitespace-nowrap', statusColors[demand.status])}
              >
                {demand.status}
              </Badge>
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
          <div className="flex flex-wrap items-center gap-2 mt-auto pt-2">
            <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-2 py-1 rounded-md">
              <DollarSign className="w-3.5 h-3.5 text-primary" />
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(demand.budget || demand.maxBudget)}
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium bg-muted px-2 py-1 rounded-md">
              <Tag className="w-3.5 h-3.5 text-primary" />
              {demand.type}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-medium bg-muted px-2 py-1 rounded-md"
              title="Quartos"
            >
              <Bed className="w-3.5 h-3.5 text-primary" />
              {demand.bedrooms}
            </div>
            <div
              className="flex items-center gap-1.5 text-xs font-medium bg-muted px-2 py-1 rounded-md"
              title="Vagas"
            >
              <Car className="w-3.5 h-3.5 text-primary" />
              {demand.parkingSpots}
            </div>
            <Badge
              variant="outline"
              className={cn(
                'text-[10px] px-2 py-0.5 h-6 font-semibold flex items-center gap-1 ring-1 ring-inset',
                timeframeColors[demand.timeframe] || 'text-muted-foreground bg-muted border-muted',
              )}
            >
              <Clock className="w-3 h-3" />
              {demand.timeframe}
            </Badge>
            {totalInterested > 1 && (
              <button
                onClick={() => setShowSimilar(true)}
                className="flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-2 py-1 rounded-md ml-auto transition-colors cursor-pointer"
                title="Ver clientes interessados"
              >
                <Users className="w-3.5 h-3.5" />
                <span>{totalInterested} interessados</span>
              </button>
            )}
          </div>
        </CardContent>
        {showActions && demand.status === 'Pendente' && (
          <CardFooter className="p-4 pt-0 flex gap-2 mt-auto">
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
          </CardFooter>
        )}
        {(!showActions || demand.status !== 'Pendente') && (
          <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex justify-between mt-auto">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> Criado em{' '}
              {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
            </span>
            {hoursElapsed > 0 && demand.status === 'Pendente' && (
              <span
                className={cn(
                  'font-medium',
                  hoursElapsed > 48 ? 'text-red-600' : 'text-orange-500',
                )}
              >
                {Math.floor(hoursElapsed)}h decorridas
              </span>
            )}
          </CardFooter>
        )}
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
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(d.budget || d.maxBudget)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
