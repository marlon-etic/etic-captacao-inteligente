export const RESIDENTIAL_TIPO_IMOVEL = [
  'Apartamento',
  'Casa',
  'Sobrado',
  'Casa de Condomínio',
  'Casa de Vila',
  'Chácara',
  'Sítio',
  'Flat',
  'Loft',
  'Quitinete',
  'Studio',
  'Cobertura',
  'Duplex',
  'Triplex',
  'Casa Térrea',
  'Mansão',
]

export function isResidential(tipoImovel: string | null | undefined): boolean {
  if (!tipoImovel) return false
  const normalized = tipoImovel.trim().toLowerCase()
  return RESIDENTIAL_TIPO_IMOVEL.some((t) => t.toLowerCase() === normalized)
}

export function hasBedrooms(dormitorios: number | null | undefined): boolean {
  return (dormitorios ?? 0) >= 1
}
