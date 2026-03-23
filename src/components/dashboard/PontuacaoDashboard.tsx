import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { Trophy, Target, Sparkles, Star } from 'lucide-react'
import { format, subDays } from 'date-fns'
import { Pontuacao } from '@/hooks/use-supabase-pontuacao'
import { User } from '@/types'

interface PontuacaoDashboardProps {
  pontuacoes: Pontuacao[]
  currentUser: User
  users: User[]
}

export function PontuacaoDashboard({ pontuacoes, currentUser, users }: PontuacaoDashboardProps) {
  const stats = useMemo(() => {
    let total = 0
    const capCom = { count: 0, pts: 0 }
    const capSem = { count: 0, pts: 0 }
    const ganhos = { count: 0, pts: 0 }

    const myPoints = pontuacoes.filter((p) => p.captador_id === currentUser.id)

    myPoints.forEach((p) => {
      total += p.pontos
      if (p.tipo_pontuacao === 'captura_com_demanda') {
        capCom.count++
        capCom.pts += p.pontos
      } else if (p.tipo_pontuacao === 'captura_sem_demanda') {
        capSem.count++
        capSem.pts += p.pontos
      } else if (p.tipo_pontuacao === 'ganho_confirmado') {
        ganhos.count++
        ganhos.pts += p.pontos
      }
    })

    // Calculate ranking position
    const map = new Map<string, number>()
    users.filter((u) => u.role === 'captador').forEach((u) => map.set(u.id, 0))
    pontuacoes.forEach((p) => {
      if (map.has(p.captador_id)) {
        map.set(p.captador_id, (map.get(p.captador_id) || 0) + p.pontos)
      }
    })
    const rankingList = Array.from(map.entries()).sort((a, b) => b[1] - a[1])
    const pos = rankingList.findIndex((x) => x[0] === currentUser.id) + 1 || 1

    // Calculate chart data (last 7 days)
    const chartData = []
    for (let i = 6; i >= 0; i--) {
      const d = subDays(new Date(), i)
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayPoints = myPoints
        .filter((p) => p.created_at.startsWith(dateStr))
        .reduce((acc, curr) => acc + curr.pontos, 0)
      chartData.push({ day: format(d, 'dd/MM'), pontos: dayPoints })
    }

    return {
      total,
      capCom,
      capSem,
      ganhos,
      pos,
      totalUsers: users.filter((u) => u.role === 'captador').length,
      chartData,
    }
  }, [pontuacoes, currentUser.id, users])

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[#1A3A52] to-[#2a5a7d] text-white border-0 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10 transform translate-x-4 -translate-y-4">
            <Trophy className="w-32 h-32" />
          </div>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-white/80 uppercase tracking-wider mb-2">
              Total de Pontos
            </p>
            <div className="text-5xl font-black mb-4 flex items-baseline gap-2 animate-bounce-scale">
              {stats.total}{' '}
              <span className="text-xl font-bold text-white/80 tracking-normal">pts</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-full text-sm font-bold backdrop-blur-sm shadow-sm transition-transform hover:scale-105">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              {stats.pos}º lugar entre {Math.max(1, stats.totalUsers)} Captadores
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 shadow-sm border border-[#E5E5E5]">
          <CardHeader className="pb-2 bg-[#F8FAFC] border-b">
            <CardTitle className="text-[13px] font-bold text-[#666666] uppercase tracking-wider">
              Detalhamento de Pontos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 flex flex-col items-center text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
              <Target className="w-6 h-6 text-emerald-600 mb-2" />
              <span className="text-2xl font-black text-emerald-700 leading-none">
                {stats.capCom.pts} pts
              </span>
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide mt-2">
                Capturas com Demanda
              </span>
              <span className="text-[11px] text-emerald-600/80 font-medium mt-1">
                {stats.capCom.count} imóveis (+10pts)
              </span>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 flex flex-col items-center text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
              <Sparkles className="w-6 h-6 text-blue-600 mb-2" />
              <span className="text-2xl font-black text-blue-700 leading-none">
                {stats.capSem.pts} pts
              </span>
              <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wide mt-2">
                Capturas sem Demanda
              </span>
              <span className="text-[11px] text-blue-600/80 font-medium mt-1">
                {stats.capSem.count} imóveis (+3pts)
              </span>
            </div>
            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 flex flex-col items-center text-center transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
              <Trophy className="w-6 h-6 text-amber-600 mb-2" />
              <span className="text-2xl font-black text-amber-700 leading-none">
                {stats.ganhos.pts} pts
              </span>
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wide mt-2">
                Ganhos Confirmados
              </span>
              <span className="text-[11px] text-amber-600/80 font-medium mt-1">
                {stats.ganhos.count} demandas (+30pts)
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border border-[#E5E5E5]">
        <CardHeader className="bg-[#F8FAFC] border-b pb-4">
          <CardTitle className="text-[15px] font-bold text-[#1A3A52]">
            Evolução (Últimos 7 dias)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[250px] w-full">
            <ChartContainer
              config={{ pontos: { label: 'Pontos Adquiridos', color: '#1A3A52' } }}
              className="h-full w-full"
            >
              <LineChart
                data={stats.chartData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                <XAxis
                  dataKey="day"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#999999' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#999999' }}
                  allowDecimals={false}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="pontos"
                  stroke="#1A3A52"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#1A3A52', strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: '#10B981', stroke: 'transparent' }}
                  animationDuration={1500}
                />
              </LineChart>
            </ChartContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
