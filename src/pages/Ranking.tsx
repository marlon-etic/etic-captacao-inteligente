import { Trophy } from 'lucide-react'
import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'
import useAppStore from '@/stores/useAppStore'
import { RankingCaptadores } from '@/components/dashboard/RankingCaptadores'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

export default function Ranking() {
  const { users } = useAppStore()
  const { pontuacoes } = useSupabasePontuacao()

  // Calcula limites de data
  const now = new Date()
  const weeklyPontuacoes = pontuacoes.filter(
    (p) => new Date(p.created_at).getTime() > now.getTime() - 7 * 86400000,
  )
  const monthlyPontuacoes = pontuacoes.filter(
    (p) => new Date(p.created_at).getTime() > now.getTime() - 30 * 86400000,
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8 animate-fade-in-up">
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4 hover:scale-110 transition-transform duration-300 shadow-inner">
          <Trophy
            className="w-8 h-8 text-yellow-600 animate-bounce-scale origin-bottom"
            style={{ animationDuration: '600ms' }}
          />
        </div>
        <h1 className="text-3xl font-black text-[#1A3A52] tracking-tight">Ranking Oficial</h1>
        <p className="text-[#666666] mt-2 font-medium">
          Acompanhe o desempenho e a pontuação dos captadores em tempo real.
        </p>
      </div>

      <Tabs defaultValue="alltime" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-[48px] p-1 bg-[#F1F5F9] rounded-xl shadow-sm border border-[#E2E8F0]">
          <TabsTrigger value="weekly" className="rounded-lg text-[13px] uppercase tracking-wide">
            Semanal
          </TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg text-[13px] uppercase tracking-wide">
            Mensal
          </TabsTrigger>
          <TabsTrigger value="alltime" className="rounded-lg text-[13px] uppercase tracking-wide">
            Geral
          </TabsTrigger>
        </TabsList>
        <TabsContent value="weekly" className="mt-6">
          <RankingCaptadores pontuacoes={weeklyPontuacoes} users={users} title="Ranking Semanal" />
        </TabsContent>
        <TabsContent value="monthly" className="mt-6">
          <RankingCaptadores pontuacoes={monthlyPontuacoes} users={users} title="Ranking Mensal" />
        </TabsContent>
        <TabsContent value="alltime" className="mt-6">
          <RankingCaptadores
            pontuacoes={pontuacoes}
            users={users}
            title="Ranking Geral (Todos os Tempos)"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
