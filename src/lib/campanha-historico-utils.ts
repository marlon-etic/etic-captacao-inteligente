import type { CampanhaFechada, CampanhaImovelDetalhe } from '@/services/campanhaHistoricoService'

export const TIPO_LABELS: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  galpao: 'Galpão',
  comercial: 'Comercial',
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function calcDuracaoDias(inicio: string, fim: string): number {
  try {
    return Math.max(
      0,
      Math.round((new Date(fim).getTime() - new Date(inicio).getTime()) / 86400000),
    )
  } catch {
    return 0
  }
}

export interface KpiData {
  totalCampanhas: number
  totalImoveis: number
  avgTempoDias: number
  topCaptador: { nome: string; capturas: number } | null
}

export function computeKpis(
  campanhas: CampanhaFechada[],
  imoveis: CampanhaImovelDetalhe[],
): KpiData {
  const totalCampanhas = campanhas.length
  const totalImoveis = imoveis.length
  const avgTempoDias =
    totalCampanhas > 0
      ? campanhas.reduce(
          (sum, c) => sum + calcDuracaoDias(c.data_inicio, c.data_fechamento_real || c.data_fim),
          0,
        ) / totalCampanhas
      : 0

  const captadorCapturas = new Map<string, { nome: string; count: number }>()
  for (const imv of imoveis) {
    if (!imv.captador_id || !imv.captador?.nome) continue
    const existing = captadorCapturas.get(imv.captador_id)
    if (existing) existing.count++
    else captadorCapturas.set(imv.captador_id, { nome: imv.captador.nome, count: 1 })
  }

  let topCaptador: { nome: string; capturas: number } | null = null
  for (const [, data] of captadorCapturas) {
    if (!topCaptador || data.count > topCaptador.capturas) {
      topCaptador = { nome: data.nome, capturas: data.count }
    }
  }

  return { totalCampanhas, totalImoveis, avgTempoDias, topCaptador }
}

export interface TopCaptadorData {
  captadorId: string
  nome: string
  totalCapturas: number
  campanhasParticipadas: number
  successRate: number
}

export function computeTopCaptadores(
  campanhas: CampanhaFechada[],
  imoveis: CampanhaImovelDetalhe[],
): TopCaptadorData[] {
  const captadorMap = new Map<string, { nome: string; capturas: number; campanhas: Set<string> }>()
  for (const imv of imoveis) {
    if (!imv.captador_id) continue
    const nome = imv.captador?.nome || 'N/D'
    const existing = captadorMap.get(imv.captador_id)
    if (existing) {
      existing.capturas++
      existing.campanhas.add(imv.campanha_id)
    } else {
      captadorMap.set(imv.captador_id, { nome, capturas: 1, campanhas: new Set([imv.campanha_id]) })
    }
  }

  const metaByCampanha = new Map(campanhas.map((c) => [c.id, c.meta]))
  const result: TopCaptadorData[] = []
  for (const [captadorId, data] of captadorMap) {
    let totalMeta = 0
    for (const campanhaId of data.campanhas) totalMeta += metaByCampanha.get(campanhaId) || 0
    const successRate = totalMeta > 0 ? Math.min(100, (data.capturas / totalMeta) * 100) : 0
    result.push({
      captadorId,
      nome: data.nome,
      totalCapturas: data.capturas,
      campanhasParticipadas: data.campanhas.size,
      successRate,
    })
  }

  return result.sort((a, b) => b.totalCapturas - a.totalCapturas)
}

export function computeChartData(
  campanhas: CampanhaFechada[],
  imoveis: CampanhaImovelDetalhe[],
): { name: string; value: number }[] {
  const tipoMap = new Map(campanhas.map((c) => [c.id, TIPO_LABELS[c.tipo_imovel] || c.tipo_imovel]))
  const counts = new Map<string, number>()
  for (const imv of imoveis) {
    const tipo = tipoMap.get(imv.campanha_id)
    if (!tipo) continue
    counts.set(tipo, (counts.get(tipo) || 0) + 1)
  }
  return Array.from(counts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}
