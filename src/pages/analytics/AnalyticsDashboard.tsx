import React, { useState } from 'react'
import { FilterPanel } from '@/components/analytics/FilterPanel'
import { DashboardCaptadores } from '@/components/analytics/DashboardCaptadores'
import { DashboardCorretores } from '@/components/analytics/DashboardCorretores'

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<{
    period: string
    periodRange?: { start: string; end: string }
    userIds: string[]
  }>({ period: 'this_week', userIds: [] })

  const [activeTab, setActiveTab] = useState<'captadores' | 'corretores'>('captadores')

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard de Analytics</h1>

      {/* Componente de filtros */}
      <FilterPanel onFiltersChange={handleFiltersChange} />

      {/* Abas para diferentes dashboards */}
      <div className="flex gap-4 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('captadores')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'captadores'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Captadores
        </button>
        <button
          onClick={() => setActiveTab('corretores')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'corretores'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Corretores/SDRs
        </button>
      </div>

      {/* Dashboard de Captadores */}
      {activeTab === 'captadores' && <DashboardCaptadores filters={filters as any} />}

      {/* Dashboard de Corretores */}
      {activeTab === 'corretores' && <DashboardCorretores filters={filters as any} />}
    </div>
  )
}
