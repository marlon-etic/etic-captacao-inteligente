export interface ImovelForMatching {
  endereco?: string
  preco?: number
  dormitorios?: number
  vagas?: number
}

export interface ClienteForMatching {
  bairros?: string[]
  valor_minimo?: number
  valor_maximo?: number
  dormitorios?: number
  vagas_estacionamento?: number
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

export function calculateMatching(
  imovel: ImovelForMatching,
  cliente: ClienteForMatching,
): MatchingResult {
  if (!imovel) {
    imovel = { endereco: '', preco: 0, dormitorios: 0, vagas: 0 }
  }
  if (!cliente) {
    cliente = {
      bairros: [],
      valor_minimo: 0,
      valor_maximo: 0,
      dormitorios: 0,
      vagas_estacionamento: 0,
    }
  }

  let localizacaoScore = 0
  if (!cliente.bairros || cliente.bairros.length === 0) {
    localizacaoScore = 100
  } else if (imovel.endereco) {
    const imovelBairro = imovel.endereco.toLowerCase()
    const hasMatch = cliente.bairros.some(
      (b) =>
        b && (imovelBairro.includes(b.toLowerCase()) || b.toLowerCase().includes(imovelBairro)),
    )
    localizacaoScore = hasMatch ? 100 : 0
  } else {
    localizacaoScore = 0
  }

  console.log('[MATCHING] Localização:', {
    imovelBairro: imovel.endereco,
    clienteBairros: cliente.bairros,
    score: localizacaoScore,
  })

  let valorScore = 0
  const preco = imovel.preco || 0
  const minVal = cliente.valor_minimo || 0
  const maxVal = cliente.valor_maximo || 0

  if (minVal === 0 && maxVal === 0) {
    valorScore = 100
  } else if (preco > 0) {
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
        valorScore = Math.max(0, 100 - (diferenca / tolerancia) * 100)
      }
    }
  } else {
    valorScore = 0
  }

  console.log('[MATCHING] Valor:', {
    imovelPreco: preco,
    clienteMin: minVal,
    clienteMax: maxVal,
    score: valorScore,
  })

  let dormitoriosScore = 0
  const imovelDorms = imovel.dormitorios || 0
  const cliDorms = cliente.dormitorios || 0

  if (cliDorms === 0) {
    dormitoriosScore = 100
  } else if (imovelDorms >= cliDorms) {
    dormitoriosScore = 100
  } else if (imovelDorms > 0) {
    dormitoriosScore = Math.max(0, (imovelDorms / cliDorms) * 100)
  } else {
    dormitoriosScore = 0
  }

  console.log('[MATCHING] Dormitórios:', {
    imovelDorms,
    clienteDorms: cliDorms,
    score: dormitoriosScore,
  })

  let vagasScore = 0
  const imovelVagas = imovel.vagas || 0
  const cliVagas = cliente.vagas_estacionamento || 0

  if (cliVagas === 0) {
    vagasScore = 100
  } else if (imovelVagas >= cliVagas) {
    vagasScore = 100
  } else if (imovelVagas > 0) {
    vagasScore = Math.max(0, (imovelVagas / cliVagas) * 100)
  } else {
    vagasScore = 0
  }

  console.log('[MATCHING] Vagas:', {
    imovelVagas,
    clienteVagas: cliVagas,
    score: vagasScore,
  })

  const baseScore =
    localizacaoScore * 0.25 + valorScore * 0.25 + dormitoriosScore * 0.25 + vagasScore * 0.25

  const scoreFinal = Math.min(Math.max(Math.round(baseScore), 0), 100)

  console.log('[MATCHING] Score Final:', {
    localizacao: localizacaoScore,
    valor: valorScore,
    dormitorios: dormitoriosScore,
    vagas: vagasScore,
    scoreFinal,
  })

  return {
    score: scoreFinal,
    details: {
      localizacaoScore,
      valorScore,
      dormitoriosScore,
      vagasScore,
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
