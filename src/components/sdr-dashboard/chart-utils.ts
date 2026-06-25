export interface ChartDataGroup {
  tipoData: { name: string; value: number; fill: string }[]
  bairrosData: { name: string; value: number; fill: string }[]
  dormsData: { name: string; value: number; fill: string }[]
  vagasData: { name: string; value: number; fill: string }[]
  dormsConfig: Record<string, any>
  vagasConfig: Record<string, any>
  tipoConfig: Record<string, any>
  bairrosConfig: Record<string, any>
}

const TIPO_COLORS = [
  '#3b82f6',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
]
const BAIRRO_COLORS = [
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#f43f5e',
  '#3b82f6',
  '#10b981',
]

function isCommercial(tipo: string) {
  const t = (tipo || '').toLowerCase()
  return (
    t.includes('comercial') ||
    t.includes('loja') ||
    t.includes('sala') ||
    t.includes('galpão') ||
    t.includes('galpao') ||
    t.includes('prédio') ||
    t.includes('predio') ||
    t.includes('lote') ||
    t.includes('terreno')
  )
}

export function processComparativeChartData(
  demandas: any[],
  imoveis: any[],
): { demandStats: ChartDataGroup; inventoryStats: ChartDataGroup } {
  const sharedState = {
    tipoColorMap: {
      Apartamento: '#3b82f6',
      Casa: '#10b981',
      Comercial: '#f59e0b',
      'Terreno/Lote': '#ef4444',
      Outros: '#94a3b8',
    } as Record<string, string>,
    tipoColorIdx: 4,
    bairroColorMap: {} as Record<string, string>,
    bairroColorIdx: 0,
  }

  const getTipoColor = (name: string) => {
    if (!sharedState.tipoColorMap[name]) {
      sharedState.tipoColorMap[name] = TIPO_COLORS[sharedState.tipoColorIdx % TIPO_COLORS.length]
      sharedState.tipoColorIdx++
    }
    return sharedState.tipoColorMap[name]
  }

  const getBairroColor = (name: string) => {
    if (!sharedState.bairroColorMap[name]) {
      sharedState.bairroColorMap[name] =
        BAIRRO_COLORS[sharedState.bairroColorIdx % BAIRRO_COLORS.length]
      sharedState.bairroColorIdx++
    }
    return sharedState.bairroColorMap[name]
  }

  const processItems = (
    items: any[],
    itemType: 'demanda' | 'imovel',
    labelStr: string,
  ): ChartDataGroup => {
    const tipoCount: Record<string, number> = {}
    const dormsCount: Record<string, number> = {}
    const vagasCount: Record<string, number> = {}
    const bairrosCount: Record<string, number> = {}

    items.forEach((item) => {
      // Tipologia
      let t = item.tipo_imovel || 'Outros'
      if (typeof t === 'string' && t.includes(',')) t = t.split(',')[0]
      t = t.trim()
      if (!t) t = 'Outros'

      const isComm = isCommercial(t)

      tipoCount[t] = (tipoCount[t] || 0) + 1

      // Dormitórios and Vagas
      const d = isComm ? 0 : (item.dormitorios ?? item.quartos ?? 0)
      const v = isComm ? 0 : (item.vagas ?? item.vagas_estacionamento ?? 0)

      const dStr = d >= 4 ? '4+' : String(d)
      const vStr = v >= 4 ? '4+' : String(v)

      dormsCount[dStr] = (dormsCount[dStr] || 0) + 1
      vagasCount[vStr] = (vagasCount[vStr] || 0) + 1

      // Bairros
      let bArray: string[] = []
      if (itemType === 'demanda') {
        if (Array.isArray(item.bairros) && item.bairros.length > 0) {
          bArray = item.bairros
        } else if (Array.isArray(item.localizacoes) && item.localizacoes.length > 0) {
          bArray = item.localizacoes
        } else if (typeof item.bairros === 'string') {
          try {
            bArray = JSON.parse(item.bairros)
            if (!Array.isArray(bArray)) bArray = [item.bairros]
          } catch {
            bArray = [item.bairros]
          }
        }
      } else {
        if (item.localizacao_texto) {
          bArray = [item.localizacao_texto]
        } else if (item.endereco) {
          const parts = item.endereco.split(',')
          if (parts.length > 1) {
            bArray = [parts[1].trim()]
          } else {
            bArray = [item.endereco]
          }
        }
      }

      bArray.forEach((b) => {
        if (!b) return
        const bClean = String(b).trim()
        if (bClean && bClean.toLowerCase() !== 'não informado') {
          bairrosCount[bClean] = (bairrosCount[bClean] || 0) + 1
        }
      })
    })

    const tipoData = Object.entries(tipoCount)
      .map(([name, value]) => ({ name, value, fill: getTipoColor(name) }))
      .sort((a, b) => b.value - a.value)

    const bairrosData = Object.entries(bairrosCount)
      .map(([name, value]) => ({ name, value, fill: getBairroColor(name) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)

    const dormsData = Object.entries(dormsCount)
      .map(([name, value]) => ({ name, value, fill: '#3b82f6' }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const vagasData = Object.entries(vagasCount)
      .map(([name, value]) => ({ name, value, fill: '#10b981' }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const tipoConfig: Record<string, any> = {}
    tipoData.forEach((d) => {
      tipoConfig[d.name] = { label: d.name, color: d.fill }
    })

    const bairrosConfig: Record<string, any> = {}
    bairrosData.forEach((d) => {
      bairrosConfig[d.name] = { label: d.name, color: d.fill }
    })

    const dormsConfig = {
      value: { label: 'Dormitórios', color: '#3b82f6' },
    }
    const vagasConfig = {
      value: { label: 'Vagas', color: '#10b981' },
    }

    return {
      tipoData,
      bairrosData,
      dormsData,
      vagasData,
      tipoConfig,
      bairrosConfig,
      dormsConfig,
      vagasConfig,
    }
  }

  return {
    demandStats: processItems(demandas, 'demanda', 'Demandas'),
    inventoryStats: processItems(imoveis, 'imovel', 'Imóveis'),
  }
}
