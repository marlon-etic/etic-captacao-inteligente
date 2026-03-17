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

      const potentialGroups = new Map<string, Demand[]>()
      activeForGrouping.forEach((d) => {
        // Grouping logic based on identical: Location, Typology (type), Bedrooms, and Parking Spots
        const key = `${d.location}|${d.type}|${d.bedrooms || 0}|${d.parkingSpots || 0}`
        if (!potentialGroups.has(key)) potentialGroups.set(key, [])
        potentialGroups.get(key)!.push(d)
      })

      const groups: GroupedDemand[] = []
      const ungrouped: Demand[] = []

      potentialGroups.forEach((groupDemands) => {
        if (groupDemands.length === 1) {
          ungrouped.push(groupDemands[0])
          return
        }

        const budgetGroups: Demand[][] = []
        groupDemands.forEach((d) => {
          let placed = false
          try {
            const dMin = d.minBudget || d.budget || 0
            const dMax = d.maxBudget || d.budget || 0

            for (const bg of budgetGroups) {
              const bgMin = Math.min(...bg.map((x) => x.minBudget || x.budget || 0))
              const bgMax = Math.max(...bg.map((x) => x.maxBudget || x.budget || 0))

              // Value overlap condition (±10%) strictly applied
              if (dMax >= bgMin * 0.9 && dMin <= bgMax * 1.1) {
                bg.push(d)
                placed = true
                break
              }
            }
          } catch (e) {
            logSystemEvent?.(
              `Erro no cálculo de overlap de valor: ${(e as Error).message}`,
              'error',
              `Demanda ${d.id}`,
            )
          }

          if (!placed) budgetGroups.push([d])
        })

        budgetGroups.forEach((bg) => {
          if (bg.length > 1) {
            groups.push({
              id: `group-${bg[0].id}-${Math.random().toString(36).substr(2, 5)}`,
              location: bg[0].location,
              type: bg[0].type,
              bedrooms: bg[0].bedrooms || 0,
              bathrooms: bg[0].bathrooms || 0,
              parkingSpots: bg[0].parkingSpots || 0,
              minBudget: Math.min(...bg.map((d) => d.minBudget || d.budget || 0)),
              maxBudget: Math.max(...bg.map((d) => d.maxBudget || d.budget || 0)),
              demands: bg,
              oldestDate: Math.min(...bg.map((d) => new Date(d.createdAt).getTime())),
              tier: bg.length >= 7 ? 1 : bg.length >= 4 ? 2 : 3,
            })
          } else {
            ungrouped.push(bg[0])
          }
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
