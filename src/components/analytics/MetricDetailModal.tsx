import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { X, Search, ChevronLeft, ChevronRight } from 'lucide-react'

interface MetricDetailModalProps {
  isOpen: boolean
  onClose: () => void
  metricType: string
  metricLabel: string
  filters: {
    period: string
    periodRange?: { start: string; end: string }
    userIds: string[]
  }
}

interface DetailItem {
  id: string
  code: string
  title: string
  location: string
  value: number
  status: string
  createdAt: string
  createdBy: string
}

export function MetricDetailModal({
  isOpen,
  onClose,
  metricType,
  metricLabel,
  filters,
}: MetricDetailModalProps) {
  const [items, setItems] = useState<DetailItem[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<DetailItem | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  useEffect(() => {
    if (isOpen) {
      loadDetails()
    }
  }, [isOpen, filters, metricType])

  const loadDetails = async () => {
    try {
      setLoading(true)
      const dateRange = getDateRange()

      const { data: events, error } = await supabase
        .from('analytics_events')
        .select('id, user_id, event_data, created_at, event_type')
        .eq('event_type', metricType)
        .in('user_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (error) throw error

      const propertyIds = (events || [])
        .map(
          (e: any) =>
            e.event_data?.property_id || e.event_data?.codigo_imovel || e.event_data?.imovel_id,
        )
        .filter(Boolean)
      const demandIds = (events || [])
        .map((e: any) => e.event_data?.demand_id || e.event_data?.demanda_id)
        .filter(Boolean)
      const userIds = Array.from(new Set((events || []).map((e: any) => e.user_id).filter(Boolean)))

      const propertiesMap = new Map()
      if (propertyIds.length > 0) {
        const { data: props } = await supabase
          .from('imoveis_captados')
          .select('id, codigo_imovel, endereco, preco, status_captacao')
          .in('id', propertyIds)
        props?.forEach((p) => propertiesMap.set(p.id, p))
      }

      const demandsMap = new Map()
      if (demandIds.length > 0) {
        const { data: dLoc } = await supabase
          .from('demandas_locacao')
          .select('id, nome_cliente, bairros, valor_minimo, valor_maximo')
          .in('id', demandIds)
        dLoc?.forEach((d) => demandsMap.set(d.id, d))
        const { data: dVend } = await supabase
          .from('demandas_vendas')
          .select('id, nome_cliente, bairros, valor_minimo, valor_maximo')
          .in('id', demandIds)
        dVend?.forEach((d) => demandsMap.set(d.id, d))
      }

      const usersMap = new Map()
      if (userIds.length > 0) {
        const { data: usrs } = await supabase.from('users').select('id, nome').in('id', userIds)
        usrs?.forEach((u) => usersMap.set(u.id, u.nome))
      }

      const enrichedItems: DetailItem[] = []
      for (const event of events || []) {
        const pId =
          event.event_data?.property_id ||
          event.event_data?.codigo_imovel ||
          event.event_data?.imovel_id
        const dId = event.event_data?.demand_id || event.event_data?.demanda_id

        const p = propertiesMap.get(pId)
        const d = demandsMap.get(dId)
        const createdBy = usersMap.get(event.user_id) || 'Desconhecido'

        if (p && !enrichedItems.some((i) => i.id === p.id)) {
          enrichedItems.push({
            id: p.id,
            code: p.codigo_imovel || p.id.slice(0, 8),
            title: `Imóvel ${p.codigo_imovel || p.id.slice(0, 8)}`,
            location: p.endereco || 'Não informado',
            value: p.preco || 0,
            status: p.status_captacao || 'N/A',
            createdAt: event.created_at,
            createdBy,
          })
        } else if (d && !enrichedItems.some((i) => i.id === d.id)) {
          enrichedItems.push({
            id: d.id,
            code: `DEM-${d.id.slice(0, 8)}`,
            title: d.nome_cliente || 'Cliente',
            location: (d.bairros || []).join(', ') || 'Não informado',
            value: d.valor_maximo || d.valor_minimo || 0,
            status: 'Ativa',
            createdAt: event.created_at,
            createdBy,
          })
        } else if (!p && !d) {
          enrichedItems.push({
            id: event.id,
            code: `EVT-${event.id.slice(0, 8)}`,
            title: event.event_type,
            location: '-',
            value: 0,
            status: '-',
            createdAt: event.created_at,
            createdBy,
          })
        }
      }

      setItems(enrichedItems)
    } catch (err) {
      console.error('[MetricDetailModal] Erro:', err)
    } finally {
      setLoading(false)
    }
  }

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

  const filteredItems = items.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-fade-in-up">
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">{metricLabel}</h2>
            <p className="text-blue-100 mt-1 opacity-90">
              Total: {filteredItems.length} registros no período
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código ou nome..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Buscando detalhes...</p>
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm border border-dashed border-gray-200 m-8 rounded-xl bg-gray-50/50">
              Nenhum registro encontrado para esta métrica no período selecionado.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/80 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Código
                  </th>
                  <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Descrição
                  </th>
                  <th className="px-6 py-3.5 text-left font-semibold text-gray-700 dark:text-gray-300">
                    Localização
                  </th>
                  <th className="px-6 py-3.5 text-right font-semibold text-gray-700 dark:text-gray-300">
                    Valor
                  </th>
                  <th className="px-6 py-3.5 text-center font-semibold text-gray-700 dark:text-gray-300">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {paginatedItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group"
                    onClick={() => setSelectedItem(item)}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      {item.code}
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{item.title}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">
                      <span className="truncate max-w-[200px] block">{item.location}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      R$ {item.value.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="text-blue-600 dark:text-blue-400 text-xs font-semibold group-hover:underline">
                        Ver Mais
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-900 px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedItem && <DetailDrawer item={selectedItem} onClose={() => setSelectedItem(null)} />}
    </div>
  )
}

function DetailDrawer({ item, onClose }: { item: DetailItem; onClose: () => void }) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [item])

  const loadHistory = async () => {
    try {
      setLoading(true)
      const { data: events } = await supabase
        .from('analytics_events')
        .select('event_type, created_at, user_id, users(nome)')
        .or(
          `event_data->>property_id.eq.${item.id},event_data->>codigo_imovel.eq.${item.id},event_data->>demand_id.eq.${item.id},event_data->>demanda_id.eq.${item.id}`,
        )
        .order('created_at', { ascending: false })
        .limit(50)

      setHistory(events || [])
    } catch (err) {
      console.error('[DetailDrawer] Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex justify-end z-[60] animate-fade-in">
      <div className="bg-white dark:bg-gray-950 w-full max-w-md h-full overflow-y-auto shadow-2xl flex flex-col animate-slide-left">
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-6 flex justify-between items-start sticky top-0 z-10 shadow-sm">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">
              Detalhes do Registro
            </p>
            <h3 className="text-xl font-bold">{item.code}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl space-y-4 border border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Descrição
              </p>
              <p className="text-base font-medium text-gray-900 dark:text-white mt-1">
                {item.title}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Localização
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.location}</p>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Valor Registrado
              </p>
              <p className="text-xl font-bold text-green-600 dark:text-green-500 mt-1">
                R$ {item.value.toLocaleString('pt-BR')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 mt-1">
                  {item.status}
                </span>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Criado por
                </p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">
                  {item.createdBy}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Data de Criação
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                {new Date(item.createdAt).toLocaleString('pt-BR', {
                  dateStyle: 'long',
                  timeStyle: 'short',
                })}
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
              Histórico de Ações (Analytics)
            </h4>

            {loading ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500">Nenhum evento registrado</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-3 space-y-6">
                {history.map((event, idx) => (
                  <div key={idx} className="relative pl-6">
                    <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-gray-950 border-2 border-blue-500" />
                    <div>
                      <p className="font-semibold text-sm text-gray-900 dark:text-white capitalize-first">
                        {event.event_type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(event.created_at).toLocaleString('pt-BR', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                      {event.users?.nome && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 bg-gray-100 dark:bg-gray-800 inline-block px-2 py-0.5 rounded">
                          Por: {event.users.nome}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
