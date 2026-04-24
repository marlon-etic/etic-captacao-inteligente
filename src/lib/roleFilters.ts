// ✅ TIPOS DE FILTRO POR ROLE
export type UserRole = 'sdr' | 'corretor' | 'broker' | 'captador' | 'admin' | 'gestor'

// ✅ NORMALIZAR TIPO DE IMÓVEL COM LÓGICA INTELIGENTE E SUPORTE A "AMBOS"
export function normalizeTipo(
  tipo: string | null | undefined,
  preco?: number,
  valor?: number,
): string {
  if (!tipo || tipo === 'Desconhecido') {
    // Se não tem tipo explícito, tentamos inferir com base nos preços
    if (preco && preco > 0 && valor && valor > 0) return 'Ambos'
    if (preco && preco > 100000) return 'Venda'
    if (valor && valor > 0 && valor <= 100000) return 'Aluguel'
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
  let tipos: string[] = []

  switch (roleNormalizado) {
    case 'sdr':
      // SDR vê imóveis de ALUGUEL ou AMBOS
      tipos = ['Aluguel', 'Ambos']
      break

    case 'corretor':
    case 'broker':
      // Broker/Corretor vê imóveis de VENDA ou AMBOS
      tipos = ['Venda', 'Ambos']
      break

    case 'captador':
    case 'admin':
    case 'gestor':
      // Roles irrestritos veem TUDO
      tipos = ['Venda', 'Aluguel', 'Ambos']
      break

    default:
      // Fallback seguro: vê tudo
      tipos = ['Venda', 'Aluguel', 'Ambos']
      break
  }

  logRoleFilter(roleNormalizado, tipos)
  return tipos
}

// ✅ FUNÇÃO PARA VALIDAR SE IMÓVEL É VISÍVEL PARA ROLE
export function isImovelVisivelParaRole(
  imovelTipo: string | null | undefined,
  role: string | undefined,
): boolean {
  const tipos = getTiposVisiveis(role)
  const normalizedTipo = normalizeTipo(imovelTipo)
  return tipos.includes(normalizedTipo)
}

// ✅ LOGS DE DEBUG
export function logRoleFilter(role: string | undefined, tipos: string[]) {
  console.log(`[getTiposVisiveis] Role: ${role} | Tipos visíveis: ['${tipos.join("', '")}']`)
}
