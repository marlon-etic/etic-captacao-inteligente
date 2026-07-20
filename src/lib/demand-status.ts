const GLOBALLY_LOST_STATUSES = new Set([
  'perdida',
  'perdido',
  'impossivel',
  'perdida_baixa',
  'cancelado',
  'finalizado',
])

const LOCALLY_LOST_STATUSES = new Set(['localmente_perdida'])

const ACTIVE_STATUSES = new Set([
  'aberta',
  'em busca',
  'em_busca',
  'sem_resposta_24h',
  'prioritaria',
  'atendida',
  'captado sob demanda',
  'em captação',
  'em captacao',
  'visita',
  'negócio',
  'negocio',
  'ganho',
])

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

export function isDemandActive(statusDemanda: string | undefined | null): boolean {
  if (!statusDemanda) return true
  const lower = statusDemanda.toLowerCase()
  if (isDemandLost(lower)) return false
  return ACTIVE_STATUSES.has(lower)
}

export function isDemandPending(statusDemanda: string | undefined | null): boolean {
  if (!statusDemanda) return true
  const lower = statusDemanda.toLowerCase()
  return (
    lower === 'aberta' ||
    lower === 'em busca' ||
    lower === 'em_busca' ||
    lower === 'sem_resposta_24h' ||
    lower === 'pendente' ||
    lower === 'prioritaria'
  )
}

export function isDemandTimeoutLost(motivoPerda: string | undefined | null): boolean {
  if (!motivoPerda) return false
  return motivoPerda === 'PERDIDO SEM RESPOSTA (TODOS CAPTADORES)'
}
