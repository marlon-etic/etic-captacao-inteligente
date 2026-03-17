import { useMemo } from 'react'
import { Demand } from '@/types'
import { GroupedDemand } from '@/components/GroupedDemandCard'
import useAppStore from '@/stores/useAppStore'

interface GroupingOptions {
  demands: Demand[]
  filters?: {
    type?: string
    status?: string
    timeframe?: string
    period?: string
  }
}

export function useDemandGrouping({ demands, filters }: GroupingOptions) {
  const { logSystemEvent } = useAppStore()

  return useMemo(() => {
    try {
      let filtered = demands

      if (filters) {
        if (filters.status && filters.status !== 'all' && filters.status !== 'todas') {
          if (filters.status === 'open') {
            filtered = filtered.filter((d) => d.status !== 'Perdida' && !d.isPrioritized)
          } else if (filters.status === 'prioritized' || filters.status === 'priorizadas') {
            filtered = filtered.filter((d) => d.isPrioritized && d.status !== 'Perdida')
          } else if (filters.status === 'lost') {
            filtered = filtered.filter((d) => d.status === 'Perdida')
          } else if (filters.status === 'novas') {
            const now = Date.now()
            filtered = filtered.filter(
              (d) =>
                (now - new Date(d.createdAt).getTime()) / 3600000 <= 24 &&
                d.status === 'Pendente' &&
                !d.isExtension48h,
            )
          } else {
            filtered = filtered.filter((d) => d.status === filters.status)
          }
        }

        if (filters.type && filters.type !== 'all' && filters.type !== 'todas') {
          filtered = filtered.filter((d) => d.type?.toLowerCase() === filters.type?.toLowerCase())
        }

        const period = filters.period || filters.timeframe
        if (period && period !== 'all' && period !== 'todas') {
          const now = Date.now()
          if (period === '7days' || period === '7d') {
            filtered = filtered.filter(
              (d) => (now - new Date(d.createdAt).getTime()) / 86400000 <= 7,
            )
          } else if (period === '30days' || period === '30d') {
            filtered = filtered.filter(
              (d) => (now - new Date(d.createdAt).getTime()) / 86400000 <= 30,
            )
          } else if (period === '24h') {
            filtered = filtered.filter(
              (d) => (now - new Date(d.createdAt).getTime()) / 3600000 <= 24,
            )
          }
        }
      }

      const activeForGrouping = filtered.filter(
        (d) =>
          !['Perdida', 'Impossível', 'Sem demanda', 'Negócio', 'Arquivado'].includes(d.status) &&
          !d.isPrioritized,
      )

      const others = filtered.filter(
        (d) =>
          ['Perdida', 'Impossível', 'Sem demanda', 'Negócio', 'Arquivado'].includes(d.status) ||
          d.isPrioritized,
      )

      // Use the actual grupo_id defined by the store's Unification Logic
      const potentialGroups = new Map<string, Demand[]>()
      activeForGrouping.forEach((d) => {
        const key = d.grupo_id || `legacy-${d.id}`
        if (!potentialGroups.has(key)) potentialGroups.set(key, [])
        potentialGroups.get(key)!.push(d)
      })

      const groups: GroupedDemand[] = []
      const ungrouped: Demand[] = []

      potentialGroups.forEach((groupDemands, key) => {
        if (groupDemands.length === 1) {
          ungrouped.push(groupDemands[0])
          return
        }

        const minB = Math.min(...groupDemands.map((d) => d.minBudget || d.budget || 0))
        const maxB = Math.max(...groupDemands.map((d) => d.maxBudget || d.budget || 0))

        groups.push({
          id: key,
          location: groupDemands[0].location,
          type: groupDemands[0].type,
          bedrooms: groupDemands[0].bedrooms || 0,
          bathrooms: groupDemands[0].bathrooms || 0,
          parkingSpots: groupDemands[0].parkingSpots || 0,
          minBudget: minB,
          maxBudget: maxB,
          demands: groupDemands,
          oldestDate: Math.min(...groupDemands.map((d) => new Date(d.createdAt).getTime())),
          tier: groupDemands.length >= 7 ? 1 : groupDemands.length >= 4 ? 2 : 3,
        })
      })

      // Primary Sort: Number of active clients (descending), Secondary Sort: Oldest created demand
      groups.sort((a, b) => {
        if (b.demands.length !== a.demands.length) return b.demands.length - a.demands.length
        return a.oldestDate - b.oldestDate
      })

      const finalUngrouped = [...ungrouped, ...others].sort((a, b) => {
        if (a.isPrioritized && !b.isPrioritized) return -1
        if (!a.isPrioritized && b.isPrioritized) return 1
        if (a.status === 'Perdida' && b.status !== 'Perdida') return 1
        if (a.status !== 'Perdida' && b.status === 'Perdida') return -1
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      })

      return {
        groupedDemands: groups,
        ungroupedDemands: finalUngrouped,
      }
    } catch (e) {
      logSystemEvent?.(
        `Erro fatal no agrupamento: ${(e as Error).message}`,
        'error',
        'useDemandGrouping',
      )
      return { groupedDemands: [], ungroupedDemands: demands }
    }
  }, [demands, filters, logSystemEvent])
}
