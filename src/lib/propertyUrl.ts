export function sanitizePropertyCode(code?: string): string {
  if (!code) return ''
  return code
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9-]/g, '')
    .toLowerCase()
}

export function getPropertyPublicUrl(code?: string): string {
  const sanitized = sanitizePropertyCode(code)
  if (!sanitized) return ''
  return `https://www.eticimoveis.com.br/imovel/${sanitized}`
}
