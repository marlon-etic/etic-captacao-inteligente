import { Flag, Link2, Home, MessageSquare, RefreshCw, Star, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDemandTimeline } from '@/hooks/use-demand-timeline'
import type { SupabaseDemand } from '@/hooks/use-supabase-demands'

const iconMap = {
  creation: Flag,
  match: Link2,
  visit: Home,
  response: MessageSquare,
  status_change: RefreshCw,
  priority: Star,
}

const colorMap = {
  creation: 'bg-blue-100 text-blue-600 border-blue-200',
  match: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  visit: 'bg-purple-100 text-purple-600 border-purple-200',
  response: 'bg-amber-100 text-amber-600 border-amber-200',
  status_change: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  priority: 'bg-red-100 text-red-600 border-red-200',
}

export function DemandLifecycleTimeline({ demand }: { demand: SupabaseDemand }) {
  const { events, loading } = useDemandTimeline(demand)

  if (loading) {
    return (
      <div className="space-y-2 pt-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <p className="text-center text-xs text-muted-foreground py-4">
        Nenhum evento registrado ainda.
      </p>
    )
  }

  return (
    <div className="relative pl-3 pr-1 py-2 max-h-[280px] overflow-y-auto">
      <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-border z-0" />
      <div className="space-y-3">
        {events.map((event) => {
          const Icon = iconMap[event.type] || Clock
          const colorClass = colorMap[event.type] || 'bg-gray-100 text-gray-600 border-gray-200'
          return (
            <div key={event.id} className="relative z-10 flex gap-2.5 items-start">
              <div
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 shadow-sm',
                  colorClass,
                )}
              >
                <Icon className="w-3 h-3" />
              </div>
              <div className="flex-1 min-w-0 bg-card border rounded-lg p-2 shadow-sm">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <Badge variant="outline" className={cn('text-[9px] py-0 px-1.5', colorClass)}>
                    {event.title}
                  </Badge>
                  <span className="text-[9px] text-muted-foreground whitespace-nowrap shrink-0">
                    {new Date(event.timestamp).toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <p className="text-[11px] text-foreground font-medium leading-snug">
                  {event.description}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
