import { useState, useMemo, useEffect } from 'react'
import { Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { AnalyticsFilters } from '@/components/analytics/AnalyticsFilters'
import { AnalyticsMetrics } from '@/components/analytics/AnalyticsMetrics'
import { AnalyticsModal } from '@/components/analytics/AnalyticsModal'
import { useToast } from '@/hooks/use-toast'

export interface AnalyticsFilterState {
  startDate: string | null
  endDate: string | null
  type: 'Venda' | 'Aluguel' | 'Ambos'
}

export function AnalyticsDashboard() {
  const { demands, currentUser } = useAppStore()
  const { toast } = useToast()

  const [filters, setFilters] = useState<AnalyticsFilterState>(() => {
    try {
      const stored = localStorage.getItem('analytics_filters')
      if (stored) return JSON.parse(stored)
    } catch {
      // ignore parsing errors
    }
    return { startDate: null, endDate: null, type: 'Ambos' }
  })

  const [activeMetric, setActiveMetric] = useState<{
    id: string
    title: string
    data: Demand[]
  } | null>(null)

  useEffect(() => {
    localStorage.setItem('analytics_filters', JSON.stringify(filters))
  }, [filters])

  const userDemands = useMemo(() => {
    if (!currentUser) return []
    if (currentUser.role === 'admin' || currentUser.role === 'gestor') return demands
    if (currentUser.role === 'sdr' || currentUser.role === 'corretor') {
      return demands.filter((d) => d.createdBy === currentUser.id)
    }
    if (currentUser.role === 'captador') {
      return demands.filter(
        (d) =>
          d.assignedTo === currentUser.id ||
          d.capturedProperties?.some((p) => p.captador_id === currentUser.id),
      )
    }
    return []
  }, [demands, currentUser])

  const filteredDemands = useMemo(() => {
    return userDemands.filter((d) => {
      if (filters.type !== 'Ambos' && d.type !== filters.type) return false

      const dDate = new Date(d.createdAt)

      if (filters.startDate) {
        const s = new Date(filters.startDate)
        s.setHours(0, 0, 0, 0)
        if (dDate < s) return false
      }

      if (filters.endDate) {
        const e = new Date(filters.endDate)
        e.setHours(23, 59, 59, 999)
        if (dDate > e) return false
      }

      return true
    })
  }, [userDemands, filters])

  const handleApplyFilters = (newFilters: AnalyticsFilterState) => {
    if (newFilters.startDate && newFilters.endDate) {
      if (new Date(newFilters.endDate) < new Date(newFilters.startDate)) {
        toast({
          title: 'Atenção',
          description: 'Data inválida. A Data Fim deve ser maior ou igual à Data Início',
          variant: 'destructive',
        })
        return
      }
    }
    setFilters(newFilters)
  }

  return (
    <div className="p-[16px] md:p-[24px] lg:p-[32px] max-w-screen-2xl mx-auto space-y-[24px] md:space-y-[32px] pb-[96px]">
      <div className="flex flex-col gap-2 border-b border-border/50 pb-6">
        <h1 className="text-[20px] md:text-[24px] lg:text-[28px] font-black text-foreground leading-tight tracking-tight">
          Análise de Demandas
        </h1>
        <p className="text-[14px] md:text-[16px] text-muted-foreground font-medium">
          Monitore sua performance de captação e negócios com filtros inteligentes
        </p>
      </div>

      <AnalyticsFilters filters={filters} onApply={handleApplyFilters} />
      <AnalyticsMetrics demands={filteredDemands} onCardClick={setActiveMetric} />

      <AnalyticsModal
        open={!!activeMetric}
        onClose={() => setActiveMetric(null)}
        metric={activeMetric}
        filters={filters}
      />
    </div>
  )
}
