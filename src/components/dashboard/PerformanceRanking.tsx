import { useState, useEffect, useRef, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star } from 'lucide-react'
import { User, BadgeType } from '@/types'
import { cn } from '@/lib/utils'
import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'

export function PerformanceRanking({ currentUser, users }: { currentUser: User; users: User[] }) {
  const { pontuacoes } = useSupabasePontuacao()

  const stats = useMemo(() => {
    let pts = 0
    const map = new Map<string, number>()
    users.filter((u) => u.role === 'captador').forEach((u) => map.set(u.id, 0))
    pontuacoes.forEach((p) => {
      if (map.has(p.captador_id)) {
        map.set(p.captador_id, (map.get(p.captador_id) || 0) + p.pontos)
      }
      if (p.captador_id === currentUser.id) pts += p.pontos
    })
    const rankingList = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const pos = rankingList.findIndex((x) => x[0] === currentUser.id) + 1 || 1
    return { pts, pos, total: users.filter((u) => u.role === 'captador').length }
  }, [pontuacoes, currentUser.id, users])

  const [flipPos, setFlipPos] = useState(false)
  const prevPos = useRef(stats.pos)

  useEffect(() => {
    if (prevPos.current !== stats.pos) {
      setFlipPos(true)
      const t = setTimeout(() => setFlipPos(false), 400)
      return () => clearTimeout(t)
    }
    prevPos.current = stats.pos
  }, [stats.pos])

  const currentPoints = stats.pts
  const levelTarget = Math.ceil((currentPoints + 1) / 500) * 500
  const pointsNeeded = levelTarget - currentPoints
  const progressToNext = ((currentPoints % 500) / 500) * 100

  // Badges logic
  const earned = currentUser.badges || []
  const allBadges: BadgeType[] = [
    '🏆 Especialista',
    '🚀 Rastreador Rápido',
    '💎 Sem Demandas Abertas',
    '⭐ Negociador Estrela',
    '🔥 Semana de Ouro',
    '🎯 Perfeccionista',
  ]
  const missing = allBadges.filter((b) => !earned.includes(b))
  const upcoming = missing[0] || null
  let upcomingText = ''
  if (upcoming === '⭐ Negociador Estrela')
    upcomingText = `faltam ${Math.max(0, 5 - currentUser.stats.negociosFechados)} negócios`
  else if (upcoming === '🏆 Especialista')
    upcomingText = `faltam ${Math.max(0, 100 - currentUser.stats.imoveisCaptados)} imóveis`
  else upcomingText = 'continue se esforçando'

  return (
    <Card className="h-full flex flex-col shadow-sm border-2 border-[#1A3A52]/10 bg-[#FFFFFF]">
      <CardHeader className="pb-4 border-b bg-[#F8FAFC]">
        <CardTitle className="text-[15px] font-black text-[#1A3A52] uppercase tracking-wider">
          Ranking e Conquistas
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 pt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E5E5] text-center sm:text-left transition-all duration-150 hover:shadow-md hover:border-[#1A3A52]/30">
          <div className="w-14 h-14 shrink-0 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-200 flex items-center justify-center text-yellow-600 shadow-inner">
            <Trophy className="w-7 h-7 drop-shadow-sm" />
          </div>
          <div className="flex-1 overflow-hidden w-full">
            <p className="font-black text-[18px] text-[#1A3A52] leading-tight flex items-center justify-center sm:justify-start gap-1 flex-wrap">
              🏆 Posição
              <span
                className={cn(
                  'inline-block text-[#10B981]',
                  flipPos && 'animate-flip-in text-[#EF4444]',
                )}
              >
                {stats.pos}
              </span>
              de {Math.max(1, stats.total)}
            </p>
            <p className="text-[13px] text-[#666666] font-bold mt-1.5 flex items-center justify-center sm:justify-start gap-1">
              <Star className="w-4 h-4 text-[#10B981] fill-[#10B981] animate-pulse" />{' '}
              <span className="text-[#1A3A52] font-black">{currentPoints}</span> pts acumulados
            </p>
          </div>
        </div>

        <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E5E5E5]">
          <div className="flex justify-between text-[12px] mb-2.5 font-bold">
            <span className="text-[#666666]">🎯 Meta de Nível: {levelTarget} pts</span>
            <span className="text-[#10B981]">Faltam {pointsNeeded}</span>
          </div>
          <Progress
            value={progressToNext}
            className="h-2.5 bg-[#E5E5E5]"
            indicatorClassName="bg-[#10B981]"
          />
        </div>

        <div className="pt-2 flex-1 flex flex-col">
          <h4 className="text-[11px] font-black mb-3 text-[#999999] uppercase tracking-wider">
            Insígnias Conquistadas
          </h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {earned.length === 0 && (
              <span className="text-[12px] text-[#999999] font-medium">
                Nenhuma insígnia conquistada ainda.
              </span>
            )}
            {earned.map((b) => (
              <Badge
                key={b}
                variant="secondary"
                className="bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 py-1.5 px-3 shadow-sm transition-transform hover:scale-105 duration-150 text-[11px]"
              >
                {b}
              </Badge>
            ))}
          </div>

          <div className="mt-auto">
            {upcoming && (
              <>
                <h4 className="text-[11px] font-black mb-2 text-[#999999] uppercase tracking-wider">
                  Próximo Desafio
                </h4>
                <div className="bg-[#F8FAFC] p-3.5 rounded-xl text-sm flex items-center justify-between border border-[#E5E5E5] shadow-sm hover:border-[#1A3A52]/20 transition-colors">
                  <span className="font-bold text-[#666666] opacity-70 grayscale flex items-center gap-2">
                    {upcoming}
                  </span>
                  <span className="text-[10px] text-[#999999] font-bold uppercase tracking-wider">
                    {upcomingText}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
