export interface CaptadorColor {
  name: string
  bg: string
  text: string
  ring: string
  dot: string
  light: string
  border: string
}

export const CAPTADOR_COLORS: CaptadorColor[] = [
  {
    name: 'blue',
    bg: 'bg-blue-500',
    text: 'text-blue-600',
    ring: 'ring-blue-400',
    dot: 'bg-blue-500',
    light: 'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    name: 'green',
    bg: 'bg-green-500',
    text: 'text-green-600',
    ring: 'ring-green-400',
    dot: 'bg-green-500',
    light: 'bg-green-50',
    border: 'border-green-200',
  },
  {
    name: 'red',
    bg: 'bg-red-500',
    text: 'text-red-600',
    ring: 'ring-red-400',
    dot: 'bg-red-500',
    light: 'bg-red-50',
    border: 'border-red-200',
  },
  {
    name: 'yellow',
    bg: 'bg-yellow-500',
    text: 'text-yellow-600',
    ring: 'ring-yellow-400',
    dot: 'bg-yellow-500',
    light: 'bg-yellow-50',
    border: 'border-yellow-200',
  },
  {
    name: 'purple',
    bg: 'bg-purple-500',
    text: 'text-purple-600',
    ring: 'ring-purple-400',
    dot: 'bg-purple-500',
    light: 'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    name: 'orange',
    bg: 'bg-orange-500',
    text: 'text-orange-600',
    ring: 'ring-orange-400',
    dot: 'bg-orange-500',
    light: 'bg-orange-50',
    border: 'border-orange-200',
  },
  {
    name: 'pink',
    bg: 'bg-pink-500',
    text: 'text-pink-600',
    ring: 'ring-pink-400',
    dot: 'bg-pink-500',
    light: 'bg-pink-50',
    border: 'border-pink-200',
  },
  {
    name: 'cyan',
    bg: 'bg-cyan-500',
    text: 'text-cyan-600',
    ring: 'ring-cyan-400',
    dot: 'bg-cyan-500',
    light: 'bg-cyan-50',
    border: 'border-cyan-200',
  },
  {
    name: 'lime',
    bg: 'bg-lime-500',
    text: 'text-lime-600',
    ring: 'ring-lime-400',
    dot: 'bg-lime-500',
    light: 'bg-lime-50',
    border: 'border-lime-200',
  },
  {
    name: 'indigo',
    bg: 'bg-indigo-500',
    text: 'text-indigo-600',
    ring: 'ring-indigo-400',
    dot: 'bg-indigo-500',
    light: 'bg-indigo-50',
    border: 'border-indigo-200',
  },
  {
    name: 'violet',
    bg: 'bg-violet-500',
    text: 'text-violet-600',
    ring: 'ring-violet-400',
    dot: 'bg-violet-500',
    light: 'bg-violet-50',
    border: 'border-violet-200',
  },
  {
    name: 'amber',
    bg: 'bg-amber-500',
    text: 'text-amber-600',
    ring: 'ring-amber-400',
    dot: 'bg-amber-500',
    light: 'bg-amber-50',
    border: 'border-amber-200',
  },
]

export function getCaptadorColor(userId: string): CaptadorColor {
  if (!userId) return CAPTADOR_COLORS[0]
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) - hash + userId.charCodeAt(i)
    hash = hash & hash
  }
  return CAPTADOR_COLORS[Math.abs(hash) % CAPTADOR_COLORS.length]
}

export function getCaptadorInitials(name: string): string {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}
