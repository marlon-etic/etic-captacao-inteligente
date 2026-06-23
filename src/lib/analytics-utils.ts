import { Demand } from '@/types'

export type EnhancedDemand = Demand & { tipologia: string; faixaValor: string }

export type AnalyticsFiltersState = {
  period: 'week' | 'month' | 'custom'
  startDate?: Date
  endDate?: Date
  type: 'Venda' | 'Aluguel' | 'Ambos'
}

export function getRentBracket(val: number) {
  if (val <= 2000) return 'Até R$ 2.000,00'
  if (val <= 3000) return 'R$ 2.000,00 a R$ 3.000,00'
  if (val <= 5000) return 'R$ 3.000,00 a R$ 5.000,00'
  if (val <= 8000) return 'R$ 5.000,00 a R$ 8.000,00'
  return 'Acima de R$ 8.000,00'
}

export function getSaleBracket(val: number) {
  if (val <= 300000) return 'Até R$300k'
  if (val <= 500000) return 'R$300k-R$500k'
  if (val <= 700000) return 'R$500k-R$700k'
  if (val <= 1000000) return 'R$700k-R$1M'
  return 'R$1M+'
}

export function getDemandTypology(d: Demand): string {
  const desc = d.description?.toLowerCase() || ''
  if (desc.includes('casa')) return 'Casa'
  if (desc.includes('sobrado')) return 'Sobrado'
  if (desc.includes('galpão') || desc.includes('galpao')) return 'Galpão'
  if (desc.includes('terreno')) return 'Terreno'
  if (desc.includes('comercial') || desc.includes('sala')) return 'Comercial'
  return 'Apartamento'
}

export function enhanceDemands(demands: Demand[]): EnhancedDemand[] {
  return demands.map((d) => {
    const val = d.maxBudget || d.budget || 0
    const typeNorm = d.type?.toLowerCase() || ''
    const isRent = typeNorm === 'aluguel' || typeNorm === 'locação' || typeNorm === 'locacao'
    const faixaValor = isRent ? getRentBracket(val) : getSaleBracket(val)
    const tipologia = getDemandTypology(d)
    return { ...d, tipologia, faixaValor }
  })
}
