const currencyFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  maximumFractionDigits: 0,
})

const numberFormatter = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 0,
})

export function formatCurrency(val: number): string {
  return currencyFormatter.format(val)
}

export function formatNumber(val: number): string {
  return numberFormatter.format(val)
}

export function formatPriceRange(min: number, max: number): string {
  return `${formatCurrency(min)} - ${formatCurrency(max)}`
}

export function formatCurrencyStripped(val: number): string {
  return currencyFormatter.format(val).replace('R$', '').trim()
}
