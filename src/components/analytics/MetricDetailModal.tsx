import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { supabase } from '@/lib/supabase/client'
import { X, Search, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'

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

export function MetricDetailModal({
  isOpen,
  onClose,
  metricType,
  metricLabel,
  filters,
}: MetricDetailModalProps) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedItem, setSelectedItem] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // ✅ BLOQUEAR SCROLL DO BODY QUANDO MODAL ABERTO
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // ✅ VALIDAR FILTROS ANTES DE CARREGAR
  useEffect(() => {
    if (isOpen) {
      if (!filters.userIds || filters.userIds.length === 0) {
        console.warn('[MetricDetailModal] Nenhum usuário selecionado - não carregando dados')
        setItems([])
        setLoading(false)
        return
      }
      loadDetails()
    }
  }, [isOpen, filters, metricType])

  const getDateRange = () => {
    // ✅ Se o dashboard enviou periodRange, respeitar ele acima de tudo
    if (filters.periodRange?.start && filters.periodRange?.end) {
      const start = new Date(filters.periodRange.start)
      const end = new Date(filters.periodRange.end)
      // Garante que pega até o final do último dia
      if (start.toDateString() === end.toDateString() && end.getHours() === 0) {
        end.setHours(23, 59, 59, 999)
      }
      return {
        start: start.toISOString(),
        end: end.toISOString(),
      }
    }

    const now = new Date()
    let start = new Date()
    let end = new Date()

    switch (filters.period) {
      case 'today':
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'this_week': {
        const day = now.getDay()
        const diff = now.getDate() - day + (day === 0 ? -6 : 1) // ajusta para segunda
        start = new Date(now.setDate(diff))
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      }
      case 'this_month':
        start = new Date(now.getFullYear(), now.getMonth(), 1)
        start.setHours(0, 0, 0, 0)
        end.setHours(23, 59, 59, 999)
        break
      case 'custom':
        if (filters.periodRange?.start) start = new Date(filters.periodRange.start)
        if (filters.periodRange?.end) end = new Date(filters.periodRange.end)
        end.setHours(23, 59, 59, 999)
        break
      default:
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        end.setHours(23, 59, 59, 999)
    }

    return {
      start: start.toISOString(),
      end: end.toISOString(),
    }
  }

  const loadDetails = async () => {
    try {
      setLoading(true)
      const dateRange = getDateRange()

      if (metricType.startsWith('property')) {
        await loadPropertiesData(dateRange, metricType)
      } else if (metricType.startsWith('demand')) {
        await loadDemandsData(dateRange, metricType)
      }
    } catch (err) {
      console.error('[MetricDetailModal] Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadPropertiesData = async (dateRange: { start: string; end: string }, type: string) => {
    try {
      console.group(`[Modal] 🔍 CARREGANDO LISTA - Tipo: ${type}`)
      console.log('Filtros:', { userIds: filters.userIds, dateRange })

      if (!filters.userIds || filters.userIds.length === 0) {
        setItems([])
        return
      }

      // ✅ MESMA QUERY BASE DO DASHBOARD (PROMPT 1)
      const { data: allProps, error } = await supabase
        .from('imoveis_captados')
        .select(
          'id, codigo_imovel, endereco, preco, tipo, status_captacao, etapa_funil, user_captador_id, created_at, demanda_locacao_id, demanda_venda_id, dormitorios, vagas, observacoes',
        )
        .in('user_captador_id', filters.userIds)
        .gte('created_at', dateRange.start)
        .lt('created_at', dateRange.end)
        .order('created_at', { ascending: false })

      if (error) throw error

      console.log(`Total bruto: ${allProps?.length || 0}`)

      // ✅ FILTRAR POR TIPO DE MÉTRICA
      let filtered = allProps || []

      switch (type) {
        case 'property_created':
          // Todos os captados (sem filtro adicional)
          break
        case 'property_linked':
          filtered = filtered.filter((p) => p.demanda_locacao_id || p.demanda_venda_id)
          break
        case 'property_free':
          filtered = filtered.filter((p) => !p.demanda_locacao_id && !p.demanda_venda_id)
          break
        case 'property_visit_scheduled':
        case 'property_visit':
          filtered = filtered.filter((p) => {
            const s = (p.status_captacao || p.etapa_funil || '').toLowerCase()
            return (
              s === 'visita' ||
              s === 'em visita' ||
              s === 'em_visita' ||
              s.includes('visita') ||
              s === 'visitado'
            )
          })
          break
        case 'property_deal_closed':
        case 'property_closed':
          filtered = filtered.filter((p) => {
            const s = (p.status_captacao || p.etapa_funil || '').toLowerCase()
            return (
              s === 'fechado' || s === 'concluído' || s === 'concluido' || s.includes('fechado')
            )
          })
          break
        case 'property_marked_lost':
        case 'property_lost':
          filtered = filtered.filter((p) => {
            const s = (p.status_captacao || p.etapa_funil || '').toLowerCase()
            return (
              s === 'perdido' ||
              s === 'sem resposta' ||
              s === 'sem_resposta' ||
              s.includes('perdido') ||
              s.includes('sem resposta')
            )
          })
          break
      }

      console.log(`✅ Após filtro de tipo: ${filtered.length}`)

      // ✅ ENRIQUECER COM DADOS DO CAPTADOR
      const allUserIds = Array.from(
        new Set(filtered.map((p) => p.user_captador_id).filter(Boolean)),
      )
      const usersMap = new Map()
      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, nome')
          .in('id', allUserIds)
        usersData?.forEach((u) => usersMap.set(u.id, u.nome))
      }

      const enriched = filtered.map((prop) => ({
        id: prop.id,
        codigo_imovel: prop.codigo_imovel,
        captador_nome: usersMap.get(prop.user_captador_id) || 'Desconhecido',
        captador_id: prop.user_captador_id,
        data_captacao: prop.created_at,
        endereco: prop.endereco,
        preco: prop.preco,
        tipo: prop.tipo,
        status: prop.status_captacao || prop.etapa_funil,
        dormitorios: prop.dormitorios,
        vagas: prop.vagas,
        observacoes: prop.observacoes,
        demanda_locacao_id: prop.demanda_locacao_id,
        demanda_venda_id: prop.demanda_venda_id,
      }))

      console.log(`✅ TOTAL FINAL DA LISTA: ${enriched.length}`)
      console.log('Códigos:', enriched.map((e) => e.codigo_imovel).join(', '))
      console.groupEnd()

      setItems(enriched)
    } catch (err) {
      console.error('[Modal] ❌ Erro:', err)
      setItems([])
      console.groupEnd()
    }
  }

  const loadDemandsData = async (dateRange: { start: string; end: string }, type: string) => {
    try {
      console.group('[loadDemandsData] 🔍 INICIANDO COM FILTROS')
      console.log('📋 FILTROS APLICADOS:')
      console.log('  userIds:', filters.userIds)
      console.log('  dateRange:', dateRange)

      // ✅ VALIDAÇÃO CRÍTICA
      if (!filters.userIds || filters.userIds.length === 0) {
        console.error('❌ ERRO: Nenhum usuário selecionado')
        setItems([])
        setLoading(false)
        return
      }

      // ✅ BUSCAR DEMANDAS DE LOCAÇÃO COM FILTROS
      console.log('🔄 Buscando demandas de locação...')
      const { data: demandsLoc, error: errLoc } = await supabase
        .from('demandas_locacao')
        .select(
          'id, nome_cliente, sdr_id, created_at, valor_minimo, valor_maximo, bairros, nivel_urgencia, urgencia, status_demanda',
        )
        .in('sdr_id', filters.userIds) // ✅ FILTRO DE USUÁRIOS
        .gte('created_at', dateRange.start) // ✅ FILTRO DE DATA INÍCIO
        .lt('created_at', dateRange.end) // ✅ FILTRO DE DATA FIM

      if (errLoc) {
        console.error('❌ Erro ao buscar demandas de locação:', errLoc)
        throw errLoc
      }

      console.log(`✅ Demandas de locação encontradas: ${demandsLoc?.length || 0}`)

      // ✅ BUSCAR DEMANDAS DE VENDA COM FILTROS
      console.log('🔄 Buscando demandas de venda...')
      const { data: demandsVen, error: errVen } = await supabase
        .from('demandas_vendas')
        .select(
          'id, nome_cliente, corretor_id, created_at, valor_minimo, valor_maximo, bairros, nivel_urgencia, urgencia, status_demanda',
        )
        .in('corretor_id', filters.userIds) // ✅ FILTRO DE USUÁRIOS
        .gte('created_at', dateRange.start) // ✅ FILTRO DE DATA INÍCIO
        .lt('created_at', dateRange.end) // ✅ FILTRO DE DATA FIM

      if (errVen) {
        console.error('❌ Erro ao buscar demandas de venda:', errVen)
        throw errVen
      }

      console.log(`✅ Demandas de venda encontradas: ${demandsVen?.length || 0}`)

      let allDemands = [...(demandsLoc || []), ...(demandsVen || [])]
      console.log(`✅ TOTAL DE DEMANDAS: ${allDemands.length}`)

      if (type === 'demand_deal_closed') {
        allDemands = allDemands.filter((d) => d.status_demanda === 'ganho')
        console.log(`✅ Após filtro "deal closed": ${allDemands.length} demandas`)
      }

      const allUserIds = Array.from(
        new Set(allDemands.map((d) => d.sdr_id || d.corretor_id).filter(Boolean)),
      )
      const usersMap = new Map()
      if (allUserIds.length > 0) {
        const { data: usersData } = await supabase
          .from('users')
          .select('id, nome')
          .in('id', allUserIds)
        usersData?.forEach((u) => usersMap.set(u.id, u.nome))
      }

      const demandIds = allDemands.map((d) => d.id)
      const linkedPropsMap = new Map()

      // ✅ CONTAR IMÓVEIS VINCULADOS (RESPEITANDO FILTROS)
      if (demandIds.length > 0) {
        const demandIdsStr = demandIds.join(',')
        const userIdsStr = filters.userIds.join(',')
        const { data: linkedProps, error: errLinked } = await supabase
          .from('imoveis_captados')
          .select('id, demanda_locacao_id, demanda_venda_id')
          .or(`demanda_locacao_id.in.(${demandIdsStr}),demanda_venda_id.in.(${demandIdsStr})`)
          .in('user_captador_id', filters.userIds) // ✅ RESPEITAR FILTRO DE USUÁRIOS
          .gte('created_at', dateRange.start) // ✅ RESPEITAR FILTRO DE DATA
          .lt('created_at', dateRange.end)

        if (errLinked) {
          console.warn('[loadDemandsData] Erro ao contar imóveis vinculados:', errLinked)
        }

        linkedProps?.forEach((lp) => {
          const dId = lp.demanda_locacao_id || lp.demanda_venda_id
          if (dId) {
            linkedPropsMap.set(dId, (linkedPropsMap.get(dId) || 0) + 1)
          }
        })
      }

      // ✅ ENRIQUECER COM DADOS DO CORRETOR/SDR
      let enrichedItems = allDemands.map((demand) => ({
        id: demand.id,
        nome_cliente: demand.nome_cliente,
        corretor_nome: usersMap.get(demand.sdr_id || demand.corretor_id) || 'Desconhecido',
        corretor_id: demand.sdr_id || demand.corretor_id,
        data_criacao: demand.created_at,
        valor_minimo: demand.valor_minimo,
        valor_maximo: demand.valor_maximo,
        bairros: demand.bairros || [],
        urgencia: demand.urgencia || demand.nivel_urgencia || 'Normal',
        imoveiVinculados: linkedPropsMap.get(demand.id) || 0,
        type: demand.sdr_id ? 'locacao' : 'venda',
        status: demand.status_demanda,
      }))

      if (type === 'demand_linked') {
        enrichedItems = enrichedItems.filter((d) => d.imoveiVinculados > 0)
        console.log(`✅ Após filtro "linked": ${enrichedItems.length} demandas`)
      }

      console.log(`✅ TOTAL FINAL: ${enrichedItems.length} demandas`)
      console.log('📝 Clientes das demandas:', enrichedItems.map((i) => i.nome_cliente).join(', '))
      console.groupEnd()

      setItems(
        enrichedItems.sort(
          (a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime(),
        ),
      )
    } catch (err) {
      console.error('[loadDemandsData] ❌ Erro:', err)
      setItems([])
      console.groupEnd()
    }
  }

  const filteredItems = items.filter((item) => {
    const searchLower = searchQuery.toLowerCase()
    return (
      (item.codigo_imovel && item.codigo_imovel.toLowerCase().includes(searchLower)) ||
      (item.captador_nome && item.captador_nome.toLowerCase().includes(searchLower)) ||
      (item.nome_cliente && item.nome_cliente.toLowerCase().includes(searchLower)) ||
      (item.corretor_nome && item.corretor_nome.toLowerCase().includes(searchLower)) ||
      (item.endereco && item.endereco.toLowerCase().includes(searchLower))
    )
  })

  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage)

  if (!isOpen) return null

  const content = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm animate-fade-in overflow-y-auto"
      style={{ zIndex: 9998, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-950 rounded-xl shadow-2xl w-full max-w-[95vw] md:max-w-[85vw] lg:max-w-[1000px] max-h-[80vh] flex flex-col animate-fade-in-up border border-gray-200 dark:border-gray-800 relative my-8"
        style={{ zIndex: 9999 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-4 md:p-6 flex flex-col shrink-0 rounded-t-xl sticky top-0 z-30">
          <div className="flex justify-between items-center w-full">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{metricLabel}</h2>
              <p className="text-blue-100 text-sm mt-0.5 font-medium">
                Total: {filteredItems.length} registros
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors focus:outline-none flex shrink-0"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ✅ INDICADOR DE FILTROS APLICADOS */}
        <div className="bg-blue-700 text-blue-100 px-4 md:px-6 py-2 text-xs flex gap-2 shrink-0 z-20">
          <span className="font-semibold">🔍 Filtros:</span>
          <span>
            {filters.userIds.length} usuário(s) | Período: {filters.period}
          </span>
        </div>

        <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 shrink-0 z-20">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por código, nome ou responsável..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
            />
          </div>
        </div>

        <div
          className={cn(
            'flex-1 overflow-y-auto min-h-0 bg-white dark:bg-gray-950 relative',
            totalPages <= 1 && 'rounded-b-xl',
          )}
        >
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-medium">Buscando detalhes com base nos filtros...</p>
            </div>
          ) : !filters.userIds || filters.userIds.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-800 m-8 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
              Selecione pelo menos um usuário no painel de filtros para visualizar os dados.
            </div>
          ) : paginatedItems.length === 0 ? (
            <div className="text-center py-16 text-gray-500 text-sm border border-dashed border-gray-200 dark:border-gray-800 m-8 rounded-xl bg-gray-50/50 dark:bg-gray-900/30">
              Nenhum registro encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto w-full pb-safe">
              {metricType.startsWith('property') ? (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Usuário Captador
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Código do Imóvel
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Link do Imóvel
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300 text-center">
                        Detalhes
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Data da Captação
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-5 py-3.5 text-gray-900 dark:text-white font-medium">
                          {item.captador_nome}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 font-mono">
                          {item.codigo_imovel}
                        </td>
                        <td className="px-5 py-3.5">
                          <a
                            href={`https://www.eticimoveis.com.br/imovel/${item.codigo_imovel}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                            onClick={(e) => e.stopPropagation()}
                          >
                            Ver no site <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Ver Card
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                          {new Date(item.data_captacao).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="bg-gray-50 dark:bg-gray-900/80 sticky top-0 z-10 border-b border-gray-200 dark:border-gray-800">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Corretor/SDR
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Data da Demanda
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Valor
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300">
                        Bairro(s)
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300 text-center">
                        Urgência
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300 text-center">
                        Imóveis Vinculados
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-gray-700 dark:text-gray-300 text-center">
                        Ver Card
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {paginatedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors"
                        onClick={() => setSelectedItem(item)}
                      >
                        <td className="px-5 py-3.5 text-gray-900 dark:text-white font-medium">
                          {item.corretor_nome}
                        </td>
                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                          {new Date(item.data_criacao).toLocaleString('pt-BR', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="px-5 py-3.5 text-gray-700 dark:text-gray-300 font-medium">
                          R$ {item.valor_minimo?.toLocaleString('pt-BR') || 0} - R${' '}
                          {item.valor_maximo?.toLocaleString('pt-BR') || 0}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400 max-w-[200px] truncate">
                          {(item.bairros || []).join(', ') || '-'}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <span
                            className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
                              item.urgencia === 'Crítica' || item.urgencia === 'Urgente'
                                ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                                : item.urgencia === 'Alta'
                                  ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                                  : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                            )}
                          >
                            {item.urgencia}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          {item.imoveiVinculados > 0 ? (
                            <span className="text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded">
                              Sim ({item.imoveiVinculados})
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 font-medium">
                              Não
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedItem(item)
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-semibold hover:bg-blue-700 transition-colors shadow-sm"
                          >
                            Ver Card
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="bg-gray-50 dark:bg-gray-900/80 px-4 md:px-6 py-4 flex justify-between items-center border-t border-gray-200 dark:border-gray-800 shrink-0 rounded-b-xl sticky bottom-0 z-30">
            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
              Página {currentPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Próxima <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedItem && (
        <DetailDrawer
          item={selectedItem}
          metricType={metricType}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(content, document.body) : null
}

function DetailDrawer({
  item,
  metricType,
  onClose,
}: {
  item: any
  metricType: string
  onClose: () => void
}) {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadHistory()
  }, [item])

  const loadHistory = async () => {
    try {
      setLoading(true)

      let query = supabase
        .from('analytics_events')
        .select('event_type, created_at, user_id, event_data')
        .order('created_at', { ascending: false })
        .limit(50)

      if (metricType.startsWith('property')) {
        query = query.or(
          `event_data->>property_id.eq.${item.id},event_data->>codigo_imovel.eq.${item.codigo_imovel}`,
        )
      } else {
        query = query.or(`event_data->>demand_id.eq.${item.id}`)
      }

      const { data: events } = await query

      setHistory(events || [])
    } catch (err) {
      console.error('[DetailDrawer] Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      property_created: '📦 Imóvel Criado',
      property_linked: '🔗 Imóvel Vinculado',
      property_visit_scheduled: '📅 Visita Agendada',
      property_deal_closed: '✅ Negócio Fechado',
      demand_created: '📋 Demanda Criada',
      demand_linked: '🔗 Demanda Vinculada',
    }
    return labels[eventType] || eventType
  }

  const handleEdit = () => {
    if (metricType.startsWith('property')) {
      window.location.href = `/app/admin/properties`
    } else {
      window.location.href = `/app/demandas`
    }
  }

  const drawerContent = (
    <div
      className="fixed inset-0 flex justify-end backdrop-blur-sm"
      style={{ zIndex: 10000, backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-950 w-full max-w-md h-full overflow-y-auto shadow-2xl animate-slide-in-right flex flex-col"
        style={{ zIndex: 10001 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6 flex justify-between items-center sticky top-0 shrink-0 shadow-sm z-30">
          <h3 className="text-xl font-bold truncate pr-4">
            {metricType.startsWith('property') ? item.codigo_imovel : item.nome_cliente}
          </h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-2 transition-colors shrink-0"
            aria-label="Fechar detalhes"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {metricType.startsWith('property') ? (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl space-y-4 border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Código</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.codigo_imovel}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Usuário Captador</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {item.captador_nome}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Localização</p>
                  <p className="text-gray-700 dark:text-gray-300">{item.endereco}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Valor</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-500">
                    R$ {item.preco?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Tipo</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{item.tipo}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Status</p>
                  <p className="text-gray-700 dark:text-gray-300 capitalize font-medium">
                    {item.status}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Link do Imóvel</p>
                  <a
                    href={`https://www.eticimoveis.com.br/imovel/${item.codigo_imovel}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:underline text-sm inline-flex items-center gap-1 font-medium mt-1"
                  >
                    Abrir no site <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <button
                onClick={handleEdit}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Editar Imóvel
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-5 rounded-xl space-y-4 border border-gray-100 dark:border-gray-800">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Cliente</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {item.nome_cliente}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Corretor/SDR</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    {item.corretor_nome}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Data de Criação</p>
                  <p className="text-gray-700 dark:text-gray-300">
                    {new Date(item.data_criacao).toLocaleString('pt-BR')}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Valor</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">
                    R$ {item.valor_minimo?.toLocaleString('pt-BR') || 0} - R${' '}
                    {item.valor_maximo?.toLocaleString('pt-BR') || 0}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Bairros</p>
                  <p className="text-gray-700 dark:text-gray-300">{item.bairros.join(', ')}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">Urgência</p>
                  <p
                    className={cn(
                      'inline-block px-2.5 py-1 rounded-full text-xs font-semibold mt-1',
                      item.urgencia === 'Crítica' || item.urgencia === 'Urgente'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        : item.urgencia === 'Alta'
                          ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
                          : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
                    )}
                  >
                    {item.urgencia}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 uppercase font-semibold">
                    Imóveis Vinculados
                  </p>
                  <p
                    className={
                      item.imoveiVinculados > 0
                        ? 'text-green-600 dark:text-green-500 font-bold mt-1 bg-green-50 dark:bg-green-500/10 px-2 py-0.5 rounded inline-block'
                        : 'text-gray-500 font-medium mt-1'
                    }
                  >
                    {item.imoveiVinculados > 0 ? `Sim (${item.imoveiVinculados})` : 'Não'}
                  </p>
                </div>
              </div>

              <button
                onClick={handleEdit}
                className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold shadow-sm"
              >
                Editar Demanda
              </button>
            </div>
          )}

          <div className="pt-2">
            <h4 className="text-sm font-bold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-800 pb-2 mb-4">
              Histórico de Ações
            </h4>

            {loading ? (
              <div className="flex justify-center py-4">
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500">Nenhuma ação registrada neste período</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((event, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-50 dark:bg-gray-900/50 p-3.5 rounded-lg text-sm border-l-4 border-blue-500"
                  >
                    <p className="font-semibold text-gray-800 dark:text-gray-200">
                      {getEventLabel(event.event_type)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(event.created_at).toLocaleString('pt-BR', {
                        dateStyle: 'long',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' ? createPortal(drawerContent, document.body) : null
}
