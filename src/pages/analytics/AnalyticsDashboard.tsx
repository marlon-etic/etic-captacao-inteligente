import { useState } from 'react'
import { FilterPanel, DashboardFilters } from '@/components/analytics/FilterPanel'
import { DashboardCaptadores } from '@/components/analytics/DashboardCaptadores'
import { cn } from '@/lib/utils'

export function AnalyticsDashboard() {
  const [filters, setFilters] = useState<DashboardFilters>({
    period: 'this_week',
    userIds: [],
  })

  const [activeTab, setActiveTab] = useState<'captadores' | 'corretores'>('captadores')

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-6 max-w-7xl animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Dashboard de Analytics
        </h1>
        <p className="text-gray-500 mt-1">
          Analise as métricas de performance e funil da sua equipe.
        </p>
      </div>

      <FilterPanel onFiltersChange={setFilters} />

      <div className="border-b border-gray-200 dark:border-gray-800">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('captadores')}
            className={cn(
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'captadores'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            Captadores
          </button>
          <button
            onClick={() => setActiveTab('corretores')}
            className={cn(
              'whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors',
              activeTab === 'corretores'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            )}
          >
            Corretores / SDRs
          </button>
        </nav>
      </div>

      <div className="mt-6">
        {activeTab === 'captadores' && <DashboardCaptadores filters={filters} />}
        {activeTab === 'corretores' && (
          <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl bg-gray-50 dark:bg-gray-900/50">
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">
              Em Desenvolvimento
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              O dashboard de métricas para Corretores e SDRs estará disponível em breve.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnalyticsDashboard
