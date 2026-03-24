import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

// Estado global fora do ciclo de vida do React para persistir entre remounts
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
    async <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
      const existing = inFlightRequests.get(key)
      if (existing) {
        if (Date.now() - existing.timestamp < 30000) {
          // Timeout de requisição em flight de 30s
          return existing.promise
        } else {
          inFlightRequests.delete(key)
        }
      }

      if (Date.now() < circuitBreakerUntil) {
        throw new Error('Circuit breaker ativo. Aguardando...')
      }

      const promise = (async () => {
        let attempt = 0
        while (attempt < 6) {
          if (!navigator.onLine) throw new Error('Offline')
          try {
            const res = await fetcher()
            consecutiveFailures = 0 // Reseta falhas no sucesso
            return res
          } catch (err: any) {
            attempt++
            consecutiveFailures++

            if (import.meta.env.VITE_DEBUG_MODE) {
              console.error(`[Sync] Falha ${key} (${attempt}/5):`, err.message)
            }

            if (consecutiveFailures >= 3 && attempt === 1) {
              circuitBreakerUntil = Date.now() + 30000
              setCircuitBreakerActive(true)
              if (!disconnectedSince) setDisconnectedSince(Date.now())
              throw new Error('Muitas falhas. Circuit breaker ativado.')
            }

            if (attempt >= 6) {
              toast({
                title: 'Erro ao sincronizar',
                description: 'Tente novamente mais tarde.',
                variant: 'destructive',
              })
              throw err
            }

            // Backoff exponencial real com Jitter (1s, 2s, 4s, 8s, 16s... máx 60s)
            const base = Math.min(Math.pow(2, attempt - 1) * 1000, 60000)
            const jitter = base * 0.2 * (Math.random() * 2 - 1)
            await new Promise((resolve) => setTimeout(resolve, base + jitter))
          }
        }
        throw new Error('Máximo de tentativas excedido')
      })()

      inFlightRequests.set(key, { promise, timestamp: Date.now() })

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
      fn().catch(() => {
        if (offlineQueue.length < 50) offlineQueue.push({ id: Math.random().toString(), fn })
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
    let pollingInterval: NodeJS.Timeout | null = null

    setupRealtime(channel)

    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        if (pollingInterval) {
          clearInterval(pollingInterval)
          pollingInterval = null
        }
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        if (!pollingInterval) {
          pollingInterval = setInterval(() => {
            if (navigator.onLine) onFallbackPoll()
          }, 30000) // Polling como fallback a cada 30s
        }
      }
    })

    return () => {
      supabase.removeChannel(channel)
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [channelName, setupRealtime, onFallbackPoll])
}
