export interface ImovelForMatching {
  endereco?: string
  preco?: number
  dormitorios?: number
  vagas?: number
  tipo?: 'Venda' | 'Aluguel' | 'Ambos' | string
}

export interface ClienteForMatching {
  bairros?: string[]
  valor_minimo?: number
  valor_maximo?: number
  dormitorios?: number
  vagas_estacionamento?: number
  nivel_urgencia?: string
  tipo?: 'Venda' | 'Aluguel' | 'Ambos' | string
}

export interface MatchingResult {
  score: number
  details: {
    localizacaoScore: number
    valorScore: number
    dormitoriosScore: number
    vagasScore: number
    urgenciaMultiplier: number
  }
}

export function calculateMatching(
  imovel: ImovelForMatching,
  cliente: ClienteForMatching,
): MatchingResult {
  if (!imovel) imovel = {}
  if (!cliente) cliente = {}

  // Tratamento seguro para propriedades opcionais
  const imovelTipo = imovel.tipo || 'Ambos'
  const clienteTipo = cliente.tipo || 'Ambos'

  let localizacaoScore = 0
  if (!cliente.bairros || cliente.bairros.length === 0) {
    localizacaoScore = 100
  } else if (imovel.endereco) {
    const imovelBairro = imovel.endereco.toLowerCase()
    const hasMatch = cliente.bairros.some(
      (b) =>
        b && (imovelBairro.includes(b.toLowerCase()) || b.toLowerCase().includes(imovelBairro)),
    )
    if (hasMatch) localizacaoScore = 100
  }

  let valorScore = 0
  const preco = imovel.preco || 0
  const minVal = cliente.valor_minimo || 0
  const maxVal = cliente.valor_maximo || 0

  if (minVal === 0 && maxVal === 0) {
    valorScore = 100 // Indiferente
  } else if (preco > 0) {
    // Se o preço está dentro da faixa exata
    if ((minVal === 0 || preco >= minVal) && (maxVal === 0 || preco <= maxVal)) {
      valorScore = 100
    } else {
      let media = 0
      if (minVal > 0 && maxVal > 0) {
        media = (minVal + maxVal) / 2
      } else if (maxVal > 0) {
        media = maxVal
      } else if (minVal > 0) {
        media = minVal
      }

      // Tolerância de 20% da média
      const tolerancia = media > 0 ? media * 0.2 : 0

      let diferenca = 0
      if (minVal > 0 && preco < minVal) {
        diferenca = minVal - preco
      } else if (maxVal > 0 && preco > maxVal) {
        diferenca = preco - maxVal
      }

      if (diferenca >= tolerancia || tolerancia === 0) {
        valorScore = 0
      } else {
        valorScore = 100 - (diferenca / tolerancia) * 100
      }
    }
  } else {
    // Imóvel sem preço e cliente tem exigência de valor
    valorScore = 0
  }

  let dormitoriosScore = 0
  const imovelDorms = imovel.dormitorios || 0
  const cliDorms = cliente.dormitorios || 0
  if (cliDorms === 0) {
    dormitoriosScore = 100
  } else if (imovelDorms >= cliDorms) {
    dormitoriosScore = 100
  }

  let vagasScore = 0
  const imovelVagas = imovel.vagas || 0
  const cliVagas = cliente.vagas_estacionamento || 0
  if (cliVagas === 0) {
    vagasScore = 100
  } else if (imovelVagas >= cliVagas) {
    vagasScore = 100
  }

  let urgenciaMultiplier = 1.0
  const urg = (cliente.nivel_urgencia || '').toLowerCase()
  if (urg.includes('alta') || urg.includes('urgente')) {
    urgenciaMultiplier = 1.5
  } else if (urg.includes('baixa')) {
    urgenciaMultiplier = 0.5
  }

  // Pesos equalitários: 25% para cada um dos 4 critérios principais (Total 100%)
  const baseScore =
    localizacaoScore * 0.25 + valorScore * 0.25 + dormitoriosScore * 0.25 + vagasScore * 0.25

  // Removido o multiplicador de urgência do cálculo base para não distorcer a matemática do match
  const scoreFinal = Math.min(Math.round(baseScore), 100)

  return {
    score: scoreFinal,
    details: {
      localizacaoScore,
      valorScore,
      dormitoriosScore,
      vagasScore,
      urgenciaMultiplier,
    },
  }
}

export function getScoreBadgeColor(score: number): string {
  if (score >= 80) return 'bg-[#10B981] hover:bg-[#059669] text-white'
  if (score >= 60) return 'bg-[#F59E0B] hover:bg-[#D97706] text-white'
  if (score >= 40) return 'bg-[#EF4444] hover:bg-[#DC2626] text-white'
  return 'bg-[#94A3B8] hover:bg-[#64748B] text-white'
}

export function getScoreProgressColor(score: number): string {
  if (score >= 80) return 'bg-[#10B981]'
  if (score >= 60) return 'bg-[#F59E0B]'
  if (score >= 40) return 'bg-[#EF4444]'
  return 'bg-[#94A3B8]'
}
