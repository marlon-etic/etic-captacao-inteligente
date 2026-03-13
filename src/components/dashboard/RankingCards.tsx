import { Card } from '@/components/ui/card'
import { User } from '@/types'
import { Trophy } from 'lucide-react'

export function RankingCards({ users }: { users: User[] }) {
  const staff = users
    .filter((u) => u.role === 'sdr' || u.role === 'corretor' || u.role === 'captador')
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)

  return (
    <div className="flex flex-col gap-3 mb-6 w-full">
      <h2 className="text-base sm:text-lg font-bold leading-tight mb-1">Ranking da Equipe</h2>
      {staff.map((u, i) => {
        const isGold = i === 0
        const isSilver = i === 1
        const isBronze = i === 2

        let borderClass = 'border-border bg-card'
        if (isGold) borderClass = 'border-yellow-400 bg-yellow-50/50'
        if (isSilver) borderClass = 'border-gray-400 bg-gray-50/50'
        if (isBronze) borderClass = 'border-amber-600 bg-amber-50/50'

        return (
          <Card
            key={u.id}
            className={`min-h-[80px] p-4 flex flex-col justify-center ${borderClass} shadow-sm rounded-xl hover:shadow-md transition-shadow`}
          >
            <div className="flex items-center gap-2 mb-1">
              {isGold || isSilver || isBronze ? (
                <Trophy
                  className={`w-5 h-5 shrink-0 ${
                    isGold
                      ? 'text-yellow-500 fill-yellow-500/20'
                      : isSilver
                        ? 'text-gray-400 fill-gray-400/20'
                        : 'text-amber-700 fill-amber-700/20'
                  }`}
                  aria-hidden="true"
                />
              ) : null}
              <p className="text-sm font-bold leading-tight text-foreground truncate max-w-full">
                <span className="sr-only">Posição </span>
                {i + 1}º - {u.name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground font-medium pl-7">
              <span aria-hidden="true">⭐</span> {u.points} pontos{' '}
              <span className="mx-1 opacity-50">|</span> <span aria-hidden="true">📊</span>{' '}
              {u.stats?.imoveisCaptados || 0} imóveis
            </p>
          </Card>
        )
      })}
    </div>
  )
}
