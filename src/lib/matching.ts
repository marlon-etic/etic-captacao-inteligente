export interface ImovelForMatching {
  endereco?: string | string[]
  preco?: number | string
  dormitorios?: number | string
  vagas?: number | string
  tipo?: string
}

export interface ClienteForMatching {
  bairros?: string[]
  valor_minimo?: number | string
  valor_maximo?: number | string
  dormitorios?: number | string
  vagas_estacionamento?: number | string
  tipo?: string
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
    imovel = { endereco: '', preco: 0, dormitorios: 0, vagas: 0, tipo: 'Venda' }
  }
  if (!cliente) {
    cliente = {
      bairros: [],
      valor_minimo: 0,
      valor_maximo: 0,
      dormitorios: 0,
      vagas_estacionamento: 0,
      tipo: 'Locação',
    }
  }

  const normalizeTipo = (t?: string) => {
    if (!t) return ''
    const lower = t.toLowerCase()
    if (lower === 'aluguel' || lower === 'locacao' || lower === 'locação') return 'Locação'
    if (lower === 'venda') return 'Venda'
    if (lower === 'ambos') return 'Ambos'
    return 'Venda'
  }

  const imovelTipo = normalizeTipo(imovel.tipo) || 'Venda'
  const clienteTipo = normalizeTipo(cliente.tipo) || 'Locação'

  const tiposCompativeis = imovelTipo === 'Ambos' || imovelTipo === clienteTipo

  console.log('[MATCHING] Validação de Tipo:', {
    imovelTipoOriginal: imovel.tipo,
    clienteTipoOriginal: cliente.tipo,
    imovelTipo,
    clienteTipo,
    tiposCompativeis,
  })

  if (!tiposCompativeis) {
    return {
      score: 0,
      details: {
        localizacaoScore: 0,
        valorScore: 0,
        dormitoriosScore: 0,
        vagasScore: 0,
      },
    }
  }

  // --- CONVERSÃO SEGURA DE TIPOS ---
  const rawImovelDorms = imovel.dormitorios
  const rawCliDorms = cliente.dormitorios
  const rawImovelVagas = imovel.vagas
  const rawCliVagas = cliente.vagas_estacionamento
  const rawPreco = imovel.preco
  const rawMinVal = cliente.valor_minimo
  const rawMaxVal = cliente.valor_maximo
  const rawEndereco = imovel.endereco

  const imovelDorms = parseInt(String(rawImovelDorms || '0'), 10) || 0
  const cliDorms = parseInt(String(rawCliDorms || '0'), 10) || 0
  const imovelVagas = parseInt(String(rawImovelVagas || '0'), 10) || 0
  const cliVagas = parseInt(String(rawCliVagas || '0'), 10) || 0

  const preco = Number(rawPreco) || 0
  const minVal = Number(rawMinVal) || 0
  const maxVal = Number(rawMaxVal) || 0

  console.log('[MATCHING DEBUG] Tipos convertidos:', {
    dormitorios: { original: rawImovelDorms, convertido: imovelDorms, cliente: cliDorms },
    vagas: { original: rawImovelVagas, convertido: imovelVagas, cliente: cliVagas },
    preco: { original: rawPreco, convertido: preco, min: minVal, max: maxVal },
    endereco: { original: rawEndereco, isArray: Array.isArray(rawEndereco) },
  })

  // --- CRITÉRIO 1: LOCALIZAÇÃO (25%) ---
  let localizacaoScore = 0
  let imovelEnderecos: string[] = []

  if (Array.isArray(rawEndereco)) {
    imovelEnderecos = rawEndereco.map((e) => String(e).toLowerCase())
  } else if (rawEndereco) {
    imovelEnderecos = [String(rawEndereco).toLowerCase()]
  }

  if (!cliente.bairros || cliente.bairros.length === 0) {
    localizacaoScore = 100
  } else if (imovelEnderecos.length > 0) {
    const hasMatch = cliente.bairros.some((b) => {
      if (!b) return false
      const bLower = String(b).toLowerCase()
      return imovelEnderecos.some((end) => end.includes(bLower) || bLower.includes(end))
    })
    localizacaoScore = hasMatch ? 100 : 0
  } else {
    localizacaoScore = 0
  }

  console.log('[MATCHING] Localização:', {
    imovelEnderecos,
    clienteBairros: cliente.bairros,
    score: localizacaoScore,
  })

  // --- CRITÉRIO 2: VALOR (25%) ---
  let valorScore = 0

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

  // --- CRITÉRIO 3: DORMITÓRIOS (25%) ---
  let dormitoriosScore = 0

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

  // --- CRITÉRIO 4: VAGAS (25%) ---
  let vagasScore = 0

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

  // --- SCORE FINAL (SEM TIPO) ---
  const baseScore =
    localizacaoScore * 0.25 + valorScore * 0.25 + dormitoriosScore * 0.25 + vagasScore * 0.25

  const scoreFinal = Math.min(Math.max(Math.round(baseScore), 0), 100)

  console.log('[MATCHING] Score Final (SEM TIPO):', {
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
