import { Calendar, FileText, CheckCircle2, XCircle, Camera, CheckSquare } from 'lucide-react'
import { PropertyAction } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

const iconMap = {
  captacao: Camera,
  visita_agendada: Calendar,
  visita_realizada: CheckSquare,
  proposta: FileText,
  negocio: CheckCircle2,
  perdido: XCircle,
}

const colorMap = {
  captacao: 'bg-blue-100 text-blue-600 border-blue-200',
  visita_agendada: 'bg-purple-100 text-purple-600 border-purple-200',
  visita_realizada: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  proposta: 'bg-amber-100 text-amber-600 border-amber-200',
  negocio: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  perdido: 'bg-red-100 text-red-600 border-red-200',
}

const labelMap = {
  captacao: 'Captação',
  visita_agendada: 'Visita Agendada',
  visita_realizada: 'Visita Realizada',
  proposta: 'Proposta',
  negocio: 'Negócio Fechado',
  perdido: 'Perdido',
}

interface PropertyTimelineProps {
  history: PropertyAction[]
}

export function PropertyTimeline({ history }: PropertyTimelineProps) {
  if (!history || history.length === 0) {
    return (
      <div className="text-center p-8 bg-muted/30 border border-dashed rounded-lg">
        <p className="text-muted-foreground font-medium text-sm">
          Nenhuma ação registrada para este imóvel.
        </p>
      </div>
    )
  }

  // Ensure descending order (newest first)
  const sortedHistory = [...history].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  )

  return (
    <div className="relative pl-4 pr-2 py-2">
      {/* Vertical Line */}
      <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border z-0" />

      <div className="space-y-6">
        {sortedHistory.map((action, idx) => {
          const Icon = iconMap[action.type] || FileText
          const colorClass = colorMap[action.type] || 'bg-gray-100 text-gray-600 border-gray-200'
          const label = labelMap[action.type] || 'Ação'

          return (
            <div key={action.id} className="relative z-10 flex gap-4 items-start">
              <div
                className={cn(
                  'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 shadow-sm',
                  colorClass,
                )}
                title={label}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0 bg-card border rounded-lg p-3 shadow-sm">
                <div className="flex justify-between items-start gap-2 mb-1.5 flex-wrap sm:flex-nowrap">
                  <Badge variant="outline" className={cn('text-[10px] py-0', colorClass)}>
                    {label}
                  </Badge>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(action.timestamp).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-sm text-foreground font-medium mb-1">{action.description}</p>
                {action.observations && (
                  <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded border border-muted mt-2">
                    {action.observations}
                  </p>
                )}
                <div className="flex justify-end mt-2">
                  <span className="text-[10px] text-muted-foreground/80 font-medium">
                    Por {action.userName} ({action.userRole})
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
