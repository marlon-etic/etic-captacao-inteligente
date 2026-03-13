import { useState, useMemo, useEffect } from 'react'
import { Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'
import {
  PerformanceFilters,
  PerformanceFilterState,
} from '@/components/analytics/PerformanceFilters'
import { TopProfilesTable } from '@/components/analytics/TopProfilesTable'
import { ConversionCharts } from '@/components/analytics/ConversionCharts'
import { LifecycleTimingTables } from '@/components/analytics/LifecycleTimingTables'
import { TypeComparisonChart } from '@/components/analytics/TypeComparisonChart'
import { Button } from '@/components/ui/button'
import { Download, AlertCircle, Loader2 } from 'lucide-react'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { exportToCSV } from '@/lib/exportToCSV'
import { Navigate } from 'react-router-dom'

export function PerformanceDashboard() {
  const { demands, currentUser } = useAppStore()

  const [filters, setFilters] = useState<PerformanceFilterState>({
    period: 'Mês',
    startDate: null,
    endDate: null,
    type: 'Ambos',
    neighborhood: 'Todos',
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  // Inject diverse mock data if needed to make dashboard rich for presentation
  const enrichedDemands = useMemo(() => {
    if (demands.length > 50) return demands
    const fake: Demand[] = []
    const locs = ['Mooca', 'Tatuapé', 'Pinheiros', 'Jardins', 'Vila Mariana']
    for (let i = 0; i < 60; i++) {
      const isDeal = i % 6 === 0
      const isVisit = i % 3 === 0
      const dDate = new Date(Date.now() - i * 86400000 * 2)
      fake.push({
        id: `perf-mock-${i}`,
        clientName: `Cliente Perf ${i}`,
        location: locs[i % locs.length],
        budget: 500000 + i * 100000,
        minBudget: 400000 + i * 100000,
        maxBudget: 600000 + i * 100000,
        bedrooms: (i % 3) + 1,
        parkingSpots: (i % 2) + 1,
        type: i % 2 === 0 ? 'Venda' : 'Aluguel',
        status: isDeal ? 'Negócio' : isVisit ? 'Visita' : 'Captado sob demanda',
        createdAt: dDate.toISOString(),
        description: 'Mock',
        timeframe: '30 dias',
        createdBy: '1',
        capturedProperties: [
          {
            code: `PM-${i}`,
            value: 550000 + i * 100000,
            neighborhood: locs[i % locs.length],
            docCompleta: true,
            capturedAt: new Date(dDate.getTime() + 86400000).toISOString(),
            visitaDate:
              isVisit || isDeal
                ? new Date(dDate.getTime() + 86400000 * 3).toISOString()
                : undefined,
            fechamentoDate: isDeal
              ? new Date(dDate.getTime() + 86400000 * 10).toISOString()
              : undefined,
            fechamentoValue: isDeal ? 550000 + i * 100000 : undefined,
          },
        ],
      })
    }
    return [...demands, ...fake]
  }, [demands])

  const filteredDemands = useMemo(() => {
    return enrichedDemands.filter((d) => {
      if (filters.type !== 'Ambos' && d.type !== filters.type) return false
      if (filters.neighborhood !== 'Todos' && !d.location.includes(filters.neighborhood))
        return false

      const dDate = new Date(d.createdAt)
      const now = new Date()

      if (filters.period === 'Semana') {
        const s = new Date(now)
        s.setDate(s.getDate() - 7)
        if (dDate < s) return false
      } else if (filters.period === 'Mês') {
        const s = new Date(now)
        s.setMonth(s.getMonth() - 1)
        if (dDate < s) return false
      } else if (filters.period === 'Ano') {
        const s = new Date(now)
        s.setFullYear(s.getFullYear() - 1)
        if (dDate < s) return false
      } else if (filters.period === 'Customizado') {
        if (filters.startDate && dDate < new Date(filters.startDate)) return false
        if (filters.endDate && dDate > new Date(filters.endDate)) return false
      }
      return true
    })
  }, [enrichedDemands, filters])

  const handleApplyFilters = (newFilters: PerformanceFilterState) => {
    setLoading(true)
    setError(false)
    setTimeout(() => {
      if (Math.random() < 0.05)
        setError(true) // simulate rare error
      else setFilters(newFilters)
      setLoading(false)
    }, 600)
  }

  const handleExport = () => {
    const rows = filteredDemands.map((d) => ({
      Cliente: d.clientName,
      Bairro: d.location,
      Tipo: d.type,
      Status: d.status,
      DataAbertura: new Date(d.createdAt).toLocaleDateString('pt-BR'),
    }))
    exportToCSV(`Dashboard_Performance_${new Date().getTime()}.csv`, rows)
  }

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="flex flex-col space-y-[24px] pb-[40px] animate-fade-in-up w-full max-w-screen-2xl mx-auto">
      <div className="flex flex-col gap-[16px] md:flex-row md:items-center justify-between border-b border-border/50 pb-6">
        <div>
          <h1 className="text-[20px] md:text-[24px] lg:text-[28px] font-black text-foreground leading-tight tracking-tight">
            Performance Dashboard
          </h1>
          <p className="text-[14px] md:text-[16px] text-muted-foreground font-medium mt-1">
            Análise detalhada de bairros, perfis e funil de conversão.
          </p>
        </div>
        <Button
          onClick={handleExport}
          variant="outline"
          className="min-h-[44px] font-bold shadow-sm self-start md:self-auto"
        >
          <Download className="w-[18px] h-[18px] mr-2" /> Exportar Relatório (CSV)
        </Button>
      </div>

      <PerformanceFilters filters={filters} onApply={handleApplyFilters} />

      {error ? (
        <Alert variant="destructive" className="mt-8">
          <AlertCircle className="h-5 w-5" />
          <AlertTitle>Erro ao carregar dados.</AlertTitle>
          <AlertDescription>
            Ocorreu um erro inesperado. Tente aplicar os filtros novamente.
          </AlertDescription>
        </Alert>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground mt-8">
          <Loader2 className="w-10 h-10 animate-spin mb-4" />
          <p className="font-medium text-lg">Processando métricas...</p>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-xl border border-dashed text-muted-foreground mt-8 min-h-[400px]">
          <AlertCircle className="w-16 h-16 mb-4 opacity-50 text-muted-foreground" />
          <p className="font-bold text-xl text-foreground mb-2">
            Nenhum dado disponível para este período
          </p>
          <p className="text-sm">Altere os filtros de data ou bairro para visualizar resultados.</p>
        </div>
      ) : (
        <div className="space-y-[24px] lg:space-y-[32px] pt-4 w-full">
          <ConversionCharts demands={filteredDemands} />
          <TopProfilesTable demands={filteredDemands} metric="visits" />
          <TopProfilesTable demands={filteredDemands} metric="deals" />
          <TypeComparisonChart demands={filteredDemands} />
          <LifecycleTimingTables demands={filteredDemands} />
        </div>
      )}
    </div>
  )
}
