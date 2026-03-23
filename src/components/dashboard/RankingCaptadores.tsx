import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, Medal, Award, Star } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pontuacao } from '@/hooks/use-supabase-pontuacao'
import { User } from '@/types'

interface RankingCaptadoresProps {
  pontuacoes: Pontuacao[]
  users: User[]
  title?: string
}

export function RankingCaptadores({
  pontuacoes,
  users,
  title = 'Ranking de Captadores',
}: RankingCaptadoresProps) {
  const ranking = useMemo(() => {
    const map = new Map()

    // Initialize map with only captadores to ensure everyone is listed even with 0 pts
    users
      .filter((u) => u.role === 'captador')
      .forEach((u) => {
        map.set(u.id, {
          user: u,
          total: 0,
          capturas: 0,
          ganhos: 0,
        })
      })

    // Sum points
    pontuacoes.forEach((p) => {
      if (!map.has(p.captador_id)) return
      const stats = map.get(p.captador_id)
      stats.total += p.pontos
      if (p.tipo_pontuacao.includes('captura')) stats.capturas += 1
      if (p.tipo_pontuacao === 'ganho_confirmado') stats.ganhos += 1
    })

    // Sort by total points descending
    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [pontuacoes, users])

  return (
    <Card className="shadow-sm border border-[#E5E5E5] animate-fade-in-up">
      <CardHeader className="bg-[#F8FAFC] border-b">
        <CardTitle className="text-lg flex items-center gap-2 font-black text-[#1A3A52]">
          <Trophy className="w-5 h-5 text-yellow-500" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-[#E5E5E5]">
          {ranking.map((row, i) => {
            const isOuro = i === 0
            const isPrata = i === 1
            const isBronze = i === 2
            return (
              <div
                key={row.user.id}
                className="p-4 flex items-center gap-4 hover:bg-[#F5F5F5] transition-colors"
              >
                <div className="w-8 shrink-0 flex justify-center font-black text-lg">
                  {isOuro ? (
                    <Trophy className="w-6 h-6 text-yellow-500 drop-shadow-sm" />
                  ) : isPrata ? (
                    <Medal className="w-6 h-6 text-gray-400 drop-shadow-sm" />
                  ) : isBronze ? (
                    <Award className="w-6 h-6 text-amber-700 drop-shadow-sm" />
                  ) : (
                    <span className="text-[#999999] text-base">{i + 1}º</span>
                  )}
                </div>
                <Avatar className="h-[44px] w-[44px] border-2 border-[#FFFFFF] shadow-sm shrink-0">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${row.user.name}`}
                  />
                  <AvatarFallback className="font-bold text-[#666666]">
                    {row.user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[14px] text-[#1A3A52] truncate">{row.user.name}</p>
                  <p className="text-[12px] font-medium text-[#666666] truncate mt-0.5">
                    {row.capturas} capturas • {row.ganhos} ganhos confirmados
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center justify-end gap-1.5 font-black text-xl text-[#10B981] leading-none">
                    {row.total} <Star className="w-4 h-4 fill-[#10B981] -mt-0.5" />
                  </div>
                  <span className="text-[10px] uppercase font-bold text-[#999999] tracking-wider mt-1 block">
                    pontos
                  </span>
                </div>
              </div>
            )
          })}
          {ranking.length === 0 && (
            <div className="p-8 text-center text-[#999999] text-[13px] font-medium">
              Nenhum captador no ranking para o período selecionado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
