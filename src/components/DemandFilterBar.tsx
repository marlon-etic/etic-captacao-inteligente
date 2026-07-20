import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Calendar, Filter, CheckCircle2, XCircle, LayoutGrid } from 'lucide-react'

export type DateRange = 'today' | '7days' | '30days' | 'all'
export type StatusFilter = 'active' | 'inactive' | 'all'

interface Props {
  dateRange: DateRange
  onDateRangeChange: (val: DateRange) => void
  statusFilter: StatusFilter
  onStatusFilterChange: (val: StatusFilter) => void
  resultsCount?: number
  className?: string
}

const dateOptions: { value: DateRange; label: string; icon?: string }[] = [
  { value: 'today', label: 'Hoje' },
  { value: '7days', label: '7 dias' },
  { value: '30days', label: '30 dias' },
  { value: 'all', label: 'Tudo' },
]

const statusOptions: { value: StatusFilter; label: string }[] = [
  { value: 'active', label: 'Ativas' },
  { value: 'inactive', label: 'Perdidas' },
  { value: 'all', label: 'Todas' },
]

export function DemandFilterBar({
  dateRange,
  onDateRangeChange,
  statusFilter,
  onStatusFilterChange,
  resultsCount,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-white border border-[#E5E5E5] rounded-[12px] shadow-[0_2px_8px_rgba(26,58,82,0.05)]',
        className,
      )}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Filter className="w-4 h-4 text-[#1A3A52]" />
        <span className="font-black text-[#1A3A52] text-[13px] uppercase tracking-wide hidden sm:inline">
          Filtros
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <Calendar className="w-3.5 h-3.5 text-[#999999] shrink-0" />
        {dateOptions.map((opt) => (
          <Button
            key={opt.value}
            variant="outline"
            size="sm"
            className={cn(
              'h-[36px] px-3 text-[12px] font-bold border-[2px] transition-all',
              dateRange === opt.value
                ? 'bg-[#1A3A52] text-white border-[#1A3A52] shadow-[0_2px_8px_rgba(26,58,82,0.2)]'
                : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-[#1A3A52]/30 hover:bg-[#F5F5F5]',
            )}
            onClick={() => onDateRangeChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap sm:ml-auto">
        {statusOptions.map((opt) => {
          const isActive = statusFilter === opt.value
          const icon =
            opt.value === 'active' ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : opt.value === 'inactive' ? (
              <XCircle className="w-3.5 h-3.5" />
            ) : (
              <LayoutGrid className="w-3.5 h-3.5" />
            )
          return (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              className={cn(
                'h-[36px] px-3 text-[12px] font-bold border-[2px] transition-all flex items-center gap-1.5',
                isActive
                  ? opt.value === 'active'
                    ? 'bg-[#10B981] text-white border-[#10B981] shadow-[0_2px_8px_rgba(16,185,129,0.2)]'
                    : opt.value === 'inactive'
                      ? 'bg-[#EF4444] text-white border-[#EF4444] shadow-[0_2px_8px_rgba(239,68,68,0.2)]'
                      : 'bg-[#1A3A52] text-white border-[#1A3A52]'
                  : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-[#1A3A52]/30 hover:bg-[#F5F5F5]',
              )}
              onClick={() => onStatusFilterChange(opt.value)}
            >
              {icon}
              {opt.label}
            </Button>
          )
        })}
      </div>

      {resultsCount !== undefined && (
        <span className="text-[12px] font-bold text-[#999999] shrink-0 whitespace-nowrap">
          {resultsCount} resultado{resultsCount !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  )
}
