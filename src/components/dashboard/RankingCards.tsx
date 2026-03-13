import { Card } from '@/components/ui/card'
import { User } from '@/types'
import { Trophy } from 'lucide-react'

export function RankingCards({ users }: { users: User[] }) {
  const staff = users
    .filter((u) => u.role === 'sdr' || u.role === 'corretor' || u.role === 'captador')
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)

  return (
    <div className="flex flex-col gap-[12px] mb-[24px]">
      <h2 className="text-[16px] font-bold leading-[24px]">Ranking da Equipe</h2>
      {staff.map((u, i) => {
        const isGold = i === 0
        const isSilver = i === 1
        const isBronze = i === 2

        let borderClass = 'border-border bg-background'
        if (isGold) borderClass = 'border-yellow-400 bg-yellow-50/30'
        if (isSilver) borderClass = 'border-gray-400 bg-gray-50/30'
        if (isBronze) borderClass = 'border-amber-600 bg-amber-50/30'

        return (
          <Card
            key={u.id}
            className={`h-[80px] p-[16px] flex flex-col justify-center ${borderClass} shadow-sm rounded-lg`}
          >
            <div className="flex items-center gap-2 mb-1">
              {isGold || isSilver || isBronze ? (
                <Trophy
                  className={`w-[16px] h-[16px] ${
                    isGold ? 'text-yellow-500' : isSilver ? 'text-gray-400' : 'text-amber-700'
                  }`}
                />
              ) : null}
              <p className="text-[14px] font-bold leading-[20px] text-foreground truncate">
                🏆 {i + 1}º - {u.name}
              </p>
            </div>
            <p className="text-[12px] text-muted-foreground leading-[16px]">
              ⭐ {u.points} pontos | 📊 {u.stats?.imoveisCaptados || 0} imóveis
            </p>
          </Card>
        )
      })}
    </div>
  )
}
