export type UserRole = 'sdr' | 'corretor' | 'captador' | 'admin' | 'gestor' | string

export function getTiposVisiveis(role: UserRole | undefined): string[] {
  const roleNormalizado = role?.toLowerCase() || 'captador'

  switch (roleNormalizado) {
    case 'sdr':
      return ['Locação', 'Ambos', 'Aluguel']
    case 'broker':
    case 'corretor':
      return ['Venda', 'Ambos']
    case 'captador':
    case 'admin':
    case 'gestor':
      return ['Venda', 'Locação', 'Aluguel', 'Ambos']
    default:
      return ['Venda', 'Locação', 'Aluguel', 'Ambos']
  }
}

export function isImovelVisivelParaRole(
  imovelTipo: string | null | undefined,
  role: UserRole | undefined,
): boolean {
  if (!imovelTipo) return true
  const tipos = getTiposVisiveis(role)
  const tipoNormalized = imovelTipo === 'Aluguel' ? 'Locação' : imovelTipo
  return tipos.includes(tipoNormalized) || tipos.includes(imovelTipo)
}

export function logRoleFilter(role: UserRole | undefined, tipos: string[]) {
  if (import.meta.env.DEV) {
    console.log('[ROLE FILTER] Role:', role, '| Tipos visíveis:', tipos)
  }
}
