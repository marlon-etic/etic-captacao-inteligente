// ✅ TIPOS DE FILTRO POR ROLE
export type UserRole = 'sdr' | 'corretor' | 'broker' | 'captador' | 'admin'

// ✅ NORMALIZAR TIPO DE IMÓVEL COM LÓGICA INTELIGENTE
export function normalizeTipo(tipo: string | null | undefined, preco?: number): string {
  if (!tipo) {
    // Se não tem tipo, usar preço como indicador
    if (preco && preco > 100000) return 'Venda'
    if (preco && preco > 0 && preco <= 100000) return 'Aluguel'
    return 'Ambos'
  }

  const normalized = tipo.toLowerCase().trim()

  // Normalizar variações de "Aluguel"
  if (normalized === 'aluguel' || normalized === 'locação' || normalized === 'locacao') {
    return 'Aluguel'
  }

  // Normalizar "Venda"
  if (normalized === 'venda') {
    return 'Venda'
  }

  // Normalizar "Ambos"
  if (normalized === 'ambos' || normalized === 'ambas') {
    return 'Ambos'
  }

  return 'Ambos'
}

// ✅ FUNÇÃO PARA OBTER TIPOS DE IMÓVEL VISÍVEIS PARA CADA ROLE
export function getTiposVisiveis(role: string | undefined): string[] {
  const roleNormalizado = (role || 'captador').toLowerCase().trim()

  console.log('[getTiposVisiveis] Role recebido:', role, '| Normalizado:', roleNormalizado)

  switch (roleNormalizado) {
    case 'sdr':
      // SDR vê apenas imóveis de ALUGUEL ou AMBOS
      console.log('[getTiposVisiveis] SDR → Tipos: ["Aluguel", "Ambos"]')
      return ['Aluguel', 'Ambos']

    case 'corretor':
    case 'broker':
      // Broker/Corretor vê apenas imóveis de VENDA ou AMBOS
      console.log('[getTiposVisiveis] Broker → Tipos: ["Venda", "Ambos"]')
      return ['Venda', 'Ambos']

    case 'captador':
      // Captador vê TUDO
      console.log('[getTiposVisiveis] Captador → Tipos: ["Venda", "Aluguel", "Ambos"]')
      return ['Venda', 'Aluguel', 'Ambos']

    case 'admin':
      // Admin vê TUDO
      console.log('[getTiposVisiveis] Admin → Tipos: ["Venda", "Aluguel", "Ambos"]')
      return ['Venda', 'Aluguel', 'Ambos']

    default:
      // Fallback seguro: Captador
      console.log('[getTiposVisiveis] Role desconhecido → Fallback para Captador')
      return ['Venda', 'Aluguel', 'Ambos']
  }
}

// ✅ FUNÇÃO PARA VALIDAR SE IMÓVEL É VISÍVEL PARA ROLE
export function isImovelVisivelParaRole(
  imovelTipo: string | null | undefined,
  role: string | undefined,
): boolean {
  const tipos = getTiposVisiveis(role)
  const normalizedTipo = normalizeTipo(imovelTipo)
  const isVisivel = tipos.includes(normalizedTipo)

  console.log(
    '[isImovelVisivelParaRole] Tipo:',
    imovelTipo,
    '| Normalizado:',
    normalizedTipo,
    '| Role:',
    role,
    '| Visível:',
    isVisivel,
  )

  return isVisivel
}

// ✅ LOGS DE DEBUG
export function logRoleFilter(role: string | undefined, tipos: string[]) {
  console.log('[ROLE FILTER] Role:', role, '| Tipos visíveis:', tipos)
}
