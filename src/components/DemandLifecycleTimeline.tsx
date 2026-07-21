import {
  Flag,
  Link2,
  Home,
  MessageSquare,
  RefreshCw,
  Star,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useDemandTimeline } from '@/hooks/use-demand-timeline'
import type { SupabaseDemand } from '@/hooks/use-supabase-demands'

const iconMap: Record<string, any> = {
  creation: Flag,
  match: Link2,
  visit: Home,
  response: MessageSquare,
  status_change: RefreshCw,
  priority: Star,
  links: ExternalLink,
}

const colorMap: Record<string, string> = {
  creation: 'bg-blue-100 text-blue-600 border-blue-200',
  match: 'bg-emerald-100 text-emerald-600 border-emerald-200',
  visit: 'bg-purple-100 text-purple-600 border-purple-200',
  response: 'bg-amber-100 text-amber-600 border-amber-200',
  status_change: 'bg-indigo-100 text-indigo-600 border-indigo-200',
  priority: 'bg-red-100 text-red-600 border-red-200',
  links: 'bg-cyan-100 text-cyan-600 border-cyan-200',
}

export function DemandLifecycleTimeline({ demand }: { demand: SupabaseDemand }) {
  const { events, loading } = useDemandTimeline(demand)

  return (
    <div className="w-full flex flex-col items-center">
      <h4 className="text-[13px] font-black text-[#1A3A52] uppercase tracking-wide mb-3">
        Linha do Tempo
      </h4>
      <div className="relative pl-3 pr-1 py-2 max-h-[320px] overflow-y-auto w-full text-left scrollbar-thin scrollbar-thumb-gray-300">
        {loading ? (
          <div className="space-y-2 pt-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            Nenhum evento registrado ainda.
          </p>
        ) : (
          <>
            <div className="absolute left-[17px] top-4 bottom-4 w-0.5 bg-gray-200 z-0" />
            <div className="space-y-4">
              {events.map((event) => {
                const Icon = iconMap[event.type] || Clock
                const colorClass =
                  colorMap[event.type] || 'bg-gray-100 text-gray-600 border-gray-200'
                return (
                  <div key={event.id} className="relative z-10 flex gap-3 items-start">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 shadow-sm bg-white z-10',
                        colorClass,
                      )}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[10px] py-0.5 px-2 font-bold bg-opacity-10 border-transparent',
                            colorClass.split(' ')[0],
                            colorClass.split(' ')[1],
                          )}
                        >
                          {event.title}
                        </Badge>
                        <span className="text-[11px] font-medium text-gray-500 whitespace-nowrap shrink-0">
                          {new Date(event.timestamp).toLocaleString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {event.userName && (
                        <span className="text-[11px] font-bold text-gray-400 block mb-1">
                          por {event.userName}
                          {event.userRole ? ` (${event.userRole})` : ''}
                        </span>
                      )}
                      <p className="text-[13px] text-gray-800 font-medium leading-snug">
                        {event.description}
                      </p>
                      {event.links && event.links.length > 0 && (
                        <div className="mt-2.5 flex flex-col gap-2">
                          {event.links.map((link, i) => (
                            <a
                              key={i}
                              href={link.startsWith('http') ? link : `https://${link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-[12px] text-blue-600 hover:text-blue-800 hover:underline break-all bg-blue-50/50 p-2 rounded-md border border-blue-100 flex items-center gap-2 w-fit max-w-full font-medium transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 shrink-0" />
                              <span className="line-clamp-1">{link}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
