import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

export function PrazoCounter({
  prazoResposta,
  isExpired,
}: {
  prazoResposta: string
  isExpired?: boolean
}) {
  const [timeLeft, setTimeLeft] = useState({ hours: 0, mins: 0, expired: false })

  useEffect(() => {
    const calc = () => {
      const target = new Date(prazoResposta).getTime()
      const now = Date.now()
      const diff = target - now

      if (diff <= 0 || isExpired) {
        setTimeLeft({ hours: 0, mins: 0, expired: true })
      } else {
        setTimeLeft({
          hours: Math.floor(diff / 3600000),
          mins: Math.floor((diff % 3600000) / 60000),
          expired: false,
        })
      }
    }
    calc()
    const i = setInterval(calc, 30000) // Update every 30s
    return () => clearInterval(i)
  }, [prazoResposta, isExpired])

  if (timeLeft.expired) {
    return (
      <Badge
        variant="destructive"
        className="font-bold text-[11px] h-[24px] flex items-center gap-1 shadow-sm px-2 animate-pulse"
      >
        <Clock className="w-3 h-3" /> VENCIDO
      </Badge>
    )
  }

  const { hours, mins } = timeLeft
  let color = 'bg-[#10B981] text-white hover:bg-[#059669]' // Green > 12h
  if (hours < 6)
    color = 'bg-[#EF4444] text-white hover:bg-[#DC2626] animate-pulse' // Red < 6h
  else if (hours < 12) color = 'bg-[#F59E0B] text-white hover:bg-[#D97706]' // Yellow 6-12h

  return (
    <Badge
      className={cn(
        'font-bold text-[11px] h-[24px] flex items-center gap-1 shadow-sm px-2 border-none transition-colors',
        color,
      )}
    >
      <Clock className="w-3 h-3" /> {hours}h {mins}m
    </Badge>
  )
}
