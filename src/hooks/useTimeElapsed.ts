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
