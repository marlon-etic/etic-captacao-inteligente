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
    localizacaoScore: number
    valorScore: number
    dormitoriosScore: number
    vagasScore: number
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
      details: { localizacaoScore: 0, valorScore: 0, dormitoriosScore: 0, vagasScore: 0 },
    }
  }

  let score = 100

  const imovelValor = imovel.preco || imovel.valor || 0
  if (imovelValor > 0 && cliente.valor_maximo && imovelValor > cliente.valor_maximo) {
    score -= 30
  }
  if (imovelValor > 0 && cliente.valor_minimo && imovelValor < cliente.valor_minimo) {
    score -= 10
  }

  if (
    cliente.dormitorios &&
    imovel.dormitorios !== undefined &&
    imovel.dormitorios < cliente.dormitorios
  ) {
    score -= 20
  }

  return {
    score: Math.max(0, score),
    details: {
      localizacaoScore: 25,
      valorScore: 25,
      dormitoriosScore: 25,
      vagasScore: 25,
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
