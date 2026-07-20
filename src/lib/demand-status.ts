const GLOBALLY_LOST_STATUSES = new Set([
  'perdida',
  'perdido',
  'impossivel',
  'perdida_baixa',
  'cancelado',
  'finalizado',
])

const LOCALLY_LOST_STATUSES = new Set(['localmente_perdida'])

export function isDemandLost(statusDemanda: string | undefined | null): boolean {
  if (!statusDemanda) return false
  const lower = statusDemanda.toLowerCase()
  return GLOBALLY_LOST_STATUSES.has(lower) || LOCALLY_LOST_STATUSES.has(lower)
}

export function isDemandGloballyLost(statusDemanda: string | undefined | null): boolean {
  if (!statusDemanda) return false
  return GLOBALLY_LOST_STATUSES.has(statusDemanda.toLowerCase())
}

export function isDemandLocallyLost(statusDemanda: string | undefined | null): boolean {
  if (!statusDemanda) return false
  return LOCALLY_LOST_STATUSES.has(statusDemanda.toLowerCase())
}

export function isDemandTimeoutLost(motivoPerda: string | undefined | null): boolean {
  if (!motivoPerda) return false
  return motivoPerda === 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
}
