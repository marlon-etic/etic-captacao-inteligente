import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Loader2, AlertTriangle, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  enhanceDemands,
  generateAnalyticsMockDemands,
  AnalyticsFiltersState,
} from '@/lib/analytics-utils'

import { DashboardFilters } from '@/components/analytics/DashboardFilters'
import { SummaryCards } from '@/components/analytics/SummaryCards'
import { NeighborhoodsChart } from '@/components/analytics/NeighborhoodsChart'
import { TypologyBarChart } from '@/components/analytics/TypologyBarChart'
import { PriceDonutChart } from '@/components/analytics/PriceDonutChart'
import { ProfileTable } from '@/components/analytics/ProfileTable'

export function AnalyticsDashboard() {
  const { currentUser, demands } = useAppStore()
  const { toast } = useToast()

  const [activeFilters, setActiveFilters] = useState<AnalyticsFiltersState>({
    period: 'month',
    type: 'Ambos',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(false)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)

  const enhancedAllDemands = useMemo(() => {
    // Combine real demands with 200 mock demands for rich analytics display
    const combined = [...demands, ...generateAnalyticsMockDemands('init')]
    return enhanceDemands(combined)
  }, [demands])

  const filteredDemands = useMemo(() => {
    const now = new Date()
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay())).setHours(0, 0, 0, 0)
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()

    return enhancedAllDemands.filter((d) => {
      if (activeFilters.type !== 'Ambos' && d.type !== activeFilters.type) return false

      const dDate = new Date(d.createdAt).getTime()

      if (activeFilters.period === 'week') {
        if (dDate < weekStart) return false
      } else if (activeFilters.period === 'month') {
        if (dDate < monthStart) return false
      } else if (activeFilters.period === 'custom') {
        if (activeFilters.startDate && dDate < activeFilters.startDate.getTime()) return false
        if (activeFilters.endDate && dDate > activeFilters.endDate.getTime() + 86399999)
          return false
      }
      return true
    })
  }, [enhancedAllDemands, activeFilters])

  const handleApply = (newFilters: AnalyticsFiltersState) => {
    if (newFilters.period === 'custom' && newFilters.startDate && newFilters.endDate) {
      if (new Date(newFilters.endDate) < new Date(newFilters.startDate)) {
        toast({ title: 'Período inválido', variant: 'destructive' })
        return
      }
    }
    setIsLoading(true)
    setError(false)
    setTimeout(() => {
      if (Math.random() < 0.05) {
        setError(true)
      } else {
        setActiveFilters(newFilters)
        setSelectedNeighborhood(null)
      }
      setIsLoading(false)
    }, 600)
  }

  // Access validation as per Acceptance Criteria
  if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="flex flex-col space-y-6 pb-12 max-w-[1400px] mx-auto w-full animate-fade-in-up">
      <div className="flex flex-col gap-2 border-b border-[#2E5F8A]/20 pb-4">
        <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] leading-tight">
          Analytics Dashboard
        </h1>
        <p className="text-[14px] text-[#999999] font-medium">
          Visualize dados agregados para guiar esforços estratégicos de captação.
        </p>
      </div>

      <DashboardFilters initialFilters={activeFilters} onApply={handleApply} />

      {error ? (
        <div className="flex flex-col h-[400px] items-center justify-center text-center bg-white rounded-xl border-[2px] border-[#F44336]/20">
          <AlertTriangle className="h-12 w-12 text-[#F44336] mb-4" />
          <h3 className="text-[18px] font-bold text-[#333333]">
            Erro ao carregar analytics. Tente novamente
          </h3>
          <Button className="mt-6" onClick={() => setError(false)}>
            Tentar Novamente
          </Button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col h-[400px] items-center justify-center bg-white rounded-xl border-[2px] border-[#2E5F8A]/10">
          <Loader2 className="h-10 w-10 animate-spin text-[#1A3A52] mb-4" />
          <p className="text-[#999999] font-bold text-[14px] uppercase tracking-wider">
            Processando dados...
          </p>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="flex flex-col h-[400px] items-center justify-center text-center bg-white rounded-xl border-[2px] border-dashed border-[#2E5F8A]/20">
          <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-[#999999]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#333333] mb-1">
            Nenhuma demanda neste período
          </h3>
          <p className="text-[14px] text-[#999999]">Altere os filtros para ver resultados.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          <SummaryCards demands={filteredDemands} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <NeighborhoodsChart
              demands={filteredDemands}
              onBarClick={setSelectedNeighborhood}
              selected={selectedNeighborhood}
            />
            <TypologyBarChart demands={filteredDemands} />
          </div>

          <PriceDonutChart demands={filteredDemands} type={activeFilters.type} />

          <ProfileTable
            demands={filteredDemands}
            selectedNeighborhood={selectedNeighborhood}
            onClearNeighborhood={() => setSelectedNeighborhood(null)}
          />
        </div>
      )}
    </div>
  )
}
