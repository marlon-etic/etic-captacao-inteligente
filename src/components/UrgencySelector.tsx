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
          <RadioGroupItem
            value={opt.value}
            id={`urgency-${opt.value}`}
            className="peer sr-only"
            onFocus={(e) => {
              setTimeout(() => {
                e.target.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' })
              }, 300)
            }}
          />
          <Label
            htmlFor={`urgency-${opt.value}`}
            className="flex items-center gap-3 rounded-[8px] border border-[#E0E0E0] bg-[#FFFFFF] p-4 hover:bg-[#F5F5F5] peer-focus-visible:ring-2 peer-focus-visible:ring-[#1A3A52] peer-focus-visible:ring-offset-2 peer-data-[state=checked]:border-2 peer-data-[state=checked]:border-[#1A3A52] cursor-pointer transition-all min-h-[48px]"
          >
            <opt.icon className={`h-5 w-5 ${opt.color}`} />
            <span className="font-semibold text-[16px] text-[#333333]">{opt.label}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  )
}
