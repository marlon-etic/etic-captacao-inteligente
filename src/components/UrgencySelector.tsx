import React from 'react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Flame, Clock, CalendarDays, Calendar, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

export const urgencyOptions = [
  {
    value: 'Urgente',
    label: 'Urgente',
    desc: 'Hoje ou amanhã',
    colorClass: 'text-red-600',
    bgClass: 'bg-red-50',
    activeClass: 'ring-2 ring-red-500 border-red-500',
    indicatorClass: 'bg-red-600',
    icon: Flame,
  },
  {
    value: 'Até 15 dias',
    label: 'Até 15 dias',
    desc: 'Até 15 dias',
    colorClass: 'text-orange-600',
    bgClass: 'bg-orange-50',
    activeClass: 'ring-2 ring-orange-500 border-orange-500',
    indicatorClass: 'bg-orange-600',
    icon: Clock,
  },
  {
    value: 'Até 30 dias',
    label: 'Até 30 dias',
    desc: 'Até 30 dias',
    colorClass: 'text-yellow-600',
    bgClass: 'bg-yellow-50',
    activeClass: 'ring-2 ring-yellow-500 border-yellow-500',
    indicatorClass: 'bg-yellow-500',
    icon: CalendarDays,
  },
  {
    value: 'Até 60 dias',
    label: 'Até 60 dias',
    desc: 'Até 60 dias',
    colorClass: 'text-emerald-600',
    bgClass: 'bg-emerald-50',
    activeClass: 'ring-2 ring-emerald-500 border-emerald-500',
    indicatorClass: 'bg-emerald-600',
    icon: Calendar,
  },
  {
    value: 'Até 90 dias ou +',
    label: 'Até 90 dias ou +',
    desc: 'Sem pressa',
    colorClass: 'text-blue-600',
    bgClass: 'bg-blue-50',
    activeClass: 'ring-2 ring-blue-500 border-blue-500',
    indicatorClass: 'bg-blue-600',
    icon: CalendarClock,
  },
]

export function UrgencySelector({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <RadioGroup
      value={value}
      onValueChange={onChange}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-1"
    >
      {urgencyOptions.map((opt) => {
        const isSelected = value === opt.value
        const Icon = opt.icon
        return (
          <Label
            key={opt.value}
            htmlFor={`urgency-${opt.value}`}
            className={cn(
              'flex flex-col items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 relative group overflow-hidden',
              isSelected
                ? `${opt.activeClass} ${opt.bgClass}`
                : 'border-border hover:border-muted-foreground/30 hover:bg-muted/30',
            )}
          >
            <RadioGroupItem value={opt.value} id={`urgency-${opt.value}`} className="sr-only" />
            <div className="flex items-center justify-between w-full">
              <div
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  isSelected ? 'bg-background shadow-sm' : opt.bgClass,
                )}
              >
                <Icon className={cn('w-5 h-5', opt.colorClass)} />
              </div>
              {isSelected && (
                <div
                  className={cn(
                    'w-3 h-3 rounded-full shadow-sm animate-fade-in',
                    opt.indicatorClass,
                  )}
                />
              )}
            </div>
            <div className="mt-1">
              <p
                className={cn('font-bold text-sm', isSelected ? opt.colorClass : 'text-foreground')}
              >
                {opt.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-tight">{opt.desc}</p>
            </div>
          </Label>
        )
      })}
    </RadioGroup>
  )
}
