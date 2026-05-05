import React, { useState } from 'react'
import { FilterPanel, AnalyticsFilters } from '@/components/analytics/FilterPanel'

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<AnalyticsFilters>({ period: 'this_week', userIds: [] })

  const handleFiltersChange = (newFilters: AnalyticsFilters) => {
    setFilters(newFilters)
    console.log('[AdminDashboard] Filtros aplicados:', newFilters)
  }

  return (
    <div className="p-4 md:p-6 w-full max-w-7xl mx-auto flex flex-col h-full bg-[#F5F5F5] overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A3A52] tracking-tight">
          Dashboard de Analytics
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Visualize e analise o desempenho da equipe e interações no sistema.
        </p>
      </div>

      <FilterPanel onFiltersChange={handleFiltersChange} />

      <div className="mt-4 bg-white p-8 rounded-lg border border-gray-200 shadow-sm min-h-[300px] flex items-center justify-center animate-in fade-in slide-in-from-bottom-2">
        <div className="text-center">
          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-800">Pronto para visualização</h3>
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            Os filtros foram aplicados com sucesso. As métricas e gráficos serão exibidos aqui com
            base na sua seleção.
          </p>
        </div>
      </div>
    </div>
  )
}
