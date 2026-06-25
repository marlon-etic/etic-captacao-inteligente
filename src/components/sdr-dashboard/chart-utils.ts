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
      if (isComm) {
        if (t.toLowerCase().includes('lote') || t.toLowerCase().includes('terreno')) {
          t = 'Terreno/Lote'
        } else {
          t = 'Comercial'
        }
      } else {
        if (t.toLowerCase() === 'apto' || t.toLowerCase().includes('apartamento')) {
          t = 'Apartamento'
        } else if (t.toLowerCase().includes('casa')) {
          t = 'Casa'
        } else {
          t = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()
        }
      }

      tipoCount[t] = (tipoCount[t] || 0) + 1

      // Dormitórios
      let dNum =
        typeof item.dormitorios === 'number' ? item.dormitorios : parseInt(item.dormitorios) || 0
      if (isCommercial(t) || t === 'Terreno/Lote' || item.dormitorios == null) {
        dNum = 0
      }
      const labelDorm = dNum >= 4 ? '4+' : `${dNum}`
      dormsCount[labelDorm] = (dormsCount[labelDorm] || 0) + 1

      // Vagas
      const vField = itemType === 'demanda' ? item.vagas_estacionamento : item.vagas
      let vNum = typeof vField === 'number' ? vField : parseInt(vField) || 0
      if (isCommercial(t) || t === 'Terreno/Lote' || vField == null) {
        vNum = 0
      }
      const labelVaga = vNum >= 3 ? '3+' : `${vNum}`
      vagasCount[labelVaga] = (vagasCount[labelVaga] || 0) + 1

      // Bairros
      const extractBairro = (bStr: string) => {
        let b = bStr
        if (b.includes(',')) b = b.split(',')[0]
        if (b.includes('-')) b = b.split('-')[0]
        b = b.trim()
        if (b.length > 25) b = b.substring(0, 25) + '...'
        if (
          b &&
          b.toLowerCase() !== 'não informado' &&
          b.toLowerCase() !== 'nao informado' &&
          b.toLowerCase() !== 'indiferente'
        ) {
          bairrosCount[b] = (bairrosCount[b] || 0) + 1
        }
      }

      if (itemType === 'demanda') {
        const bArray = Array.isArray(item.bairros) ? item.bairros : []
        if (bArray.length > 0) {
          bArray.forEach((b) => extractBairro(typeof b === 'string' ? b : String(b)))
        } else if (item.localizacoes && Array.isArray(item.localizacoes)) {
          item.localizacoes.forEach((b: any) =>
            extractBairro(typeof b === 'string' ? b : String(b)),
          )
        }
      } else {
        const bStr = item.localizacao_texto || item.endereco || ''
        if (bStr) extractBairro(bStr)
      }
    })

    const formatDonut = (
      countMap: Record<string, number>,
      colors: string[],
      suffix1: string,
      suffix2: string,
    ) => {
      const data = Object.keys(countMap)
        .map((k) => {
          let numKey = parseInt(k)
          let idx = isNaN(numKey) ? 0 : numKey
          if (idx >= colors.length) idx = colors.length - 1

          return {
            name: k === '0' ? 'Não inf./Comercial' : k + (k.includes('+') ? suffix2 : suffix1),
            value: countMap[k],
            fill: colors[idx],
            sortKey: k === '0' ? -1 : idx,
          }
        })
        .sort((a, b) => a.sortKey - b.sortKey)

      const config: Record<string, any> = { value: { label: labelStr } }
      data.forEach((d) => {
        config[d.name] = { label: d.name, color: d.fill }
      })
      return { data, config }
    }

    const dormsFormat = formatDonut(
      dormsCount,
      ['#94a3b8', '#3b82f6', '#60a5fa', '#93c5fd', '#1d4ed8'],
      ' Quarto(s)',
      ' Quartos',
    )
    const vagasFormat = formatDonut(
      vagasCount,
      ['#94a3b8', '#10b981', '#34d399', '#047857'],
      ' Vaga(s)',
      ' Vagas',
    )

    const formatBar = (countMap: Record<string, number>, colorGetter: (name: string) => string) =>
      Object.keys(countMap)
        .map((k) => ({ name: k, value: countMap[k], fill: colorGetter(k) }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)

    const tData = formatBar(tipoCount, getTipoColor)
    const bData = formatBar(bairrosCount, getBairroColor)

    const tConfig: Record<string, any> = { value: { label: labelStr } }
    tData.forEach((d) => {
      tConfig[d.name] = { label: d.name, color: d.fill }
    })

    const bConfig: Record<string, any> = { value: { label: labelStr } }
    bData.forEach((d) => {
      bConfig[d.name] = { label: d.name, color: d.fill }
    })

    return {
      tipoData: tData,
      bairrosData: bData,
      dormsData: dormsFormat.data,
      vagasData: vagasFormat.data,
      dormsConfig: dormsFormat.config,
      vagasConfig: vagasFormat.config,
      tipoConfig: tConfig,
      bairrosConfig: bConfig,
    }
  }

  const demandStats = processItems(demandas, 'demanda', 'Demandas')
  const inventoryStats = processItems(imoveis, 'imovel', 'Imóveis')

  return { demandStats, inventoryStats }
}
