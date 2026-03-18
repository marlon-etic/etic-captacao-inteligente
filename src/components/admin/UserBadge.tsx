import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { Role } from '@/types'

interface UserBadgeProps {
  role: Role
  className?: string
}

export function UserBadge({ role, className }: UserBadgeProps) {
  const colors = {
    captador: 'bg-[#1A3A52] text-white',
    sdr: 'bg-[#4CAF50] text-white',
    corretor: 'bg-[#FF9800] text-white',
    admin: 'bg-[#9C27B0] text-white',
    gestor: 'bg-[#607D8B] text-white',
  }

  const labels = {
    captador: 'Captador',
    sdr: 'SDR',
    corretor: 'Corretor',
    admin: 'Admin',
    gestor: 'Gestor',
  }

  return (
    <Badge
      className={cn(
        colors[role] || 'bg-gray-500 text-white',
        'border-none uppercase tracking-wider text-[10px] whitespace-nowrap',
        className,
      )}
    >
      {labels[role] || role}
    </Badge>
  )
}
