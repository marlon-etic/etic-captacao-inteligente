import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { User, Demand } from '@/types'
import {
  Trophy,
  Star,
  Zap,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Home,
  Eye,
  Handshake,
  Percent,
} from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'

export function PontuacaoTab({
  currentUser,
  userDemands,
  users,
}: {
  currentUser: User
  userDemands: Demand[]
  users: User[]
}) {
  if (!currentUser) {
    return (
      <div className="flex h-[300px] items-center justify-center text-[#333333] font-medium text-[16px]">
        Nenhuma métrica disponível
      </div>
    )
  }

  // Calculations
  const monthlyCaptures = currentUser.stats.imoveisCaptadosSemana * 4 || 12
  const monthlyVisits = 8
  const monthlyDeals = currentUser.stats.negociosFechados || 3
  const conversionRate = Math.round((monthlyDeals / monthlyVisits) * 100) || 37

  const ranking = [...users]
    .filter((u) => u.role === 'captador')
    .sort((a, b) => b.points - a.points)

  const position = ranking.findIndex((u) => u.id === currentUser.id) + 1 || 1
  const totalCaptadores = ranking.length || 1

  // Chart Data
  const chartData = useMemo(() => {
    const data = []
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
    let currentPts = currentUser.points > 300 ? currentUser.points - 300 : 0
    const step = 300 / daysInMonth
    const today = new Date().getDate()

    for (let i = 1; i <= daysInMonth; i++) {
      if (i > today) break
      currentPts += step + (Math.random() * 20 - 10)
      data.push({
        day: i.toString().padStart(2, '0'),
        pontos: Math.max(0, Math.round(currentPts)),
      })
    }
    return data
  }, [currentUser.points])

  const top3 = ranking.slice(0, 3)

  const userBadges = currentUser.badges || []
  const badges = [
    {
      id: '🏆 Especialista',
      name: 'Especialista',
      desc: '100+ imóveis captados',
      icon: Trophy,
      date: '15/10/2023',
      earned: userBadges.includes('🏆 Especialista'),
    },
    {
      id: '🚀 Rastreador Rápido',
      name: 'Rastreador Rápido',
      desc: 'Média 18h de resposta',
      icon: Zap,
      date: '22/11/2023',
      earned: userBadges.includes('🚀 Rastreador Rápido'),
    },
    {
      id: '💎 Sem Demandas Abertas',
      name: 'Sem Demandas Abertas',
      desc: '7 dias sem pendências',
      icon: ShieldCheck,
      date: '05/01/2024',
      earned: userBadges.includes('💎 Sem Demandas Abertas'),
    },
    {
      id: '⭐ Negociador Estrela',
      name: 'Negociador Estrela',
      desc: 'Alta taxa de conversão',
      icon: Star,
      date: 'Pendente',
      earned: userBadges.includes('⭐ Negociador Estrela'),
    },
  ]

  return (
    <div className="flex flex-col gap-[16px] md:gap-[24px] animate-fade-in duration-200 ease-in-out w-full pb-8">
      {/* Section 1 - Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px] md:gap-[24px]">
        <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-[0_2px_8px_rgba(26,58,82,0.08)]">
          <CardContent className="p-[16px] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#999999] uppercase tracking-wider mb-1">
                Pontos Totais
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-bold text-[#1A3A52] leading-none">
                  {currentUser.points}
                </span>
                <span className="text-[12px] text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 12%
                </span>
              </div>
            </div>
            <div className="w-[48px] h-[48px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-[#1A3A52]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-[0_2px_8px_rgba(26,58,82,0.08)]">
          <CardContent className="p-[16px] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#999999] uppercase tracking-wider mb-1">
                Ranking
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] font-bold text-[#1A3A52] leading-tight">
                  Posição {position} de {totalCaptadores}
                </span>
                <span className="text-[12px] text-emerald-600 font-bold flex items-center">
                  <TrendingUp className="w-3 h-3 mr-0.5" /> 1
                </span>
              </div>
            </div>
            <div className="w-[48px] h-[48px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-[#1A3A52]" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-[0_2px_8px_rgba(26,58,82,0.08)]">
          <CardContent className="p-[16px] flex items-center justify-between">
            <div>
              <p className="text-[12px] font-bold text-[#999999] uppercase tracking-wider mb-1">
                Imóveis Captados (mês)
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-[36px] font-bold text-[#1A3A52] leading-none">
                  {monthlyCaptures}
                </span>
                <span className="text-[12px] text-red-600 font-bold flex items-center">
                  <TrendingDown className="w-3 h-3 mr-0.5" /> 2%
                </span>
              </div>
            </div>
            <div className="w-[48px] h-[48px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center">
              <Home className="w-6 h-6 text-[#1A3A52]" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-[16px] md:gap-[24px]">
        <div className="lg:col-span-2 space-y-[16px] md:space-y-[24px]">
          {/* Section 2 - Badges & Achievements */}
          <div>
            <h2 className="text-[20px] font-bold text-[#1A3A52] mb-[16px]">🎯 Badges Obtidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-[16px]">
              {badges.map((b, i) => (
                <Card
                  key={i}
                  className={cn(
                    'bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm transition-all',
                    !b.earned && 'opacity-60 grayscale',
                  )}
                >
                  <CardContent className="p-[16px] flex items-center gap-[16px]">
                    <div className="w-[40px] h-[40px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center shrink-0">
                      <b.icon className="w-[20px] h-[20px] text-[#1A3A52]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-bold text-[#333333] truncate">{b.name}</p>
                      <p className="text-[12px] text-[#999999] truncate">{b.desc}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[11px] text-[#999999] uppercase font-bold">Obtido em</p>
                      <p className="text-[12px] font-medium text-[#333333]">
                        {b.earned ? b.date : 'Pendente'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Section 4 - Monthly Performance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[16px]">
            <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm">
              <CardContent className="p-[16px] flex items-center gap-[16px]">
                <div className="w-[48px] h-[48px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center shrink-0">
                  <Eye className="w-[32px] h-[32px] text-[#1A3A52]" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[28px] font-bold text-[#333333] leading-none">
                      {monthlyVisits}
                    </span>
                    <span className="text-[12px] text-emerald-600 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> 5%
                    </span>
                  </div>
                  <p className="text-[12px] text-[#999999] uppercase font-bold mt-1">
                    Visitas Agendadas
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm">
              <CardContent className="p-[16px] flex items-center gap-[16px]">
                <div className="w-[48px] h-[48px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center shrink-0">
                  <Handshake className="w-[32px] h-[32px] text-[#1A3A52]" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[28px] font-bold text-[#333333] leading-none">
                      {monthlyDeals}
                    </span>
                    <span className="text-[12px] text-emerald-600 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> 10%
                    </span>
                  </div>
                  <p className="text-[12px] text-[#999999] uppercase font-bold mt-1">
                    Negócios Fechados
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm">
              <CardContent className="p-[16px] flex items-center gap-[16px]">
                <div className="w-[48px] h-[48px] rounded-full bg-[#1A3A52]/10 flex items-center justify-center shrink-0">
                  <Percent className="w-[32px] h-[32px] text-[#1A3A52]" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[28px] font-bold text-[#333333] leading-none">
                      {conversionRate}%
                    </span>
                    <span className="text-[12px] text-emerald-600 font-bold flex items-center">
                      <TrendingUp className="w-3 h-3 mr-0.5" /> 2%
                    </span>
                  </div>
                  <p className="text-[12px] text-[#999999] uppercase font-bold mt-1">
                    Taxa de Conversão
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Section 5 - Progress Chart */}
          <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm">
            <CardHeader className="p-[16px] pb-0">
              <CardTitle className="text-[16px] font-bold text-[#1A3A52]">
                Evolução de Pontos no Mês
              </CardTitle>
            </CardHeader>
            <CardContent className="p-[16px]">
              <div className="h-[250px] md:h-[300px] w-full">
                <ChartContainer
                  config={{ pontos: { label: 'Pontos', color: '#1A3A52' } }}
                  className="h-full w-full"
                >
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-[16px] md:space-y-[24px]">
          {/* Section 3 - Next Badge Progress */}
          <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm">
            <CardContent className="p-[16px]">
              <h3 className="text-[16px] font-bold text-[#1A3A52] mb-[12px]">
                🎯 Próximo Badge: Negociador Estrela
              </h3>
              <Progress
                value={60}
                className="h-[8px] bg-[#E5E5E5] mb-[8px]"
                indicatorClassName="bg-[#4CAF50]"
              />
              <p className="text-[12px] text-[#333333] font-medium text-right">
                Faltam 2 negócios para desbloquear
              </p>
            </CardContent>
          </Card>

          {/* Section 6 - Weekly Ranking Table */}
          <Card className="bg-[#FFFFFF] border border-[#2E5F8A]/20 shadow-sm">
            <CardHeader className="p-[16px] border-b border-[#E5E5E5]">
              <CardTitle className="text-[16px] font-bold text-[#1A3A52]">
                Ranking Semanal - Top 3
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-[#E5E5E5]">
                {top3.map((u, i) => (
                  <div
                    key={u.id}
                    className={cn(
                      'p-[16px] flex items-center justify-between transition-colors hover:bg-[#F5F5F5]',
                      u.id === currentUser.id ? 'bg-[#1A3A52]/5' : '',
                    )}
                  >
                    <div className="flex items-center gap-[12px]">
                      <span className="text-[20px]">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                      <span className="text-[14px] font-bold text-[#333333]">
                        {i + 1}º: {u.name}
                      </span>
                      {u.id === currentUser.id && (
                        <span className="text-[10px] bg-[#1A3A52] text-white px-2 py-0.5 rounded-full font-bold ml-2">
                          VOCÊ
                        </span>
                      )}
                    </div>
                    <div className="text-[14px] font-bold text-[#1A3A52]">{u.weeklyPoints} pts</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
