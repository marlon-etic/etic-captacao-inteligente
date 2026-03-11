import { MapPin, DollarSign, Tag, CheckCircle2, XCircle, Clock, Users } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand, DemandStatus } from '@/types'
import { cn } from '@/lib/utils'

export function DemandCard({
  demand,
  showActions = false,
  onAction,
}: {
  demand: Demand
  showActions?: boolean
  onAction?: (id: string, a: 'encontrei' | 'nao_encontrei') => void
}) {
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
  }
  const urgencyColors = {
    Alta: 'text-red-600 bg-red-50 border-red-200',
    Média: 'text-amber-600 bg-amber-50 border-amber-200',
    Baixa: 'text-green-600 bg-green-50 border-green-200',
  }
  const hoursElapsed = (Date.now() - new Date(demand.createdAt).getTime()) / 3600000
  const isAwaiting = demand.status === 'Pendente'
  const isLate = isAwaiting && hoursElapsed > 24

  return (
    <Card
      className={cn(
        'w-full transition-all hover:shadow-md border-border/50 flex flex-col h-full relative overflow-hidden',
        isAwaiting && 'border-orange-200 shadow-sm shadow-orange-100/50',
        isLate && 'border-red-300 shadow-red-100',
      )}
    >
      {isAwaiting && (
        <div
          className={cn(
            'absolute top-0 left-0 w-1 h-full',
            isLate ? 'bg-red-500 animate-pulse' : 'bg-orange-400',
          )}
        />
      )}
      <CardContent className="p-4 flex flex-col gap-3 flex-grow">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate flex items-center gap-2">
              {demand.clientName}
              {isLate && (
                <span
                  title="Mais de 24h sem resposta"
                  className="flex items-center text-red-500 animate-pulse"
                >
                  <Clock className="w-4 h-4" />
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1 truncate">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{demand.location}</span>
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn('px-2 py-0.5 whitespace-nowrap shrink-0', statusColors[demand.status])}
          >
            {demand.status}
          </Badge>
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
          <Badge
            variant="outline"
            className={cn('text-[10px] px-1.5 py-0 h-5', urgencyColors[demand.urgency])}
          >
            {demand.urgency}
          </Badge>
          {demand.similarProfilesCount > 0 && (
            <div
              className="flex items-center gap-1 text-xs text-muted-foreground ml-auto"
              title="Perfis similares"
            >
              <Users className="w-3.5 h-3.5" />
              <span>{demand.similarProfilesCount}</span>
            </div>
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
            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Encontrei
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
          {hoursElapsed < 24 && demand.status === 'Pendente' && (
            <span className="text-orange-500 font-medium">
              {Math.floor(hoursElapsed)}h decorridas
            </span>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
