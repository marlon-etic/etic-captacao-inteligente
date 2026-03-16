import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Trophy, Star, Target, ShieldCheck, Zap, Flame } from 'lucide-react'
import { User, BadgeType } from '@/types'
import { cn } from '@/lib/utils'

export function PerformanceRanking({ currentUser, users }: { currentUser: User; users: User[] }) {
  const captadores = users.filter((u) => u.role === 'captador').sort((a, b) => b.points - a.points)
  const position = captadores.findIndex((u) => u.id === currentUser.id) + 1 || 1
  const totalCap = captadores.length || 1

  const [flipPos, setFlipPos] = useState(false)
  const prevPos = useRef(position)

  useEffect(() => {
    if (prevPos.current !== position) {
      setFlipPos(true)
      const t = setTimeout(() => setFlipPos(false), 400)
      return () => clearTimeout(t)
    }
    prevPos.current = position
  }, [position])

  const currentPoints = currentUser.points
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
    <Card className="h-full flex flex-col shadow-sm border-2 border-primary/10">
      <CardHeader className="pb-4 border-b bg-muted/20">
        <CardTitle className="text-lg">Ranking e Conquistas</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-6 pt-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 bg-primary/5 p-4 rounded-xl border border-primary/20 text-center sm:text-left transition-all duration-150 hover:shadow-md">
          <div className="w-14 h-14 shrink-0 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 shadow-inner">
            <Trophy className="w-7 h-7" />
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="font-bold text-lg leading-tight flex items-center justify-center sm:justify-start gap-1 flex-wrap">
              🏆 Posição
              <span
                className={cn('inline-block', flipPos && 'animate-flip-in text-red-600 font-black')}
              >
                {position}
              </span>
              de {totalCap} captadores
            </p>
            <p className="text-muted-foreground font-medium mt-1 flex items-center justify-center sm:justify-start gap-1">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> ⭐{' '}
              {currentPoints} pontos acumulados
            </p>
          </div>
        </div>

        <div className="bg-muted/30 p-4 rounded-lg border border-border/50">
          <div className="flex justify-between text-sm mb-2 font-medium">
            <span className="text-muted-foreground">
              🎯 Faltam {pointsNeeded} pontos para próximo nível
            </span>
          </div>
          <Progress
            value={progressToNext}
            className="h-2.5 bg-muted"
            indicatorClassName="bg-amber-500"
          />
        </div>

        <div className="pt-2 flex-1 flex flex-col">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
            Insígnias Conquistadas
          </h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {earned.length === 0 && (
              <span className="text-xs text-muted-foreground">Nenhuma insígnia ainda.</span>
            )}
            {earned.map((b) => (
              <Badge
                key={b}
                variant="secondary"
                className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 py-1 px-2 shadow-sm transition-transform hover:scale-105 duration-150"
              >
                {b}
              </Badge>
            ))}
          </div>

          <div className="mt-auto">
            {upcoming && (
              <>
                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wide">
                  Próximo Desafio
                </h4>
                <div className="bg-muted p-3 rounded-lg text-sm flex items-center justify-between border shadow-sm">
                  <span className="font-semibold opacity-70 grayscale">{upcoming}</span>
                  <span className="text-xs text-muted-foreground font-medium">
                    ({upcomingText})
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
