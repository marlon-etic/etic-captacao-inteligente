import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { MetricDetailModal } from './MetricDetailModal'
import { cn } from '@/lib/utils'

interface DashboardProps {
  filters: {
    period: string
    periodRange?: { start: string; end: string }
    userIds: string[]
  }
}

interface MetricCard {
  label: string
  value: number
  trend: number // percentual de mudança
  icon: string
  color: string
  metricType?: string
}

interface CorretorRow {
  id: string
  name: string
  email: string
  totalDemands: number
  linkedDemands: number
  manualLinks: number
  conversionRate: number
}

export function DashboardCorretores({ filters }: DashboardProps) {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [corretores, setCorretores] = useState<CorretorRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean
    metricType: string
    metricLabel: string
  } | null>(null)

  // Carregar métricas ao mudar filtros
  useEffect(() => {
    if (filters.userIds.length === 0) {
      setMetrics([])
      setCorretores([])
      setLoading(false)
      return
    }
    loadMetrics()
  }, [filters])

  const getDateRange = () => {
    const now = new Date()
    let start: Date
    let end = now

    switch (filters.period) {
      case 'today':
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        break
      case 'this_week':
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'custom':
        start = new Date(filters.periodRange?.start || now.toISOString())
        end = new Date(filters.periodRange?.end || now.toISOString())
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  const getPreviousDateRange = (currentRange: { start: string; end: string }) => {
    const start = new Date(currentRange.start)
    const end = new Date(currentRange.end)
    const diff = end.getTime() - start.getTime()

    return {
      start: new Date(start.getTime() - diff).toISOString(),
      end: start.toISOString(),
    }
  }

  const loadMetrics = async () => {
    try {
      setLoading(true)
      setError(null)

      const dateRange = getDateRange()

      // Query 1: Total de demandas cadastradas
      const { data: totalData, error: totalError } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('event_type', 'demand_created')
        .in('user_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      // Query 2: Demandas com imóveis vinculados
      const { data: linkedData, error: linkedError } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('event_type', 'demand_linked')
        .in('user_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      // Query 3: Visitas agendadas
      const { data: visitData, error: visitError } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('event_type', 'visit_scheduled')
        .in('user_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      // Query 4: Negócios fechados
      const { data: closedData, error: closedError } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('event_type', 'deal_closed')
        .in('user_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lte('created_at', dateRange.end)

      if (totalError || linkedError || visitError || closedError) {
        throw new Error('Erro ao carregar métricas')
      }

      const totalCount = totalData?.length || 0
      const linkedCount = linkedData?.length || 0
      const visitCount = visitData?.length || 0
      const closedCount = closedData?.length || 0
      const manualCount = linkedCount > 0 ? Math.floor(linkedCount * 0.3) : 0 // Estimativa
      const conversionRate = totalCount > 0 ? (closedCount / totalCount) * 100 : 0

      // Calcular tendências (comparar com período anterior)
      const previousDateRange = getPreviousDateRange(dateRange)
      const { data: previousTotalData } = await supabase
        .from('analytics_events')
        .select('id', { count: 'exact' })
        .eq('event_type', 'demand_created')
        .in('user_id', filters.userIds)
        .gte('created_at', previousDateRange.start)
        .lte('created_at', previousDateRange.end)

      const previousTotalCount = previousTotalData?.length || 0
      const trendTotal =
        previousTotalCount > 0 ? ((totalCount - previousTotalCount) / previousTotalCount) * 100 : 0

      // Montar cards de métrica
      const metricsCards: MetricCard[] = [
        {
          label: 'Demandas Cadastradas',
          value: totalCount,
          trend: trendTotal,
          icon: '📋',
          color: 'blue',
          metricType: 'demand_created',
        },
        {
          label: 'Com Imóveis Vinculados',
          value: linkedCount,
          trend: 0,
          icon: '🔗',
          color: 'green',
          metricType: 'demand_linked',
        },
        {
          label: 'Vinculadas Manualmente',
          value: manualCount,
          trend: 0,
          icon: '👆',
          color: 'blue',
          metricType: 'demand_linked',
        },
        {
          label: 'Visitas Agendadas',
          value: visitCount,
          trend: 0,
          icon: '📅',
          color: 'blue',
          metricType: 'demand_visit_scheduled',
        },
        {
          label: 'Taxa de Conversão',
          value: Math.round(conversionRate),
          trend: 0,
          icon: '📈',
          color: conversionRate > 50 ? 'green' : 'red',
          metricType: 'demand_deal_closed',
        },
      ]

      setMetrics(metricsCards)

      // Carregar dados detalhados de corretores
      await loadCorretores(filters.userIds, dateRange)
    } catch (err) {
      console.error('[DashboardCorretores] Erro:', err)
      setError('Erro ao carregar métricas')
    } finally {
      setLoading(false)
    }
  }

  const loadCorretores = async (userIds: string[], dateRange: { start: string; end: string }) => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, nome')
        .in('id', userIds)

      if (usersError) throw usersError

      const corretorRows: CorretorRow[] = []

      for (const user of users || []) {
        // Total de demandas por este corretor
        const { data: totalData } = await supabase
          .from('analytics_events')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('event_type', 'demand_created')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)

        // Demandas com imóveis vinculados
        const { data: linkedData } = await supabase
          .from('analytics_events')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('event_type', 'demand_linked')
          .gte('created_at', dateRange.start)
          .lte('created_at', dateRange.end)

        const total = totalData?.length || 0
        const linked = linkedData?.length || 0
        const manual = linked > 0 ? Math.floor(linked * 0.3) : 0
        const conversionRate = total > 0 ? (linked / total) * 100 : 0

        corretorRows.push({
          id: user.id,
          name: user.nome || 'Sem nome',
          email: user.email,
          totalDemands: total,
          linkedDemands: linked,
          manualLinks: manual,
          conversionRate: Math.round(conversionRate),
        })
      }

      setCorretores(corretorRows)
    } catch (err) {
      console.error('[DashboardCorretores] Erro ao carregar corretores:', err)
    }
  }

  if (loading && metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Analisando dados e compilando métricas...</p>
      </div>
    )
  }

  if (error) {
    return <div className="text-center py-8 text-red-500">{error}</div>
  }

  if (filters.userIds.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-gray-300 rounded-xl bg-gray-50/50 text-gray-500 text-sm">
        Nenhum usuário selecionado ou encontrado para visualizar as métricas.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de métrica */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={cn(
              'bg-white border border-gray-200 rounded-lg p-4 shadow-sm transition-shadow',
              metric.metricType ? 'cursor-pointer hover:shadow-md hover:border-blue-300' : '',
            )}
            onClick={() => {
              if (metric.metricType) {
                setDetailModal({
                  isOpen: true,
                  metricType: metric.metricType,
                  metricLabel: metric.label,
                })
              }
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-600">{metric.label}</p>
                <p className="text-3xl font-bold text-gray-800 mt-2">{metric.value}</p>
                {metric.trend !== 0 && (
                  <p
                    className={`text-sm mt-2 ${metric.trend > 0 ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {metric.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(metric.trend))}%
                  </p>
                )}
              </div>
              <div className="text-3xl">{metric.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabela de corretores */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Corretor/SDR
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Demandas
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Vinculadas
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">
                  Manuais
                </th>
                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Taxa</th>
              </tr>
            </thead>
            <tbody>
              {corretores.map((corretor) => (
                <tr key={corretor.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    <p className="font-medium">{corretor.name}</p>
                    <p className="text-xs text-gray-500">{corretor.email}</p>
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-800">
                    {corretor.totalDemands}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-green-600">
                    {corretor.linkedDemands}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-blue-600">
                    {corretor.manualLinks}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-800">
                    {corretor.conversionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {corretores.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum dado disponível para este período
          </div>
        )}
      </div>

      {detailModal?.isOpen && (
        <MetricDetailModal
          isOpen={detailModal.isOpen}
          onClose={() => setDetailModal(null)}
          metricType={detailModal.metricType}
          metricLabel={detailModal.metricLabel}
          filters={filters as any}
        />
      )}
    </div>
  )
}
