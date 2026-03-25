import { useState, useEffect } from 'react'

export function useTimeElapsed(createdAt: string | undefined) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!createdAt) return

    const createdMs = new Date(createdAt).getTime()
    if (isNaN(createdMs)) return

    const update = () => setNow(Date.now())

    let timeoutId: NodeJS.Timeout

    const scheduleNext = () => {
      const ageMs = Date.now() - createdMs
      let nextDelay = 60000 // 1 minute default

      if (ageMs > 86400000) {
        // > 24 hours
        nextDelay = 3600000 // 1 hour
      } else if (ageMs > 3600000) {
        // > 1 hour
        nextDelay = 300000 // 5 minutes
      }

      timeoutId = setTimeout(() => {
        update()
        scheduleNext()
      }, nextDelay)
    }

    scheduleNext()

    return () => clearTimeout(timeoutId)
  }, [createdAt])

  const fallbackDate = new Date()
  if (!createdAt)
    return {
      text: 'Há 0 minutos',
      hoursElapsed: 0,
      urgencyLevel: 'green' as const,
      createdDate: fallbackDate,
    }

  const createdDate = new Date(createdAt)
  if (isNaN(createdDate.getTime()))
    return {
      text: 'Há 0 minutos',
      hoursElapsed: 0,
      urgencyLevel: 'green' as const,
      createdDate: fallbackDate,
    }

  const diffMs = Math.max(0, now - createdDate.getTime())
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  let text = ''
  if (diffMins < 60) {
    text = `Há ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`
  } else if (diffHours < 24) {
    text = `Há ${diffHours} hora${diffHours !== 1 ? 's' : ''}`
  } else {
    text = `Há ${diffDays} dia${diffDays !== 1 ? 's' : ''}`
  }

  let urgencyLevel: 'green' | 'yellow' | 'orange' | 'red' = 'green'
  if (diffHours >= 48) urgencyLevel = 'red'
  else if (diffHours >= 24) urgencyLevel = 'orange'
  else if (diffHours >= 12) urgencyLevel = 'yellow'

  return { text, hoursElapsed: diffHours, urgencyLevel, createdDate }
}

export function useSlaCountdown(
  createdAt?: string,
  prazoRespostaDb?: string,
  status?: string,
  prorrogacoesUsadas: number = 0,
) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (status !== 'Pendente' && status !== 'aberta') return
    // Update every second for smooth transition on active demands
    const i = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(i)
  }, [status])

  if (!createdAt || (status !== 'Pendente' && status !== 'aberta'))
    return {
      text: '',
      progress: 0,
      level: 'none',
      isExpired: false,
      hoursRemaining: 0,
      badgeText: '',
      remainingMs: 0,
    }

  const startMs = new Date(createdAt).getTime()

  // Use database calculated deadline if available, otherwise assume 24h from creation
  const targetMs = prazoRespostaDb ? new Date(prazoRespostaDb).getTime() : startMs + 24 * 3600000
  const totalSlaMs = Math.max(1, targetMs - startMs)

  const elapsedMs = Math.max(0, now - startMs)
  const remainingMs = Math.max(0, targetMs - now)

  const hrs = Math.floor(remainingMs / 3600000)
  const mins = Math.floor((remainingMs % 3600000) / 60000)

  // Progress fills up as time passes
  const progress = Math.min(100, (elapsedMs / totalSlaMs) * 100)

  let level: 'green' | 'yellow' | 'red' | 'orange' | 'none' = 'green'
  let badgeText = ''

  if (prorrogacoesUsadas > 0) {
    level = 'orange'
    badgeText = `🟠 Prorrogado (${prorrogacoesUsadas}/3)`
  } else {
    if (remainingMs <= 6 * 3600000) {
      level = 'red'
      badgeText = '🔴 Prazo Crítico'
    } else if (remainingMs <= 12 * 3600000) {
      level = 'yellow'
      badgeText = '🟡 Atenção ao Prazo'
    } else {
      level = 'green'
      badgeText = '🟢 NOVA - 24h'
    }
  }

  if (remainingMs === 0) {
    level = 'red'
    badgeText = '🚨 VENCIDO'
  }

  return {
    text: remainingMs > 0 ? `⏰ ${hrs}h ${mins}min` : '🚨 Vencido',
    progress,
    level,
    isExpired: remainingMs === 0,
    hoursRemaining: remainingMs / 3600000,
    badgeText,
    remainingMs,
  }
}
