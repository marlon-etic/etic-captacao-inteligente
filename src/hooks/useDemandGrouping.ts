import { useMemo } from 'react'
import { Demand } from '@/types'
import { GroupedDemand } from '@/components/GroupedDemandCard'

interface GroupingOptions {
  demands: Demand[]
  filters: { type: string; status: string; timeframe: string; sort: string }
  quickFilter: string
}

export function useDemandGrouping({ demands, filters, quickFilter }: GroupingOptions) {
  return useMemo(() => {
    try {
      let filtered = demands

      const now = Date.now()

      if (quickFilter === 'awaiting') {
        filtered = filtered.filter((d) => d.status === 'Pendente')
      } else if (quickFilter === 'sla_24') {
        filtered = filtered.filter((d) => {
          if (d.status !== 'Pendente') return false
          const startMs =
            d.isExtension48h && d.extensionRequestedAt
              ? new Date(d.extensionRequestedAt).getTime()
              : new Date(d.createdAt).getTime()
          const totalSlaMs = d.isExtension48h ? 48 * 3600000 : 24 * 3600000
          const elapsedMs = now - startMs
          return elapsedMs < totalSlaMs
        })
      } else if (quickFilter === 'visits') {
        filtered = filtered.filter((d) => d.status === 'Visita')
      } else if (quickFilter === 'deals') {
        filtered = filtered.filter((d) => d.status === 'Negócio')
      }

      filtered = filtered
        .filter((d) => filters.type === 'all' || d.type === filters.type)
        .filter((d) => filters.status === 'all' || d.status === filters.status)
        .filter((d) => filters.timeframe === 'all' || d.timeframe === filters.timeframe)

      const newItems: Demand[] = []
      const candidatesForGrouping: Demand[] = []

      filtered.forEach((d) => {
        const createdMs = new Date(d.createdAt).getTime()
        const hoursAge = (now - createdMs) / 3600000
        if (hoursAge <= 24 && d.status === 'Pendente' && !d.isExtension48h) {
          newItems.push(d)
        } else {
          candidatesForGrouping.push(d)
        }
      })

      const getRemainingSlaMs = (d: Demand) => {
        if (d.status !== 'Pendente') return Infinity
        const startMs =
          d.isExtension48h && d.extensionRequestedAt
            ? new Date(d.extensionRequestedAt).getTime()
            : new Date(d.createdAt).getTime()
        const totalSlaMs = d.isExtension48h ? 48 * 3600000 : 24 * 3600000
        const elapsedMs = now - startMs
        return Math.max(0, totalSlaMs - elapsedMs)
      }

      if (filters.sort === 'urgency') {
        newItems.sort((a, b) => getRemainingSlaMs(a) - getRemainingSlaMs(b))
      } else if (filters.sort === 'time') {
        newItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      }

      const groups: GroupedDemand[] = []
      const ungrouped: Demand[] = []

      const activeForGrouping = candidatesForGrouping.filter(
        (d) => !['Perdida', 'Impossível', 'Sem demanda', 'Negócio', 'Arquivado'].includes(d.status),
      )
      const others = candidatesForGrouping.filter((d) =>
        ['Perdida', 'Impossível', 'Sem demanda', 'Negócio', 'Arquivado'].includes(d.status),
      )

      const potentialGroups = new Map<string, Demand[]>()
      activeForGrouping.forEach((d) => {
        const key = `${d.location}|${d.type}|${d.bedrooms || 0}|${d.parkingSpots || 0}`
        if (!potentialGroups.has(key)) potentialGroups.set(key, [])
        potentialGroups.get(key)!.push(d)
      })

      potentialGroups.forEach((groupDemands) => {
        if (groupDemands.length === 1) {
          ungrouped.push(groupDemands[0])
          return
        }

        const budgetGroups: Demand[][] = []
        groupDemands.forEach((d) => {
          const budget = d.maxBudget || d.budget || 0
          let placed = false
          for (const bg of budgetGroups) {
            const bgBudget = bg[0].maxBudget || bg[0].budget || 0
            const minAllowed = bgBudget * 0.9
            const maxAllowed = bgBudget * 1.1
            if (budget >= minAllowed && budget <= maxAllowed) {
              bg.push(d)
              placed = true
              break
            }
          }
          if (!placed) budgetGroups.push([d])
        })

        budgetGroups.forEach((bg) => {
          if (bg.length > 1) {
            groups.push({
              id: `group-${Math.random().toString(36).substr(2, 9)}`,
              location: bg[0].location,
              type: bg[0].type,
              bedrooms: bg[0].bedrooms || 0,
              bathrooms: bg[0].bathrooms || 0,
              parkingSpots: bg[0].parkingSpots || 0,
              minBudget: Math.min(...bg.map((d) => d.minBudget || d.budget || 0)),
              maxBudget: Math.max(...bg.map((d) => d.maxBudget || d.budget || 0)),
              demands: bg,
            })
          } else {
            ungrouped.push(bg[0])
          }
        })
      })

      groups.sort((a, b) => b.demands.length - a.demands.length)

      const finalUngrouped = [...ungrouped, ...others].sort((a, b) => {
        if (filters.sort === 'urgency') {
          return getRemainingSlaMs(a) - getRemainingSlaMs(b)
        }
        if (a.isPrioritized && !b.isPrioritized) return -1
        if (!a.isPrioritized && b.isPrioritized) return 1
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      })

      return {
        newDemands: newItems,
        groupedDemands: groups,
        oldDemands: finalUngrouped,
        error: false,
      }
    } catch (e) {
      return { newDemands: [], groupedDemands: [], oldDemands: demands, error: true }
    }
  }, [demands, filters, quickFilter])
}
