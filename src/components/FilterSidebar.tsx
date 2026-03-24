import { useState } from 'react'
import { FilterDef } from './StickyFilterBar'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Filter, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LocationSelector } from '@/components/LocationSelector'

interface Props {
  filters: FilterDef[]
  values: Record<string, string>
  onChange: (values: Record<string, string>) => void
  resultsCount: number
}

export function FilterSidebar({ filters, values, onChange, resultsCount }: Props) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  const defaultValues = filters.reduce(
    (acc, f) => {
      acc[f.id] = f.options[0]?.value || ''
      return acc
    },
    {} as Record<string, string>,
  )

  const activeCount = Object.keys(values).filter((k) => values[k] !== defaultValues[k]).length

  const handleClearAll = () => onChange(defaultValues)

  if (isCollapsed) {
    return (
      <aside className="hidden lg:flex w-[64px] shrink-0 flex-col sticky top-[88px] bg-[#FFFFFF] border-[2px] border-[#E5E5E5] rounded-[12px] shadow-[0_4px_12px_rgba(26,58,82,0.05)] overflow-hidden h-[calc(100vh-120px)] animate-fade-in z-[50] items-center py-4 gap-6 transition-all duration-300">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsCollapsed(false)}
          className="h-10 w-10 shrink-0 hover:bg-[#F5F5F5] transition-transform hover:scale-110"
          title="Expandir Filtros"
        >
          <ChevronRight className="w-5 h-5 text-[#1A3A52]" />
        </Button>
        <div
          className="flex-1 flex flex-col items-center justify-center gap-6 cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
          onClick={() => setIsCollapsed(false)}
        >
          <Filter className="w-5 h-5 text-[#1A3A52]" />
          <div
            className="text-[#1A3A52] font-black text-[13px] tracking-widest uppercase rotate-180 select-none"
            style={{ writingMode: 'vertical-rl' }}
          >
            Filtros
          </div>
        </div>
        {activeCount > 0 && (
          <Badge className="bg-[#1A3A52] text-white border-none shadow-sm">{activeCount}</Badge>
        )}
      </aside>
    )
  }

  return (
    <aside className="hidden lg:flex w-[260px] shrink-0 flex-col sticky top-[88px] bg-[#FFFFFF] border-[2px] border-[#E5E5E5] rounded-[12px] shadow-[0_4px_12px_rgba(26,58,82,0.05)] overflow-hidden h-[calc(100vh-120px)] animate-fade-in z-[50] transition-all duration-300">
      <div className="p-4 border-b border-[#E5E5E5] bg-[#F5F5F5] flex items-center justify-between shrink-0">
        <h3 className="font-black text-[#1A3A52] flex items-center gap-2 uppercase tracking-wide text-[14px]">
          <Filter className="w-4 h-4" /> Filtros
        </h3>
        <div className="flex items-center gap-2">
          {activeCount > 0 && (
            <Badge className="bg-[#1A3A52] text-white border-none shadow-sm">{activeCount}</Badge>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(true)}
            className="h-8 w-8 hover:bg-[#E5E5E5] transition-transform hover:scale-110"
            title="Recolher Filtros"
          >
            <ChevronLeft className="w-4 h-4 text-[#666666]" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4 bg-white">
        <div className="space-y-6 pb-4">
          {filters.map((f) => (
            <div key={f.id} className="space-y-3">
              <Label className="text-[12px] font-bold text-[#999999] uppercase tracking-wider">
                {f.label}
              </Label>
              {f.isSearch ? (
                <LocationSelector
                  value={
                    values[f.id] && values[f.id] !== '' && values[f.id] !== 'all'
                      ? values[f.id].split(',')
                      : []
                  }
                  onChange={(val) => onChange({ ...values, [f.id]: val.join(',') })}
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  {f.options.map((o) => {
                    const isSelected = values[f.id] === o.value
                    return (
                      <button
                        key={o.value}
                        onClick={() => onChange({ ...values, [f.id]: o.value })}
                        className={cn(
                          'flex items-center gap-2 w-full text-left px-3 min-h-[44px] rounded-[8px] transition-colors text-[13px] font-bold border border-transparent',
                          isSelected
                            ? 'bg-[#1A3A52] text-white shadow-sm'
                            : 'text-[#333333] bg-[#F5F5F5]/50 hover:bg-[#F5F5F5] hover:border-[#E5E5E5]',
                        )}
                      >
                        {o.icon && <span className="text-[16px] shrink-0">{o.icon}</span>}
                        <span className="truncate">{o.label}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-[#E5E5E5] bg-[#FFFFFF] shrink-0 flex flex-col gap-3">
        <p className="text-[12px] text-center text-[#999999] font-medium leading-tight">
          {resultsCount} resultado{resultsCount !== 1 && 's'}
        </p>
        {activeCount > 0 && (
          <Button
            variant="outline"
            onClick={handleClearAll}
            className="w-full text-[#F44336] border-[#F44336]/30 hover:bg-[#F44336]/10 font-bold min-h-[44px] text-[13px]"
          >
            <X className="w-4 h-4 mr-2" /> Limpar filtros
          </Button>
        )}
      </div>
    </aside>
  )
}
