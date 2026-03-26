import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

const inFlightRequests = new Map<string, { promise: Promise<any>; timestamp: number }>()
let consecutiveFailures = 0
let circuitBreakerUntil = 0
const offlineQueue: Array<{ id: string; fn: () => Promise<any> }> = []

export function useSmartSync() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [disconnectedSince, setDisconnectedSince] = useState<number | null>(null)
  const [circuitBreakerActive, setCircuitBreakerActive] = useState(Date.now() < circuitBreakerUntil)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setDisconnectedSince(null)
      processOfflineQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setDisconnectedSince(Date.now())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const cbInterval = setInterval(() => {
      setCircuitBreakerActive(Date.now() < circuitBreakerUntil)
    }, 1000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(cbInterval)
    }
  }, [])

  const processOfflineQueue = async () => {
    if (!navigator.onLine || Date.now() < circuitBreakerUntil) return

    const toProcess = [...offlineQueue]
    offlineQueue.length = 0

    for (const op of toProcess) {
      try {
        await op.fn()
      } catch (err) {
        if (offlineQueue.length < 50) offlineQueue.push(op)
      }
    }
  }

  const fetchWithResilience = useCallback(
    async <T>(key: string, fetcher: (signal?: AbortSignal) => Promise<T>): Promise<T> => {
      const existing = inFlightRequests.get(key)
      if (existing) {
        if (Date.now() - existing.timestamp < 30000) {
          return existing.promise
        } else {
          inFlightRequests.delete(key)
        }
      }

      if (Date.now() < circuitBreakerUntil) {
        throw new Error('Circuit breaker ativo. Aguardando...')
      }

      const reqStart = Date.now()

      const promise = (async () => {
        let attempt = 0
        while (attempt < 6) {
          if (!navigator.onLine) throw new Error('Offline')

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          try {
            const res = await fetcher(controller.signal)
            clearTimeout(timeoutId)
            consecutiveFailures = 0
            return res
          } catch (err: any) {
            clearTimeout(timeoutId)

            const errMsg = String(err?.message || err || '')
            const isLockError = errMsg.includes('Lock broken') || errMsg.includes('steal')
            const isTimeout =
              !isLockError &&
              (err?.name === 'AbortError' || errMsg.toLowerCase().includes('aborted'))

            const isPgError = typeof err?.code === 'string' && err.code.length === 5
            const isRetryablePgError = err?.code === '40001' || err?.code === '40P01'
            if (isPgError && !isRetryablePgError) {
              throw err
            }

            const isAuthError =
              err?.status === 401 ||
              err?.status === 403 ||
              errMsg.toLowerCase().includes('auth') ||
              errMsg.toLowerCase().includes('jwt')
            if (isAuthError) {
              throw err
            }

            const isClientError = err?.status >= 400 && err?.status < 500 && !isAuthError
            if (isClientError) {
              throw err
            }

            attempt++
            consecutiveFailures++

            if (isTimeout) {
              throw new Error('Operação demorou muito. Cancelada após 30s.')
            }

            if (consecutiveFailures >= 5 && attempt === 1 && !isLockError) {
              circuitBreakerUntil = Date.now() + 30000
              setCircuitBreakerActive(true)
              if (!disconnectedSince) setDisconnectedSince(Date.now())
              throw new Error('Muitas falhas de conexão. Circuit breaker ativado.')
            }

            if (attempt >= 6) {
              throw err
            }

            const base = Math.min(Math.pow(2, attempt - 1) * 1000, 60000)
            const jitter = base * 0.2 * (Math.random() * 2 - 1)
            await new Promise((resolve) => setTimeout(resolve, base + jitter))
          }
        }
        throw new Error('Máximo de tentativas excedido')
      })()

      inFlightRequests.set(key, { promise, timestamp: reqStart })

      try {
        return await promise
      } finally {
        inFlightRequests.delete(key)
      }
    },
    [disconnectedSince],
  )

  const enqueueMutation = useCallback((fn: () => Promise<any>) => {
    if (navigator.onLine && Date.now() >= circuitBreakerUntil) {
      fn().catch((err: any) => {
        const isPgError = typeof err?.code === 'string' && err.code.length === 5
        const isClientError = err?.status >= 400 && err?.status < 500

        if (!isPgError && !isClientError) {
          if (offlineQueue.length < 50) offlineQueue.push({ id: Math.random().toString(), fn })
        } else {
          console.warn('Erro lógico na mutação ignorado da fila offline:', err)
        }
      })
    } else {
      if (offlineQueue.length < 50) {
        offlineQueue.push({ id: Math.random().toString(), fn })
      } else {
        toast({ title: 'Aviso', description: 'Fila offline cheia. Sincronização pendente.' })
      }
    }
  }, [])

  return {
    fetchWithResilience,
    enqueueMutation,
    isOnline,
    disconnectedSince,
    circuitBreakerActive,
  }
}

export function useConsolidatedSync({
  channelName,
  setupRealtime,
  onFallbackPoll,
}: {
  channelName: string
  setupRealtime: (channel: any) => void
  onFallbackPoll: () => void
}) {
  useEffect(() => {
    const channel = supabase.channel(channelName)

    setupRealtime(channel)

    channel.subscribe((status) => {
      if (import.meta.env.VITE_DEBUG_MODE && status === 'CHANNEL_ERROR') {
        console.log(
          `[Diagnostic] Erro no canal ${channelName} às ${new Date().toLocaleTimeString()}`,
        )
      }
    })

    const initialDelay = 10000 + Math.random() * 20000
    let pollingInterval: NodeJS.Timeout

    const startPolling = () => {
      pollingInterval = setInterval(() => {
        if (navigator.onLine) {
          onFallbackPoll()
        }
      }, 60000)
    }

    const delayTimeout = setTimeout(startPolling, initialDelay)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(delayTimeout)
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [channelName, setupRealtime, onFallbackPoll])
}
