import { useEffect, useState } from 'react'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { LeadsTable } from '@/components/dashboard/LeadsTable'
import { useCaptadorDashboard } from '@/hooks/use-captador-dashboard'
import { CaptadorEngajamentoModal } from '@/components/dashboard/CaptadorEngajamentoModal'
import { usePeriodStore } from '@/stores/use-period-store'

export function CaptadorDashboard() {
  const { metrics, leads, charts, loading, refetch } = useCaptadorDashboard()
  const { period } = usePeriodStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    const lastShown = localStorage.getItem('captador_engajamento_modal_last_shown')
    const today = new Date().toDateString()
    if (lastShown !== today) {
      setShowModal(true)
      localStorage.setItem('captador_engajamento_modal_last_shown', today)
    }
  }, [])

  const periodLabel = period === 'today' ? 'Hoje' : period === 'week' ? 'Esta Semana' : 'Este Mês'

  return (
    <div className="w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-500 px-4 sm:px-0 mt-4">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-[24px] md:text-[28px] font-black text-[#1A3A52] tracking-tight">
          Dashboard Captador
        </h1>
        <p className="text-gray-500 font-medium">
          Acompanhe o funil de captação e conversão de imóveis em tempo real.
        </p>
      </div>

      <PeriodSelector />

      <div className="mb-6 mt-8">
        <h2 className="text-[18px] font-bold text-[#1A3A52]">
          Seu Desempenho <span className="text-blue-600">{periodLabel}</span>
        </h2>
      </div>

      <MetricsCards metrics={metrics} loading={loading} />

      <DashboardCharts charts={charts} loading={loading} />

      <LeadsTable leads={leads} loading={loading} refetch={refetch} />

      {showModal && (
        <CaptadorEngajamentoModal isOpen={showModal} onClose={() => setShowModal(false)} />
      )}
    </div>
  )
}
