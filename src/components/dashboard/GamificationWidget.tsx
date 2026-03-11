import { Trophy, Zap, ShieldCheck, Star, Flame, Target, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { User, BadgeType } from '@/types'
import { cn } from '@/lib/utils'

const BADGES_CONFIG: {
  id: BadgeType
  icon: any
  target: number
  inverse?: boolean
  color: string
  val: (u: User) => number
  label: string
}[] = [
  {
    id: '🏆 Especialista',
    label: 'Especialista',
    icon: Trophy,
    target: 100,
    color: 'text-yellow-500',
    val: (u) => u.stats.imoveisCaptados,
  },
  {
    id: '🚀 Rastreador Rápido',
    label: 'Rápido',
    icon: Zap,
    target: 18,
    inverse: true,
    color: 'text-blue-500',
    val: (u) => (u.stats.responseCount ? u.stats.responseTimeSum / u.stats.responseCount : 99),
  },
  {
    id: '💎 Sem Demandas Abertas',
    label: 'Em Dia',
    icon: ShieldCheck,
    target: 7,
    color: 'text-cyan-500',
    val: (u) => u.stats.diasSemDemandaPendente,
  },
  {
    id: '⭐ Negociador Estrela',
    label: 'Estrela',
    icon: Star,
    target: 5,
    color: 'text-amber-500',
    val: (u) => u.stats.negociosFechados,
  },
  {
    id: '🔥 Semana de Ouro',
    label: 'Ouro',
    icon: Flame,
    target: 10,
    color: 'text-orange-500',
    val: (u) => u.stats.imoveisCaptadosSemana,
  },
  {
    id: '🎯 Perfeccionista',
    label: 'Perfeito',
    icon: Target,
    target: 14,
    color: 'text-rose-500',
    val: (u) => u.stats.streakRespostasRapidas,
  },
]

export function GamificationWidget({ currentUser }: { currentUser: User }) {
  const currentBadges = currentUser.badges || []

  // Find next badge
  let nextBadge = null
  let maxProgress = -1

  for (const b of BADGES_CONFIG) {
    if (currentBadges.includes(b.id)) continue
    const v = b.val(currentUser)
    let p = b.inverse
      ? v <= b.target
        ? 100
        : Math.max(0, ((36 - v) / (36 - b.target)) * 100)
      : (v / b.target) * 100
    if (p > maxProgress && p < 100) {
      maxProgress = p
      nextBadge = { ...b, progress: p, val: v }
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-5 flex items-center justify-between h-full">
          <div>
            <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-1">
              Pontos de Hoje
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black">{currentUser.dailyPoints}</span>
              <span className="text-sm font-medium text-muted-foreground uppercase">pts</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Semanal: {currentUser.weeklyPoints} | Mensal: {currentUser.monthlyPoints}
            </p>
          </div>
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center text-primary shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-1">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
            Minhas Insígnias{' '}
            <span className="bg-muted px-2 py-0.5 rounded-full text-xs text-foreground">
              {currentBadges.length}/{BADGES_CONFIG.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="flex gap-3 items-center overflow-x-auto pb-2 scrollbar-hide">
            {BADGES_CONFIG.map((b) => {
              const earned = currentBadges.includes(b.id)
              return (
                <div
                  key={b.id}
                  className={cn(
                    'flex flex-col items-center gap-1 min-w-[60px]',
                    earned ? 'opacity-100' : 'opacity-30 grayscale',
                  )}
                  title={b.id}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center bg-muted border-2',
                      earned
                        ? `border-current ${b.color} bg-background shadow-sm`
                        : 'border-transparent',
                    )}
                  >
                    <b.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-medium text-center leading-tight">
                    {b.label}
                  </span>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold text-muted-foreground">
            Próxima Conquista
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4 flex flex-col justify-center h-[calc(100%-40px)] gap-3">
          {nextBadge ? (
            <>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${nextBadge.color}`}>
                  <nextBadge.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{nextBadge.id}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {nextBadge.inverse
                      ? `Atingir média de ${nextBadge.target}h`
                      : `${Math.floor(nextBadge.val)} / ${nextBadge.target} concluído`}
                  </p>
                </div>
              </div>
              <Progress value={nextBadge.progress} className="h-2" />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center text-muted-foreground h-full gap-2">
              <Trophy className="w-6 h-6 text-yellow-500 opacity-50" />
              <p className="text-xs">Todas as insígnias conquistadas!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
