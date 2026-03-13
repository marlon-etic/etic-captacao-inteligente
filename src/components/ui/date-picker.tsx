import * as React from 'react'
import { format } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export function DatePicker({
  date,
  setDate,
  placeholder = 'Selecione a data',
  className,
}: {
  date: Date | undefined
  setDate: (date: Date | undefined) => void
  placeholder?: string
  className?: string
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors',
            !date && 'text-muted-foreground',
            className,
          )}
        >
          <CalendarIcon className="mr-3 h-[18px] w-[18px] shrink-0 opacity-70" />
          {date ? (
            <span className="font-medium text-foreground">{format(date, 'dd/MM/yyyy')}</span>
          ) : (
            <span className="truncate">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 z-50 bg-background shadow-lg border rounded-md"
        align="start"
      >
        <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
      </PopoverContent>
    </Popover>
  )
}
