export function formatBRL(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const value = Number(digits) / 100
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function parseBRL(formatted: string): number {
  const digits = formatted.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}
