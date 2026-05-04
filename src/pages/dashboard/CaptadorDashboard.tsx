import { useEffect, useState, useMemo } from 'react'
import { PeriodSelector } from '@/components/dashboard/PeriodSelector'
import { MetricsCards } from '@/components/dashboard/MetricsCards'
import { DashboardCharts } from '@/components/dashboard/DashboardCharts'
import { ImoveisCadastradosList } from '@/components/dashboard/ImoveisCadastradosList'
import { DemandasAbertasTable } from '@/components/dashboard/DemandasAbertasTable'
import { ImoveisPerdidosTable } from '@/components/dashboard/ImoveisPerdidosTable'
import { ModalDetalhesImovel } from '@/components/dashboard/ModalDetalhesImovel'
import { useCaptadorDashboard } from '@/hooks/use-captador-dashboard'
import { CaptadorEngajamentoModal } from '@/components/dashboard/CaptadorEngajamentoModal'
import { usePeriodStore } from '@/stores/use-period-store'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Target, Trophy, HelpCircle, X } from 'lucide-react'

export function CaptadorDashboard() {
  const { metrics, imoveis, demandas, perdidos, charts, loading, refetch } = useCaptadorDashboard()
  const { period, transactionType } = usePeriodStore()
  const [showModal, setShowModal] = useState(false)
  const [selectedImovel, setSelectedImovel] = useState<any>(null)
  const [activeFilters, setActiveFilters] = useState<{
    tipo?: string
    faixa?: string
    status?: string
    card?: string
  }>({})

  useEffect(() => {
    const lastShown = localStorage.getItem('captador_engajamento_modal_last_shown')
    const today = new Date().toDateString()
    if (lastShown !== today) {
      setShowModal(true)
      localStorage.setItem('captador_engajamento_modal_last_shown', today)
    }
  }, [])

  const imoveisFiltrados = useMemo(() => {
    return imoveis.filter((i) => {
      if (activeFilters.tipo && i.tipo_imovel !== activeFilters.tipo) return false
      if (activeFilters.faixa) {
        const v = Number(i.preco || i.valor || 0)
        if (activeFilters.faixa === 'Até R$ 500k' && v > 500000) return false
        if (activeFilters.faixa === 'R$ 500k - R$ 1M' && (v <= 500000 || v > 1000000)) return false
        if (activeFilters.faixa === 'R$ 1M - R$ 2M' && (v <= 1000000 || v > 2000000)) return false
        if (activeFilters.faixa === 'Acima de R$ 2M' && v <= 2000000) return false
      }
      if (activeFilters.card) {
        if (activeFilters.card === 'sob_demanda' && !i.demanda_locacao_id && !i.demanda_venda_id)
          return false
        if (activeFilters.card === 'aleatorios' && (i.demanda_locacao_id || i.demanda_venda_id))
          return false
        if (
          activeFilters.card === 'perdidos' &&
          i.status_captacao !== 'perdido' &&
          i.status_captacao !== 'descartado'
        )
          return false
      }
      return true
    })
  }, [imoveis, activeFilters])

  const demandasFiltradas = useMemo(() => {
    return demandas.filter((d) => {
      if (activeFilters.tipo && !(d.tipo_imovel || '').includes(activeFilters.tipo)) return false
      if (activeFilters.status && d.status_demanda !== activeFilters.status) return false
      if (activeFilters.card === 'sem_resposta') {
        const diffDays =
          (new Date().getTime() - new Date(d.created_at).getTime()) / (1000 * 3600 * 24)
        if (diffDays <= 4) return false
      }
      return true
    })
  }, [demandas, activeFilters])

  const handleFilterClick = (type: string, value: string) => {
    setActiveFilters((prev) => ({ ...prev, [type]: value }))
  }

  const clearFilter = (type: string) => {
    setActiveFilters((prev) => ({ ...prev, [type]: undefined }))
  }

  const handleCardClick = (filter: string) => {
    setActiveFilters((prev) => ({ ...prev, card: filter || undefined }))
  }

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

      <div className="mb-6 mt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-[18px] font-bold text-[#1A3A52]">
          Seu Desempenho <span className="text-blue-600">{periodLabel}</span> ({transactionType})
        </h2>
        {Object.values(activeFilters).some((v) => v !== undefined) && (
          <div className="flex flex-wrap items-center gap-2 animate-in fade-in zoom-in-95 duration-200">
            <span className="text-xs font-bold text-gray-500 uppercase mr-1">Filtros Ativos:</span>
            {activeFilters.card && (
              <Badge
                variant="secondary"
                className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 cursor-pointer shadow-sm border-indigo-200"
                onClick={() => clearFilter('card')}
              >
                Card: {activeFilters.card} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {activeFilters.tipo && (
              <Badge
                variant="secondary"
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 cursor-pointer shadow-sm border-blue-200"
                onClick={() => clearFilter('tipo')}
              >
                Tipo: {activeFilters.tipo} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {activeFilters.faixa && (
              <Badge
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer shadow-sm border-emerald-200"
                onClick={() => clearFilter('faixa')}
              >
                Faixa: {activeFilters.faixa} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            {activeFilters.status && (
              <Badge
                variant="secondary"
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 cursor-pointer shadow-sm border-amber-200"
                onClick={() => clearFilter('status')}
              >
                Status: {activeFilters.status} <X className="w-3 h-3 ml-1" />
              </Badge>
            )}
            <button
              onClick={() => setActiveFilters({})}
              className="text-xs text-gray-400 hover:text-gray-700 font-bold transition-colors ml-2"
            >
              Limpar Todos
            </button>
          </div>
        )}
      </div>

      <MetricsCards
        metrics={metrics}
        loading={loading}
        activeFilter={activeFilters.card}
        onCardClick={handleCardClick}
      />

      <DashboardCharts charts={charts} loading={loading} onFilterClick={handleFilterClick} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <ImoveisCadastradosList
            imoveis={imoveisFiltrados}
            loading={loading}
            onSelect={setSelectedImovel}
          />
        </div>
        <div className="lg:col-span-5 flex flex-col gap-6">
          <DemandasAbertasTable demandas={demandasFiltradas} />
          {activeFilters.card === 'perdidos' && <ImoveisPerdidosTable perdidos={perdidos} />}
        </div>
      </div>

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
