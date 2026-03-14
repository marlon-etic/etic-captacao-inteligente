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
    <Card className="bg-gradient-to-r from-[#4444FF] to-[#00AA00] text-[#FFFFFF] border-0 shadow-md p-[16px] md:p-[24px] rounded-[12px] overflow-hidden relative">
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <CardContent className="p-0 relative z-10 flex flex-col md:flex-row gap-[24px] justify-between">
        <div className="flex flex-col flex-1">
          <p className="text-[14px] font-bold uppercase tracking-wider mb-[8px] text-white/90">
            Pontos Totais
          </p>
          <div className="flex items-baseline gap-[8px]">
            <span className="text-[36px] md:text-[48px] font-black leading-none tracking-tight">
              {currentUser.points.toLocaleString('pt-BR')}
            </span>
            <span className="text-[16px] font-bold uppercase text-white/80">pts</span>
          </div>
          <div className="mt-[16px] inline-flex items-center bg-white/20 px-[12px] py-[6px] rounded-full w-fit">
            <Trophy className="w-[16px] h-[16px] mr-[8px]" />
            <span className="text-[14px] font-bold">
              Posição no Ranking: {position}º de {totalCap}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 bg-black/20 p-[16px] rounded-[12px] backdrop-blur-sm">
          <p className="text-[14px] font-bold uppercase mb-[12px] text-white/90">Próximo Badge</p>
          {nextBadge ? (
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className="w-[40px] h-[40px] bg-white/20 rounded-full flex items-center justify-center">
                  <nextBadge.icon className="w-[20px] h-[20px] text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-[16px] font-bold leading-tight">{nextBadge.label}</p>
                  <p className="text-[12px] text-white/80">
                    {Math.floor(nextBadge.val)} / {nextBadge.target} concluído
                  </p>
                </div>
              </div>
              <Progress
                value={nextBadge.progress}
                className="h-[8px] bg-white/20"
                indicatorClassName="bg-[#FFD700]"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-white/80 font-bold">
              Todos os badges conquistados! 🎉
            </div>
          )}
        </div>

        <div className="flex flex-col md:w-auto w-full">
          <p className="text-[12px] font-bold uppercase text-white/90 mb-[8px]">Minhas Insígnias</p>
          <div className="flex gap-[12px] flex-wrap md:flex-nowrap">
            {BADGES_CONFIG.slice(0, 5).map((b) => {
              const earned = currentBadges.includes(b.id)
              return (
                <div
                  key={b.id}
                  className={cn(
                    'w-[44px] h-[44px] rounded-full flex items-center justify-center transition-all',
                    earned ? 'bg-white shadow-lg' : 'bg-white/10 opacity-50 grayscale',
                  )}
                  title={b.label}
                >
                  <b.icon
                    className={cn('w-[24px] h-[24px]', earned ? 'text-[#4444FF]' : 'text-white/50')}
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
