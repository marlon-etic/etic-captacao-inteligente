export interface ImovelForMatching {
  id?: string
  endereco?: string
  preco?: number
  valor?: number
  dormitorios?: number
  vagas?: number
  tipo_imovel?: string
  bairros?: string[]
}

export interface ClienteForMatching {
  id?: string
  bairros?: string[]
  valor_minimo?: number
  valor_maximo?: number
  dormitorios?: number
  vagas_estacionamento?: number
  tipo_imovel?: string | string[]
}

export interface MatchingResult {
  score: number
  details: {
    location_match: boolean
    price_match: boolean
    rooms_match: boolean
    parking_match: boolean
    tipology_match: boolean
    localizacaoScore?: number
    valorScore?: number
    dormitoriosScore?: number
    vagasScore?: number
  }
}

export function normalizeTipologia(tipologia: string | undefined): string {
  if (!tipologia) return ''
  return tipologia.toLowerCase().trim()
}

export function validateTipologiaCompatibility(
  imovelTipologia: string | undefined,
  demandaTipologias: string[] | string | undefined,
): boolean {
  if (!imovelTipologia || !demandaTipologias) return true
  const iTipo = normalizeTipologia(imovelTipologia)
  const dTipos = Array.isArray(demandaTipologias)
    ? demandaTipologias.map(normalizeTipologia)
    : [normalizeTipologia(demandaTipologias)]

  if (dTipos.length === 0 || dTipos[0] === '') return true
  return dTipos.includes(iTipo)
}

export function calculateMatching(
  imovel: ImovelForMatching,
  cliente: ClienteForMatching,
): MatchingResult {
  let score = 100
  const details = {
    location_match: true,
    price_match: true,
    rooms_match: true,
    parking_match: true,
    tipology_match: true,
    localizacaoScore: 100,
    valorScore: 100,
    dormitoriosScore: 100,
    vagasScore: 100,
  }

  // Bairro Penalty (-25%)
  const imovelBairrosStr = (imovel.bairros?.join(', ') || imovel.endereco || '').toLowerCase()
  let hasBairroMatch = false
  if (cliente.bairros && cliente.bairros.length > 0) {
    hasBairroMatch = cliente.bairros.some((b) => imovelBairrosStr.includes(b.toLowerCase()))
    if (!hasBairroMatch) {
      score -= 25
      details.location_match = false
      details.localizacaoScore = 75
    }
  }

  // Vagas Penalty (-15%)
  const imovelVagas = imovel.vagas || 0
  const clienteVagas = cliente.vagas_estacionamento || 0
  if (clienteVagas > 0 && imovelVagas < clienteVagas) {
    score -= 15
    details.parking_match = false
    details.vagasScore = 85
  }

  // Preço Penalty (up to -30%)
  const preco = imovel.preco || imovel.valor || 0
  if (preco > 0 && cliente.valor_maximo && cliente.valor_maximo > 0) {
    if (preco > cliente.valor_maximo * 1.2) {
      score -= 30
      details.price_match = false
      details.valorScore = 70
    } else if (preco > cliente.valor_maximo) {
      score -= 20
      details.price_match = false
      details.valorScore = 80
    }
  }

  // Dormitorios penalty (-15%)
  const imovelDorms = imovel.dormitorios || 0
  const clienteDorms = cliente.dormitorios || 0
  if (clienteDorms > 0 && imovelDorms < clienteDorms) {
    score -= 15
    details.rooms_match = false
    details.dormitoriosScore = 85
  }

  // Tipology match (-10%)
  if (!validateTipologiaCompatibility(imovel.tipo_imovel, cliente.tipo_imovel)) {
    score -= 10
    details.tipology_match = false
  }

  score = Math.max(0, Math.min(100, score))

  return { score, details }
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500 text-white hover:bg-emerald-600'
  if (score >= 75) return 'bg-blue-500 text-white hover:bg-blue-600'
  if (score >= 60) return 'bg-amber-500 text-white hover:bg-amber-600'
  return 'bg-red-500 text-white hover:bg-red-600'
}

export function getScoreProgressColor(score: number): string {
  if (score >= 90) return 'bg-emerald-500'
  if (score >= 75) return 'bg-blue-500'
  if (score >= 60) return 'bg-amber-500'
  return 'bg-red-500'
}
