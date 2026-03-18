import { useState } from 'react'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Zap, Clock, CalendarDays, Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/hooks/use-mobile'

interface UrgencySelectorProps {
  value: string
  onChange: (value: string) => void
  error?: boolean
}

const OPTIONS = [
  { value: 'Urgente', label: 'Urgente (Imediato)', icon: Zap, color: 'text-red-500' },
  { value: 'Até 15 dias', label: 'Até 15 dias', icon: Clock, color: 'text-orange-500' },
  { value: 'Até 30 dias', label: 'Até 30 dias', icon: CalendarDays, color: 'text-blue-500' },
  { value: 'Até 90 dias ou +', label: 'Até 90 dias ou +', icon: Calendar, color: 'text-gray-500' },
]

export function UrgencySelector({ value, onChange, error }: UrgencySelectorProps) {
  const [open, setOpen] = useState(false)
  const isMobile = useIsMobile()
  const selected = OPTIONS.find((o) => o.value === value)
  const Icon = selected?.icon

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className={cn(
            'flex h-[48px] w-full items-center justify-between rounded-[8px] border bg-[#FFFFFF] px-[16px] text-[16px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1A3A52]',
            error ? 'border-2 border-[#FF4444]' : 'border-[#E0E0E0] hover:border-[#1A3A52]',
          )}
        >
          {selected ? (
            <span className="flex items-center gap-2 text-[#333333] font-medium">
              <Icon className={cn('h-5 w-5', selected.color)} /> {selected.label}
            </span>
          ) : (
            <span className="text-[#999999] font-medium ml-1">Selecione a urgência...</span>
          )}
          <ChevronDown className="h-4 w-4 text-[#1A3A52] opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className={cn('p-0 z-[9999]', isMobile ? 'w-[calc(100vw-32px)]' : 'w-[300px]')}
        align="start"
      >
        <Command>
          <CommandList className="max-h-[200px] overflow-y-auto">
            <CommandGroup>
              {OPTIONS.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={() => {
                    onChange(opt.value)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-[#F5F5F5] min-h-[48px]"
                >
                  <opt.icon className={cn('h-5 w-5', opt.color)} />
                  <span className="font-medium text-[#333333] text-[16px]">{opt.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
