import { useMemo, useEffect, useRef, useState } from 'react'
import { Trophy, Zap, ShieldCheck, Star, Flame, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { User, BadgeType } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'

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
  const { pontuacoes } = useSupabasePontuacao()

  const currentPoints = useMemo(() => {
    return pontuacoes
      .filter((p) => p.captador_id === currentUser.id)
      .reduce((a, b) => a + b.pontos, 0)
  }, [pontuacoes, currentUser.id])

  const stats = useMemo(() => {
    const map = new Map<string, number>()
    users.filter((u) => u.role === 'captador').forEach((u) => map.set(u.id, 0))
    pontuacoes.forEach((p) => {
      if (map.has(p.captador_id)) {
        map.set(p.captador_id, (map.get(p.captador_id) || 0) + p.pontos)
      }
    })
    const rankingList = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const pos = rankingList.findIndex((x) => x[0] === currentUser.id) + 1 || 1
    return { pos, total: users.filter((u) => u.role === 'captador').length }
  }, [pontuacoes, users, currentUser.id])

  const currentBadges = currentUser.badges || []
  const prevPoints = useRef(currentPoints)
  const [floatPoints, setFloatPoints] = useState<{ id: number; val: number }[]>([])

  useEffect(() => {
    if (currentPoints > prevPoints.current) {
      const diff = currentPoints - prevPoints.current
      const newId = Date.now()
      setFloatPoints((p) => [...p, { id: newId, val: diff }])
      setTimeout(() => setFloatPoints((p) => p.filter((x) => x.id !== newId)), 1500)
    }
    prevPoints.current = currentPoints
  }, [currentPoints])

  const position = stats.pos
  const totalCap = Math.max(1, stats.total)

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
    <Card className="bg-gradient-to-r from-[#1A3A52] to-[#2a5a7d] text-[#FFFFFF] border-0 shadow-md p-4 md:p-5 lg:p-6 rounded-xl overflow-hidden relative transition-transform duration-150 hover:shadow-lg">
      <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
      <CardContent className="p-0 relative z-10 flex flex-col lg:flex-row gap-4 lg:gap-6 justify-between">
        <div className="flex flex-col flex-1">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold uppercase tracking-wider mb-2 text-white/70 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            Pontos Oficiais
          </p>
          <div className="flex items-baseline gap-2 relative">
            <span className="text-[28px] md:text-[32px] lg:text-[36px] font-black leading-[32px] md:leading-[36px] lg:leading-[40px] tracking-tight transition-all duration-300">
              {currentPoints.toLocaleString('pt-BR')}
            </span>
            <span className="text-[14px] md:text-[16px] font-bold uppercase text-[#10B981] leading-[20px] md:leading-[24px]">
              pts
            </span>
            {floatPoints.map((fp) => (
              <span
                key={fp.id}
                className="absolute left-full ml-3 bottom-2 text-[#10B981] font-black text-2xl animate-float-up pointer-events-none drop-shadow-md whitespace-nowrap"
              >
                +{fp.val}
              </span>
            ))}
          </div>
          <div className="mt-4 inline-flex items-center bg-white/10 px-3 py-1.5 rounded-full w-fit min-h-[32px] hover:bg-white/20 transition-colors border border-white/5">
            <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
            <span className="text-[12px] md:text-[13px] lg:text-[14px] font-bold leading-[16px] md:leading-[18px] lg:leading-[20px] tracking-wide">
              Ranking: {position}º de {totalCap}
            </span>
          </div>
        </div>

        <div className="flex flex-col flex-1 bg-black/20 p-4 rounded-xl backdrop-blur-sm min-h-[100px] hover:bg-black/30 transition-colors border border-white/5">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold uppercase mb-3 text-white/70 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            Próximo Badge
          </p>
          {nextBadge ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-[44px] h-[44px] md:w-[48px] md:h-[48px] bg-white/10 rounded-full flex items-center justify-center shrink-0">
                  <nextBadge.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] md:text-[16px] lg:text-[18px] font-bold leading-[20px] md:leading-[24px] lg:leading-[28px] truncate">
                    {nextBadge.label}
                  </p>
                  <p className="text-[12px] md:text-[13px] lg:text-[14px] text-white/60 leading-[16px] md:leading-[18px] lg:leading-[20px] mt-0.5 font-medium">
                    {Math.floor(nextBadge.val)} / {nextBadge.target}
                  </p>
                </div>
              </div>
              <Progress
                value={nextBadge.progress}
                className="h-2 bg-white/10"
                indicatorClassName="bg-yellow-500"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-[#10B981] font-bold text-[14px] md:text-[16px] leading-[20px] md:leading-[24px] animate-pulse">
              Todos os badges conquistados! 🎉
            </div>
          )}
        </div>

        <div className="flex flex-col w-full lg:w-auto mt-2 lg:mt-0">
          <p className="text-[12px] md:text-[13px] lg:text-[14px] font-bold uppercase text-white/70 mb-3 leading-[16px] md:leading-[18px] lg:leading-[20px]">
            Minhas Insígnias
          </p>
          <div className="flex gap-2.5 flex-wrap">
            {BADGES_CONFIG.slice(0, 5).map((b, i) => {
              const earned = currentBadges.includes(b.id)
              return (
                <div
                  key={b.id}
                  className={cn(
                    'w-[44px] h-[44px] md:w-[48px] md:h-[48px] rounded-full flex items-center justify-center transition-all shrink-0 hover:scale-110',
                    earned
                      ? 'bg-white shadow-lg animate-bounce-badge border-2 border-transparent'
                      : 'bg-white/5 opacity-40 grayscale border border-white/10',
                  )}
                  style={{ animationDelay: `${i * 100}ms` }}
                  title={b.label}
                >
                  <b.icon
                    className={cn(
                      'w-5 h-5 md:w-6 md:h-6',
                      earned ? 'text-[#1A3A52]' : 'text-white/50',
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
