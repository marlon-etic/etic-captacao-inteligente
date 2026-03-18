import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Zap, Clock, CalendarDays, Calendar } from 'lucide-react'

interface UrgencySelectorProps {
  value: string
  onChange: (value: string) => void
}

export function UrgencySelector({ value, onChange }: UrgencySelectorProps) {
  const options = [
    { value: 'Urgente', label: 'Urgente (Imediato)', icon: Zap, color: 'text-red-500' },
    { value: 'Até 15 dias', label: 'Até 15 dias', icon: Clock, color: 'text-orange-500' },
    { value: 'Até 30 dias', label: 'Até 30 dias', icon: CalendarDays, color: 'text-blue-500' },
    {
      value: 'Até 90 dias ou +',
      label: 'Até 90 dias ou +',
      icon: Calendar,
      color: 'text-gray-500',
    },
  ]

  return (
    <RadioGroup
      onValueChange={onChange}
      value={value}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3"
    >
      {options.map((opt) => (
        <div key={opt.value}>
          <RadioGroupItem value={opt.value} id={`urgency-${opt.value}`} className="peer sr-only" />
          <Label
            htmlFor={`urgency-${opt.value}`}
            className="flex items-center gap-3 rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all min-h-[48px]"
          >
            <opt.icon className={`h-5 w-5 ${opt.color}`} />
            <span className="font-semibold">{opt.label}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
