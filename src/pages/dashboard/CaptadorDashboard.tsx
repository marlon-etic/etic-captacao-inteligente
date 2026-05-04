import { useEffect, useState } from 'react'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ImoveisCadastradosGrid } from '@/components/dashboard/ImoveisCadastradosGrid'
import { DemandasAbertasTable } from '@/components/dashboard/DemandasAbertasTable'
import { ImoveisPerdidosTable } from '@/components/dashboard/ImoveisPerdidosTable'
import { ModalDetalhesImovel } from '@/components/dashboard/ModalDetalhesImovel'
import { useCaptadorDashboard } from '@/hooks/use-captador-dashboard'
import { CaptadorEngajamentoModal } from '@/components/dashboard/CaptadorEngajamentoModal'
import { usePeriodStore } from '@/stores/use-period-store'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { Target, Trophy, HelpCircle } from 'lucide-react'

export function CaptadorDashboard() {
  const { metrics, imoveis, demandas, perdidos, charts, loading, refetch } = useCaptadorDashboard()
  const { period } = usePeriodStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedImovel, setSelectedImovel] = useState<any>(null)

  useEffect(() => {
    const lastShown = localStorage.getItem('captador_engajamento_modal_last_shown')
    const today = new Date().toDateString()
    if (lastShown !== today) {
      setShowModal(true)
      localStorage.setItem('captador_engajamento_modal_last_shown', today)
    }
  }, [])

  const periodLabel =
    period === 'today'
      ? 'Hoje'
      : period === 'week'
        ? 'Esta Semana'
        : period === 'month'
          ? 'Este Mês'
          : 'Personalizado'

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 animate-in fade-in duration-500 px-4 sm:px-0 mt-4">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-[24px] md:text-[28px] font-black text-[#1A3A52] tracking-tight">
          Dashboard Captador
        </h1>
        <p className="text-gray-500 font-medium">
          Acompanhe o funil de captação, matches automáticos e métricas em tempo real.
        </p>
      </div>

      <PeriodSelector />

      <div className="mb-6 mt-8">
        <h2 className="text-[18px] font-bold text-[#1A3A52]">
          Seu Desempenho <span className="text-blue-600">{periodLabel}</span>
        </h2>
      </div>

      <MetricsCards metrics={metrics} loading={loading} />

      <div className="mb-6 mt-8">
        <h2 className="text-[18px] font-bold text-[#1A3A52]">🏠 Seus Imóveis Cadastrados</h2>
      </div>
      <ImoveisCadastradosGrid imoveis={imoveis} loading={loading} onSelect={setSelectedImovel} />

      <DemandasAbertasTable demandas={demandas} />

      <DashboardCharts charts={charts} loading={loading} />

      <ImoveisPerdidosTable perdidos={perdidos} />

      <div className="fixed bottom-6 left-0 right-0 pointer-events-none flex justify-center z-40 px-4">
        <div className="bg-white/90 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-2 flex gap-2 pointer-events-auto">
          <Button
            asChild
            className="bg-emerald-600 hover:bg-emerald-700 font-black px-6 shadow-md shadow-emerald-600/20 text-white border-none h-12"
          >
            <Link to="/app/disponivel-geral">
              <Target className="w-5 h-5 mr-2" /> Começar Busca
            </Link>
          </Button>
          <Button
            asChild
            variant="secondary"
            className="bg-purple-100 hover:bg-purple-200 text-purple-800 font-bold h-12 px-6 border-none"
          >
            <Link to="/app/ranking">
              <Trophy className="w-5 h-5 mr-2" /> Ranking
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="bg-white text-gray-600 font-bold border-gray-200 h-12 px-6"
          >
            <Link to="/app/ajuda">
              <HelpCircle className="w-5 h-5 mr-2" /> Suporte
            </Link>
          </Button>
        </div>
      </div>

      {showModal && (
        <CaptadorEngajamentoModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}

      {selectedImovel && (
        <ModalDetalhesImovel
          imovel={selectedImovel}
          onClose={() => setSelectedImovel(null)}
          refetch={refetch}
        />
      )}
    </div>
  )
}
