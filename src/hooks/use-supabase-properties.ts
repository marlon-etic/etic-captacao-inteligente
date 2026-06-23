import * as React from 'react'
const { useEffect, useState, useCallback } = React
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { getTiposVisiveis, normalizeTipo, isImovelVisivelParaRole } from '@/lib/roleFilters'
import { toast } from '@/components/ui/use-toast'

export interface SupabaseCapturedPropertyWithDemand {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  valor: number
  user_captador_id: string
  created_at: string
  updated_at?: string
  status_captacao: string
  captador_nome?: string
  bairros?: string[]
  dormitorios?: number
  vagas?: number
  observacoes?: string
  demanda?: any
  tipo?: string
  etapa_funil?: string
  data_visita?: string
  data_fechamento?: string
}

const extractNumber = (str: string): number | null => {
  if (!str) return null
  let val = str.replace(/[R$\s]/g, '')
  let multiplier = 1
  if (val.toLowerCase().includes('k')) {
    multiplier = 1000
    val = val.replace(/k/i, '')
  } else if (val.toLowerCase().includes('m')) {
    multiplier = 1000000
    val = val.replace(/m/i, '')
  }
  val = val.replace(/\./g, '').replace(',', '.')
  const num = parseFloat(val)
  return isNaN(num) ? null : num * multiplier
}

const parsePriceFilter = (label: string) => {
  if (!label || typeof label !== 'string') return null

  const isLocacao = label.startsWith('L:')
  const isVenda = label.startsWith('V:')

  if (!isLocacao && !isVenda) return null

  let cleanLabel = label.replace(/^(L:|V:)\s*/i, '').trim()
  let min = 0
  let max = 999999999

  if (cleanLabel.toLowerCase().includes('até')) {
    const num = extractNumber(cleanLabel.replace(/até/i, ''))
    if (num !== null) max = num
  } else if (cleanLabel.toLowerCase().includes('acima') || cleanLabel.includes('+')) {
    const num = extractNumber(cleanLabel.replace(/acima de/i, '').replace('+', ''))
    if (num !== null) min = num
  } else if (cleanLabel.includes('-')) {
    const parts = cleanLabel.split('-')
    const num1 = extractNumber(parts[0] || '')
    const num2 = extractNumber(parts[1] || '')
    if (num1 !== null) min = num1
    if (num2 !== null) max = num2
  } else {
    const num = extractNumber(cleanLabel)
    if (num !== null) {
      min = num
      max = num
    }
  }

  return { isLocacao, isVenda, min, max }
}

export function useSupabaseProperties(
  filterType?: 'Venda' | 'Aluguel' | 'Ambos' | string,
  options?: { onlyMine?: boolean; pageSize?: number; statusFilter?: string },
) {
  const [properties, setProperties] = useState<SupabaseCapturedPropertyWithDemand[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [page, setPage] = useState(1)

  const { currentUser } = useAppStore()

  const formatProperty = useCallback((p: any) => {
    const d_loc = p.demanda_locacao
    const d_ven = p.demanda_venda
    const demanda = d_loc || d_ven

    const normalizedTipo = normalizeTipo(p.tipo, p.preco, p.valor)

    return {
      ...p,
      demanda,
      tipo: normalizedTipo,
    } as SupabaseCapturedPropertyWithDemand
  }, [])

  const fetchProperties = useCallback(
    async (resetPage = false) => {
      if (!currentUser) return
      try {
        setSyncing(true)
        const currentPage = resetPage ? 1 : page

        let query = supabase.from('imoveis_captados').select(
          `
        *,
        demanda_locacao:demandas_locacao(*),
        demanda_venda:demandas_vendas(*)
      `,
          { count: 'exact' },
        )

        // Role-based filtering to prevent loading unnecessary data
        if (currentUser.role === 'sdr') {
          query = query.in('tipo', ['Locação', 'Aluguel', 'Ambos'])
        } else if (currentUser.role === 'corretor' || currentUser.role === 'broker') {
          query = query.in('tipo', ['Venda', 'Ambos'])
        }

        // Server-side filtering to ensure consistency and performance
        const priceFilter = filterType ? parsePriceFilter(filterType) : null

        if (priceFilter) {
          if (priceFilter.isLocacao && currentUser.role !== 'corretor') {
            query = query.in('tipo', ['Locação', 'Aluguel', 'Ambos'])
          } else if (priceFilter.isVenda && currentUser.role !== 'sdr') {
            query = query.in('tipo', ['Venda', 'Ambos'])
          }

          // Match both 'valor' and 'preco' to prevent hidden items due to field mismatches
          if (priceFilter.min > 0 || priceFilter.max < 999999999) {
            query = query.or(
              `and(valor.gte.${priceFilter.min},valor.lte.${priceFilter.max}),and(preco.gte.${priceFilter.min},preco.lte.${priceFilter.max})`,
            )
          }
        } else if (filterType && filterType !== 'Ambos') {
          if (
            (filterType === 'Aluguel' || filterType === 'Locação') &&
            currentUser.role !== 'corretor'
          ) {
            query = query.in('tipo', ['Locação', 'Aluguel', 'Ambos'])
          } else if (filterType === 'Venda' && currentUser.role !== 'sdr') {
            query = query.in('tipo', ['Venda', 'Ambos'])
          } else if (
            filterType !== 'Aluguel' &&
            filterType !== 'Locação' &&
            filterType !== 'Venda'
          ) {
            // Text search fallback
            query = query.or(
              `endereco.ilike.%${filterType}%,codigo_imovel.ilike.%${filterType}%,localizacao_texto.ilike.%${filterType}%`,
            )
          }
        }

        if (options?.statusFilter) {
          query = query.eq('status_captacao', options.statusFilter)
        }

        // Captador ALWAYS sees only their properties, or if explicitly requested onlyMine
        if (options?.onlyMine || currentUser.role === 'captador') {
          query = query.eq('user_captador_id', currentUser.id)
        }

        const limit = options?.pageSize || 20
        const from = (currentPage - 1) * limit
        const to = from + limit - 1

        query = query.order('created_at', { ascending: false }).range(from, to)

        const { data, error, count } = await query

        if (error) throw error

        const formatted = (data || [])
          .map(formatProperty)
          .filter((p: any) => isImovelVisivelParaRole(p, currentUser.role))

        if (resetPage) {
          setProperties(formatted)
        } else {
          setProperties((prev) => [...prev, ...formatted])
        }

        setHasMore(count !== null && to < count - 1)
        if (!resetPage) setPage(currentPage + 1)
      } catch (error) {
        console.error('[useSupabaseProperties] error:', error)
        toast({
          title: 'Erro de Sincronização',
          description: 'Falha ao carregar imóveis',
          variant: 'destructive',
        })
      } finally {
        setLoading(false)
        setSyncing(false)
      }
    },
    [
      filterType,
      options?.onlyMine,
      options?.statusFilter,
      options?.pageSize,
      currentUser,
      page,
      formatProperty,
    ],
  )

  // State Reset requirement: When filter changes, clear properties and reset page
  useEffect(() => {
    setPage(1)
    setProperties([])
    setHasMore(false)
    fetchProperties(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterType, options?.onlyMine, options?.statusFilter])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchProperties(false)
    }
  }, [loading, hasMore, fetchProperties])

  const refresh = useCallback(() => {
    setPage(1)
    return fetchProperties(true)
  }, [fetchProperties])

  return { properties, loading, syncing, hasMore, loadMore, refresh }
}
