import useAppStore from '@/stores/useAppStore'
import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'
import { PontuacaoDashboard } from '@/components/dashboard/PontuacaoDashboard'
import { RankingCaptadores } from '@/components/dashboard/RankingCaptadores'

export default function PontuacaoPage() {
  const { currentUser, users } = useAppStore()
  const { pontuacoes } = useSupabasePontuacao()

  if (!currentUser) return null

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto animate-fade-in-up pb-8">
      <div className="flex flex-col mb-2">
        <h1 className="text-2xl md:text-3xl font-black text-[#1A3A52] tracking-tight">
          Meu Desempenho
        </h1>
        <p className="text-sm text-[#666666] mt-1 font-medium">
          Acompanhe sua pontuação e sua evolução no ranking oficial.
        </p>
      </div>

      {currentUser.role === 'captador' && (
        <PontuacaoDashboard pontuacoes={pontuacoes} currentUser={currentUser} users={users} />
      )}

      <div className="mt-4">
        <RankingCaptadores
          pontuacoes={pontuacoes}
          users={users}
          title="Ranking Geral (Todos os Tempos)"
        />
      </div>
    </div>
  )
}
