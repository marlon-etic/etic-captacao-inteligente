import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

const inFlightRequests = new Map<string, { promise: Promise<any>; timestamp: number }>()
const offlineQueue: Array<{ id: string; fn: () => Promise<any> }> = []

export function useSmartSync() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      processOfflineQueue()
    }
    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const processOfflineQueue = async () => {
    if (!navigator.onLine) return

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

      const reqStart = Date.now()

      const promise = (async () => {
        let attempt = 0
        while (attempt < 3) {
          if (!navigator.onLine) throw new Error('Offline')

          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 30000)

          try {
            const res = await fetcher(controller.signal)
            clearTimeout(timeoutId)
            return res
          } catch (err: any) {
            clearTimeout(timeoutId)

            const errMsg = String(err?.message || err || '')
            const isAuthError =
              err?.status === 401 ||
              err?.status === 403 ||
              errMsg.toLowerCase().includes('auth') ||
              errMsg.toLowerCase().includes('jwt')

            const isClientError = err?.status >= 400 && err?.status < 500 && !isAuthError

            if (isAuthError || isClientError) {
              throw err
            }

            attempt++

            if (attempt >= 3) {
              throw err
            }

            const base = Math.min(Math.pow(2, attempt) * 1000, 10000)
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
    [],
  )

  const enqueueMutation = useCallback((fn: () => Promise<any>) => {
    if (navigator.onLine) {
      fn().catch((err: any) => {
        const isClientError = err?.status >= 400 && err?.status < 500

        if (!isClientError) {
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
    disconnectedSince: null,
    circuitBreakerActive: false,
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
          `[Diagnostic] Erro silenciado no canal ${channelName} às ${new Date().toLocaleTimeString()}`,
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
      }, 120000) // Alterado de 60s para 120s para reduzir carga no DB
    }

    const delayTimeout = setTimeout(startPolling, initialDelay)

    return () => {
      supabase.removeChannel(channel)
      clearTimeout(delayTimeout)
      if (pollingInterval) clearInterval(pollingInterval)
    }
  }, [channelName, setupRealtime, onFallbackPoll])
}
