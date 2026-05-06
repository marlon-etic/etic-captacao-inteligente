import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import {
  Home,
  Link as LinkIcon,
  Package,
  Eye,
  CheckCircle,
  Percent,
  AlertCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardFilters } from './FilterPanel'
import { MetricDetailModal } from './MetricDetailModal'

interface DashboardProps {
  filters: DashboardFilters
}

interface MetricCard {
  label: string
  value: number
  trend: number
  icon: React.ReactNode
  color: 'green' | 'red' | 'blue' | 'orange'
  metricType?: string
}

interface CaptadorRow {
  id: string
  name: string
  email: string
  totalCaptured: number
  linkedProperties: number
  freeProperties: number
  conversionRate: number
}

export function DashboardCaptadores({ filters }: DashboardProps) {
  const [metrics, setMetrics] = useState<MetricCard[]>([])
  const [captadores, setCaptadores] = useState<CaptadorRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean
    metricType: string
    metricLabel: string
  } | null>(null)

  useEffect(() => {
    if (filters.userIds.length === 0) {
      setMetrics([])
      setCaptadores([])
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
        start = new Date(filters.periodRange?.start || now)
        end = new Date(filters.periodRange?.end || now)
        end.setHours(23, 59, 59, 999)
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

      console.group('[DashboardCaptadores] 📊 CARREGANDO MÉTRICAS REAIS')
      console.log('Filtros:', { userIds: filters.userIds, dateRange })

      if (!filters.userIds || filters.userIds.length === 0) {
        console.warn('Nenhum usuário selecionado')
        setMetrics([])
        setLoading(false)
        console.groupEnd()
        return
      }

      // ✅ 1️⃣ TOTAL DE IMÓVEIS CAPTADOS
      const {
        data: allProps,
        count: totalCount,
        error,
      } = await supabase
        .from('imoveis_captados')
        .select('id, demanda_locacao_id, demanda_venda_id, status_captacao, etapa_funil', {
          count: 'exact',
        })
        .in('user_captador_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      if (error) throw error

      const total = totalCount || 0
      console.log(`✅ Imóveis Captados: ${total}`)

      // ✅ 2️⃣ SOB DEMANDA (vinculados)
      const linkedCount = (allProps || []).filter(
        (p) => p.demanda_locacao_id || p.demanda_venda_id,
      ).length
      console.log(`✅ Sob Demanda: ${linkedCount}`)

      // ✅ 3️⃣ IMÓVEIS LIVRES (sem vinculação)
      const freeCount = (allProps || []).filter(
        (p) => !p.demanda_locacao_id && !p.demanda_venda_id,
      ).length
      console.log(`✅ Imóveis Livres: ${freeCount}`)

      // ✅ VALIDAÇÃO: Sob Demanda + Livres = Total
      if (linkedCount + freeCount !== total) {
        console.warn(`⚠️ Inconsistência: ${linkedCount} + ${freeCount} ≠ ${total}`)
      }

      // ✅ 4️⃣ SEM RESPOSTA / PERDIDOS
      const lostCount = (allProps || []).filter((p) => {
        const status = (p.status_captacao || p.etapa_funil || '').toLowerCase()
        return status.includes('perdido') || status.includes('sem resposta')
      }).length
      console.log(`✅ Sem Resposta/Perdidos: ${lostCount}`)

      // ✅ 5️⃣ EM VISITA
      const visitCount = (allProps || []).filter((p) => {
        const status = (p.status_captacao || p.etapa_funil || '').toLowerCase()
        return status.includes('visita') || status === 'visitado'
      }).length
      console.log(`✅ Em Visita: ${visitCount}`)

      // ✅ 6️⃣ FECHADOS
      const closedCount = (allProps || []).filter((p) => {
        const status = (p.status_captacao || p.etapa_funil || '').toLowerCase()
        return (
          status.includes('fechado') || status.includes('concluído') || status.includes('concluido')
        )
      }).length
      console.log(`✅ Fechados: ${closedCount}`)

      // ✅ 7️⃣ TAXA DE CONVERSÃO
      const conversionRate = total > 0 ? (closedCount / total) * 100 : 0
      console.log(`✅ Taxa de Conversão: ${conversionRate}%`)

      // Cálculo de Trend para o Total
      const previousDateRange = getPreviousDateRange(dateRange)
      const { count: previousTotalCount } = await supabase
        .from('imoveis_captados')
        .select('id', { count: 'exact', head: true })
        .in('user_captador_id', filters.userIds)
        .gte('created_at', previousDateRange.start)
        .lt('created_at', previousDateRange.end)

      const trendTotal =
        (previousTotalCount || 0) > 0
          ? ((total - (previousTotalCount || 0)) / (previousTotalCount || 0)) * 100
          : 0

      console.groupEnd()

      const metricsCards: MetricCard[] = [
        {
          label: 'Imóveis Captados',
          value: total,
          trend: trendTotal,
          icon: <Home className="w-6 h-6 text-blue-500" />,
          color: 'blue',
          metricType: 'property_created',
        },
        {
          label: 'Sob Demanda',
          value: linkedCount,
          trend: 0,
          icon: <LinkIcon className="w-6 h-6 text-indigo-500" />,
          color: 'blue',
          metricType: 'property_linked',
        },
        {
          label: 'Imóveis Livres',
          value: freeCount,
          trend: 0,
          icon: <Package className="w-6 h-6 text-teal-500" />,
          color: 'blue',
          metricType: 'property_free',
        },
        {
          label: 'Sem Resposta / Perdidos',
          value: lostCount,
          trend: 0,
          icon: <AlertCircle className="w-6 h-6 text-orange-500" />,
          color: 'orange',
          metricType: 'property_marked_lost',
        },
        {
          label: 'Em Visita',
          value: visitCount,
          trend: 0,
          icon: <Eye className="w-6 h-6 text-purple-500" />,
          color: 'blue',
          metricType: 'property_visit_scheduled',
        },
        {
          label: 'Fechados',
          value: closedCount,
          trend: 0,
          icon: <CheckCircle className="w-6 h-6 text-green-500" />,
          color: 'green',
          metricType: 'property_deal_closed',
        },
        {
          label: 'Taxa de Conversão',
          value: Math.round(conversionRate),
          trend: 0,
          icon: (
            <Percent
              className={cn('w-6 h-6', conversionRate >= 10 ? 'text-green-500' : 'text-red-500')}
            />
          ),
          color: conversionRate >= 10 ? 'green' : 'red',
        },
      ]

      setMetrics(metricsCards)
      await loadCaptadores(filters.userIds, dateRange)
    } catch (err) {
      console.error('[DashboardCaptadores] Erro:', err)
      setError('Erro ao carregar métricas. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const loadCaptadores = async (userIds: string[], dateRange: { start: string; end: string }) => {
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, email, nome')
        .in('id', userIds)

      if (usersError) throw usersError

      const captadorRows: CaptadorRow[] = []

      const { data: properties, error: propsError } = await supabase
        .from('imoveis_captados')
        .select(
          'user_captador_id, demanda_locacao_id, demanda_venda_id, status_captacao, etapa_funil',
        )
        .in('user_captador_id', userIds)
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)

      if (propsError) throw propsError

      for (const user of users || []) {
        const userProps = properties?.filter((p) => p.user_captador_id === user.id) || []
        const total = userProps.length
        const linked = userProps.filter((p) => p.demanda_locacao_id || p.demanda_venda_id).length
        const free = Math.max(0, total - linked)

        const closed = userProps.filter((p) => {
          const status = (p.status_captacao || p.etapa_funil || '').toLowerCase()
          return (
            status.includes('fechado') ||
            status.includes('concluído') ||
            status.includes('concluido')
          )
        }).length

        const conversionRate = total > 0 ? (closed / total) * 100 : 0

        captadorRows.push({
          id: user.id,
          name: user.nome || 'Sem nome',
          email: user.email,
          totalCaptured: total,
          linkedProperties: linked,
          freeProperties: free,
          conversionRate: Math.round(conversionRate),
        })
      }

      captadorRows.sort((a, b) => b.totalCaptured - a.totalCaptured)
      setCaptadores(captadorRows)
    } catch (err) {
      console.error('[DashboardCaptadores] Erro ao carregar captadores:', err)
    }
  }

  if (loading && metrics.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Analisando dados e compilando métricas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium">
        {error}
      </div>
    )
  }

  if (filters.userIds.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-gray-300 dark:border-gray-800 rounded-xl bg-gray-50/50 dark:bg-gray-900/30 text-gray-500 text-sm">
        Nenhum usuário selecionado ou encontrado para visualizar as métricas.
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {metrics.map((metric, idx) => (
          <div
            key={idx}
            className={cn(
              'bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm transition-shadow duration-200',
              metric.metricType
                ? 'cursor-pointer hover:shadow-md hover:border-blue-300 dark:hover:border-blue-800'
                : '',
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
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {metric.label}
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                  {metric.value}
                </h3>

                {metric.trend !== 0 ? (
                  <p
                    className={cn(
                      'text-xs font-semibold mt-2.5 flex items-center gap-1',
                      metric.trend > 0
                        ? 'text-green-600 dark:text-green-500'
                        : 'text-red-600 dark:text-red-500',
                    )}
                  >
                    {metric.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(metric.trend))}%{' '}
                    <span className="text-gray-400 font-normal">vs. anterior</span>
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mt-2.5 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block mr-1"></span>
                    Estável no período
                  </p>
                )}
              </div>
              <div
                className={cn(
                  'p-2.5 rounded-lg',
                  metric.color === 'blue' && 'bg-blue-50 dark:bg-blue-500/10',
                  metric.color === 'green' && 'bg-green-50 dark:bg-green-500/10',
                  metric.color === 'red' && 'bg-red-50 dark:bg-red-500/10',
                  metric.color === 'orange' && 'bg-orange-50 dark:bg-orange-500/10',
                )}
              >
                {metric.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Performance Detalhada por Captador
          </h3>
          {loading && (
            <div className="text-xs text-gray-500 animate-pulse flex items-center gap-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div> Atualizando...
            </div>
          )}
        </div>

        <div className="w-full overflow-x-auto">
          {captadores.length === 0 ? (
            <div className="py-12 text-center text-sm text-gray-500">
              Nenhum dado encontrado para os filtros selecionados no momento.
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">Captador</th>
                  <th className="px-6 py-4 font-semibold text-center">Total Captado</th>
                  <th className="px-6 py-4 font-semibold text-center">Sob Demanda</th>
                  <th className="px-6 py-4 font-semibold text-center">Livres</th>
                  <th className="px-6 py-4 font-semibold text-right">Taxa de Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {captadores.map((row) => (
                  <tr
                    key={row.id}
                    className="bg-white dark:bg-gray-950 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="font-medium text-gray-900 dark:text-white">{row.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{row.email}</p>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-gray-900 dark:text-white text-base">
                      {row.totalCaptured}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-green-600 dark:text-green-500">
                      {row.linkedProperties}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600 dark:text-blue-500">
                      {row.freeProperties}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          'inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-bold',
                          row.conversionRate >= 10
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
                        )}
                      >
                        {row.conversionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
