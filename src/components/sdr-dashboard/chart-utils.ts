export interface ChartDataGroup {
  tipoData: { name: string; value: number }[]
  bairrosData: { name: string; value: number }[]
  dormsData: { name: string; value: number; fill: string }[]
  vagasData: { name: string; value: number; fill: string }[]
  dormsConfig: Record<string, any>
  vagasConfig: Record<string, any>
}

export function processChartData(
  items: any[],
  itemType: 'demanda' | 'imovel',
  labelStr: string,
): ChartDataGroup {
  const tipoCount: Record<string, number> = {}
  const dormsCount: Record<string, number> = {}
  const vagasCount: Record<string, number> = {}
  const bairrosCount: Record<string, number> = {}

  items.forEach((item) => {
    // Tipologia
    let t = item.tipo_imovel || 'Outros'
    if (typeof t === 'string' && t.includes(',')) t = t.split(',')[0]
    t = t.trim()
    if (t) tipoCount[t] = (tipoCount[t] || 0) + 1

    // Dormitórios
    const dNum =
      typeof item.dormitorios === 'number' ? item.dormitorios : parseInt(item.dormitorios) || 0
    const labelDorm = dNum >= 4 ? '4+' : `${dNum}`
    dormsCount[labelDorm] = (dormsCount[labelDorm] || 0) + 1

    // Vagas
    const vField = itemType === 'demanda' ? item.vagas_estacionamento : item.vagas
    const vNum = typeof vField === 'number' ? vField : parseInt(vField) || 0
    const labelVaga = vNum >= 3 ? '3+' : `${vNum}`
    vagasCount[labelVaga] = (vagasCount[labelVaga] || 0) + 1

    // Bairros
    const extractBairro = (bStr: string) => {
      let b = bStr
      if (b.includes(',')) b = b.split(',')[0]
      if (b.includes('-')) b = b.split('-')[0]
      b = b.trim()
      if (b.length > 25) b = b.substring(0, 25) + '...'
      if (b && b.toLowerCase() !== 'não informado') {
        bairrosCount[b] = (bairrosCount[b] || 0) + 1
      }
    }

    if (itemType === 'demanda') {
      const bArray = Array.isArray(item.bairros) ? item.bairros : []
      bArray.forEach(extractBairro)
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
      .map((k, idx) => ({
        name: k === '0' ? 'Não inf.' : k + (k.includes('+') ? suffix2 : suffix1),
        value: countMap[k],
        fill: colors[idx % colors.length],
      }))
      .sort((a, b) => a.name.localeCompare(b.name))

    const config: Record<string, any> = { value: { label: labelStr } }
    data.forEach((d) => {
      config[d.name] = { label: d.name, color: d.fill }
    })
    return { data, config }
  }

  const dormsFormat = formatDonut(
    dormsCount,
    ['#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#1d4ed8'],
    ' Quarto(s)',
    ' Quartos',
  )
  const vagasFormat = formatDonut(
    vagasCount,
    ['#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#047857'],
    ' Vaga(s)',
    ' Vagas',
  )

  const formatBar = (countMap: Record<string, number>) =>
    Object.keys(countMap)
      .map((k) => ({ name: k, value: countMap[k] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

  return {
    tipoData: formatBar(tipoCount),
    bairrosData: formatBar(bairrosCount),
    dormsData: dormsFormat.data,
    vagasData: vagasFormat.data,
    dormsConfig: dormsFormat.config,
    vagasConfig: vagasFormat.config,
  }
}
