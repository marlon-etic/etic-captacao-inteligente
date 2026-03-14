import { Trophy, Zap, ShieldCheck, Star, Flame, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { User, BadgeType } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'

const BADGES_CONFIG: {
  id: BadgeType
  icon: any
  target: number
  inverse?: boolean
  val: (u: User) => number
  label: string
}[] = [
  {
    id: '🏆 Especialista',
    label: 'Especialista',
    icon: Trophy,
    target: 100,
    val: (u) => u.stats.imoveisCaptados,
  },
  {
    id: '🚀 Rastreador Rápido',
    label: 'Rápido',
    icon: Zap,
    target: 18,
    inverse: true,
    val: (u) => (u.stats.responseCount ? u.stats.responseTimeSum / u.stats.responseCount : 99),
  },
  {
    id: '💎 Sem Demandas Abertas',
    label: 'Em Dia',
    icon: ShieldCheck,
    target: 7,
    val: (u) => u.stats.diasSemDemandaPendente,
  },
  {
    id: '⭐ Negociador Estrela',
    label: 'Estrela',
    icon: Star,
    target: 5,
    val: (u) => u.stats.negociosFechados,
  },
  {
    id: '🔥 Semana de Ouro',
    label: 'Ouro',
    icon: Flame,
    target: 10,
    val: (u) => u.stats.imoveisCaptadosSemana,
  },
]

export function GamificationWidget({ currentUser }: { currentUser: User }) {
  const { users } = useAppStore()
  const currentBadges = currentUser.badges || []

  const captadores = users.filter((u) => u.role === 'captador').sort((a, b) => b.points - a.points)
  const position = captadores.findIndex((u) => u.id === currentUser.id) + 1 || 1
  const totalCap = captadores.length || 1

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
    <Card className="bg-gradient-to-r from-[#4444FF] to-[#00AA00] text-[#FFFFFF] border-0 shadow-md p-4 md:p-5 lg:p-6 rounded-xl overflow-hidden relative">
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <CardContent className="p-0 relative z-10 flex flex-col lg:flex-row gap-4 lg:gap-6 justify-between">
        <div className="flex flex-col flex-1">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider mb-2 text-white/90 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            Pontos Totais
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-[28px] md:text-[32px] lg:text-[36px] font-black leading-[32px] md:leading-[36px] lg:leading-[40px] tracking-tight">
              {currentUser.points.toLocaleString('pt-BR')}
            </span>
            <span className="text-[14px] md:text-[16px] font-bold uppercase text-white/80 leading-[20px] md:leading-[24px]">
              pts
            </span>
          </div>
          <div className="mt-4 inline-flex items-center bg-white/20 px-3 py-1.5 rounded-full w-fit min-h-[32px]">
            <Trophy className="w-4 h-4 mr-2" />
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-bold leading-[16px] md:leading-[18px] lg:leading-[20px]">
              Posição: {position}º de {totalCap}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 bg-black/20 p-4 rounded-xl backdrop-blur-sm min-h-[100px]">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold uppercase mb-3 text-white/90 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            Próximo Badge
          </p>
          {nextBadge ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-[44px] h-[44px] md:w-[48px] md:h-[48px] bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <nextBadge.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] md:text-[16px] lg:text-[18px] font-bold leading-[20px] md:leading-[24px] lg:leading-[28px] truncate">
                    {nextBadge.label}
                  </p>
                  <p className="text-[12px] md:text-[13px] lg:text-[14px] text-white/80 leading-[16px] md:leading-[18px] lg:leading-[20px] mt-0.5">
                    {Math.floor(nextBadge.val)} / {nextBadge.target}
                  </p>
                </div>
              </div>
              <Progress
                value={nextBadge.progress}
                className="h-2 bg-white/20"
                indicatorClassName="bg-[#FFD700]"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white/80 font-bold text-[14px] md:text-[16px] leading-[20px] md:leading-[24px]">
              Todos os badges conquistados! 🎉
            </div>
          )}
        </div>

        <div className="flex flex-col w-full lg:w-auto mt-2 lg:mt-0">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold uppercase text-white/90 mb-3 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            Minhas Insígnias
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {BADGES_CONFIG.slice(0, 5).map((b) => {
              const earned = currentBadges.includes(b.id)
              return (
                <div
                  key={b.id}
                  className={cn(
                    'w-[44px] h-[44px] md:w-[48px] md:h-[48px] rounded-full flex items-center justify-center transition-all shrink-0',
                    earned ? 'bg-white shadow-lg' : 'bg-white/10 opacity-50 grayscale',
                  )}
                  title={b.label}
                >
                  <b.icon
                    className={cn(
                      'w-5 h-5 md:w-6 md:h-6',
                      earned ? 'text-[#4444FF]' : 'text-white/50',
                    )}
                  />
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
