import { MapPin, DollarSign, Tag, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand, DemandStatus } from '@/types'
import { cn } from '@/lib/utils'

interface DemandCardProps {
  demand: Demand
  showActions?: boolean
  onAction?: (id: string, action: 'encontrei' | 'nao_encontrei') => void
}

export function DemandCard({ demand, showActions = false, onAction }: DemandCardProps) {
  const statusColors: Record<DemandStatus, string> = {
    Pendente: 'bg-orange-100 text-orange-700 border-orange-200',
    'Em Captação': 'bg-blue-100 text-blue-700 border-blue-200',
    'Captado sob demanda': 'bg-green-100 text-green-700 border-green-200',
    'Sem demanda': 'bg-red-100 text-red-700 border-red-200',
    Aguardando: 'bg-gray-100 text-gray-700 border-gray-200',
    Visita: 'bg-purple-100 text-purple-700 border-purple-200',
    Negócio: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
    Arquivado: 'bg-muted text-muted-foreground',
  }

  return (
    <Card className="w-full transition-all hover:shadow-md border-border/50">
      <CardContent className="p-4 flex flex-col gap-3">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1">{demand.clientName}</h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5" />
              {demand.location}
            </p>
          </div>
          <Badge
            variant="outline"
            className={cn('px-2 py-0.5 whitespace-nowrap', statusColors[demand.status])}
          >
            {demand.status}
          </Badge>
        </div>

        <div className="flex items-center gap-4 mt-2">
          <div className="flex items-center gap-1.5 text-sm font-medium bg-muted px-2.5 py-1 rounded-md">
            <DollarSign className="w-4 h-4 text-primary" />
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(demand.budget)}
          </div>
          <div className="flex items-center gap-1.5 text-sm font-medium bg-muted px-2.5 py-1 rounded-md">
            <Tag className="w-4 h-4 text-primary" />
            {demand.type}
          </div>
        </div>
      </CardContent>

      {showActions && demand.status === 'Pendente' && (
        <CardFooter className="p-4 pt-0 flex gap-2">
          <Button
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
            onClick={() => onAction?.(demand.id, 'encontrei')}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Encontrei
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => onAction?.(demand.id, 'nao_encontrei')}
          >
            <XCircle className="w-4 h-4 mr-2" />
            Não Encontrei
          </Button>
        </CardFooter>
      )}

      {!showActions && (
        <CardFooter className="p-4 pt-0 text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Criado em {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
        </CardFooter>
      )}
    </Card>
  )
}
