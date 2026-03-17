import { Demand } from '@/types'

export type EnhancedDemand = Demand & { tipologia: string; faixaValor: string }

export type AnalyticsFiltersState = {
  period: 'week' | 'month' | 'custom'
  startDate?: Date
  endDate?: Date
  type: 'Venda' | 'Aluguel' | 'Ambos'
}

export function getRentBracket(val: number) {
  if (val <= 2000) return 'Até R$2.000'
  if (val <= 3000) return 'R$2.000-R$3.000'
  if (val <= 4000) return 'R$3.000-R$4.000'
  if (val <= 5000) return 'R$4.000-R$5.000'
  return 'R$5.000+'
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
    const faixaValor = d.type === 'Aluguel' ? getRentBracket(val) : getSaleBracket(val)
    const tipologia = getDemandTypology(d)
    return { ...d, tipologia, faixaValor }
  })
}

export function generateAnalyticsMockDemands(baseId: string): Demand[] {
  const bairros = [
    'Mooca',
    'Tatuapé',
    'Pinheiros',
    'Jardins',
    'Vila Mariana',
    'Itaim Bibi',
    'Centro',
    'Lapa',
    'Santana',
    'Saúde',
  ]
  const descs = [
    'Procuro apartamento 2 quartos',
    'Casa com quintal',
    'Galpão espaçoso',
    'Terreno para construir',
    'Sobrado reformado',
    'Sala comercial',
  ]
  const statuses = [
    'Pendente',
    'Pendente',
    'Captado sob demanda',
    'Visita',
    'Negócio',
    'Perdida',
    'Perdida',
  ]
  const res: Demand[] = []
  const now = Date.now()

  for (let i = 0; i < 200; i++) {
    const isVenda = i % 3 !== 0
    const val = isVenda ? 200000 + Math.random() * 1200000 : 1000 + Math.random() * 5000
    res.push({
      id: `mock-an-${baseId}-${i}`,
      clientName: `Cliente Analítico ${i}`,
      location: bairros[i % bairros.length],
      minBudget: val * 0.8,
      maxBudget: val,
      budget: val,
      bedrooms: (i % 4) + 1,
      parkingSpots: i % 3,
      type: isVenda ? 'Venda' : 'Aluguel',
      status: statuses[i % statuses.length] as any,
      createdBy: '1',
      createdAt: new Date(now - Math.random() * 45 * 86400000).toISOString(),
      description: descs[i % descs.length],
      timeframe: '30 dias',
    })
  }
  return res
}
