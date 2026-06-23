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
    // backwards compatibility
    localizacaoScore?: number
    valorScore?: number
    dormitoriosScore?: number
    vagasScore?: number
  }
}

export function normalizeTipologia(tipologia: string | undefined): string {
  if (!tipologia) return 'Apartamento'

  const normalized = tipologia.toLowerCase().trim()

  if (
    normalized === 'casa/sobrado' ||
    normalized === 'casa' ||
    normalized === 'sobrado' ||
    (normalized.includes('casa') && normalized.includes('sobrado'))
  ) {
    console.log('[MATCHING] Tipologia normalizada:', { original: tipologia, normalized: 'Casa' })
    return 'Casa'
  }

  if (
    normalized.includes('prédio') ||
    normalized.includes('predios') ||
    normalized.includes('comercial')
  ) {
    return 'Prédio Comercial'
  }

  if (normalized.includes('sala')) {
    return 'Sala Comercial'
  }

  if (normalized.includes('galpão') || normalized.includes('galpao')) {
    return 'Galpão'
  }

  return 'Apartamento'
}

export function validateTipologiaCompatibility(
  imovelTipologia: string | undefined,
  demandaTipologias: string[] | string | undefined,
): boolean {
  const imovelNormalizado = normalizeTipologia(imovelTipologia)

  let demandasNormalizadas: string[] = []

  if (typeof demandaTipologias === 'string') {
    demandasNormalizadas = [normalizeTipologia(demandaTipologias)]
  } else if (Array.isArray(demandaTipologias)) {
    demandasNormalizadas = demandaTipologias.map((t) => normalizeTipologia(t))
  } else {
    demandasNormalizadas = ['Apartamento']
  }

  const isCompativel = demandasNormalizadas.includes(imovelNormalizado)

  console.log('[MATCHING] Validação de Tipologia:', {
    imovelOriginal: imovelTipologia,
    imovelNormalizado,
    demandasOriginais: demandaTipologias,
    demandasNormalizadas,
    isCompativel,
  })

  return isCompativel
}

export function calculateMatching(
  imovel: ImovelForMatching,
  cliente: ClienteForMatching,
): MatchingResult {
  if (!imovel) {
    imovel = { endereco: '', preco: 0, dormitorios: 0, vagas: 0, tipo_imovel: 'Apartamento' }
  }
  if (!cliente) {
    cliente = {
      bairros: [],
      valor_minimo: 0,
      valor_maximo: 0,
      dormitorios: 0,
      vagas_estacionamento: 0,
      tipo_imovel: ['Apartamento'],
    }
  }

  const tipologiaCompativel = validateTipologiaCompatibility(
    imovel.tipo_imovel,
    cliente.tipo_imovel,
  )

  if (!tipologiaCompativel) {
    console.log('[MATCHING] Tipologias incompatíveis - Score 0%')
    return {
      score: 0,
      details: {
        location_match: false,
        price_match: false,
        rooms_match: false,
        parking_match: false,
        tipology_match: false,
        localizacaoScore: 0,
        valorScore: 0,
        dormitoriosScore: 0,
        vagasScore: 0,
      },
    }
  }

  let score = 100
  let location_match = true
  let price_match = true
  let rooms_match = true
  let parking_match = true

  // Location Penalty
  if (cliente.bairros && cliente.bairros.length > 0 && imovel.endereco) {
    const endereco = imovel.endereco.toLowerCase()
    const isBairroEncontrado = cliente.bairros.some((b) => endereco.includes(b.toLowerCase()))
    if (!isBairroEncontrado) {
      location_match = false
      score -= 25
    }
  } else if (cliente.bairros && cliente.bairros.length > 0 && !imovel.endereco) {
    location_match = false
    score -= 25
  }

  // Parking Penalty
  const vagasDemanda = cliente.vagas_estacionamento || 0
  const vagasImovel = imovel.vagas || 0
  if (vagasDemanda > 0 && vagasImovel < vagasDemanda) {
    parking_match = false
    score -= 15
  }

  // Rooms Penalty
  const quartosDemanda = cliente.dormitorios || 0
  const quartosImovel = imovel.dormitorios || 0
  if (quartosDemanda > 0 && quartosImovel < quartosDemanda) {
    rooms_match = false
    score -= 20
  }

  // Budget Penalty
  const imovelValor = imovel.preco || imovel.valor || 0
  if (imovelValor > 0) {
    if (cliente.valor_maximo && cliente.valor_maximo > 0 && imovelValor > cliente.valor_maximo) {
      price_match = false
      score -= 30
    } else if (
      cliente.valor_minimo &&
      cliente.valor_minimo > 0 &&
      imovelValor < cliente.valor_minimo
    ) {
      price_match = false
      score -= 10
    }
  }

  return {
    score: Math.max(0, score),
    details: {
      location_match,
      price_match,
      rooms_match,
      parking_match,
      tipology_match: true,
      localizacaoScore: location_match ? 25 : 0,
      valorScore: price_match ? 25 : 0,
      dormitoriosScore: rooms_match ? 25 : 0,
      vagasScore: parking_match ? 25 : 0,
    },
  }
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 80)
    return 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20'
  if (score >= 50) return 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20'
  if (score > 0)
    return 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border-orange-500/20'
  return 'bg-gray-500/10 text-gray-500 hover:bg-gray-500/20 border-gray-500/20'
}

export function getScoreProgressColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500'
  if (score >= 50) return 'bg-amber-500'
  if (score > 0) return 'bg-orange-500'
  return 'bg-gray-300'
}
