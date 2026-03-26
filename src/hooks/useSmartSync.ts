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
    async <T>(key: string, fetcher: (signal?: AbortSignal) => Promise<T>): Promise<T> => {
      const existing = inFlightRequests.get(key)
      if (existing) {
        if (Date.now() - existing.timestamp < 30000) {
          // Mantém a promessa em andamento se < 30s
          return existing.promise
        } else {
          // Limpa requisições "penduradas" há mais de 30s
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
          const tryStart = Date.now()

          try {
            const res = await fetcher(controller.signal)
            clearTimeout(timeoutId)
            consecutiveFailures = 0 // Reseta falhas no sucesso

            if (import.meta.env.VITE_DEBUG_MODE) {
              const duration = Date.now() - tryStart
              if (duration > 5000) {
                console.warn(
                  `[Diagnostic - Performance] Requisição lenta detectada: ${key} demorou ${duration}ms`,
                )
              }
            }

            return res
          } catch (err: any) {
            clearTimeout(timeoutId)

            const errMsg = String(err?.message || err || '')
            const isLockError = errMsg.includes('Lock broken') || errMsg.includes('steal')
            const isTimeout =
              !isLockError &&
              (err?.name === 'AbortError' || errMsg.toLowerCase().includes('aborted'))

            attempt++
            consecutiveFailures++

            if (import.meta.env.VITE_DEBUG_MODE) {
              const tryDuration = Date.now() - tryStart
              console.error(
                `[Diagnostic - Request Failure] Falha ${key} (${attempt}/5) em ${tryDuration}ms:`,
                isLockError
                  ? 'Lock Supabase ocupado (retentando)'
                  : isTimeout
                    ? 'Timeout 30s excedido'
                    : errMsg,
                `às ${new Date().toLocaleTimeString()}`,
              )
            }

            if (isTimeout) {
              // Em caso de requisição longa (>30s), cancelamos e falhamos direto para evitar fila travada
              throw new Error('Operação demorou muito. Cancelada após 30s.')
            }

            if (consecutiveFailures >= 3 && attempt === 1 && !isLockError) {
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

    setupRealtime(channel)

    channel.subscribe((status) => {
      if (import.meta.env.VITE_DEBUG_MODE && status === 'CHANNEL_ERROR') {
        console.log(
          `[Diagnostic - ConsolidatedSync] Erro no canal ${channelName} às ${new Date().toLocaleTimeString()}`,
        )
      }
    })

    // Desacoplamento do startup do polling com o heartbeat: introduzimos um delay inicial randômico (10-30s)
    const initialDelay = 10000 + Math.random() * 20000

    let pollingInterval: NodeJS.Timeout

    const startPolling = () => {
      // Polling rigorosamente desacoplado do Realtime operando a cada 60s
      // Atua exclusivamente como fallback seguro de longa duração
      pollingInterval = setInterval(() => {
        if (navigator.onLine) {
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.log(
              `[Diagnostic - Polling] Executando fallback polling para ${channelName} às ${new Date().toLocaleTimeString()}`,
            )
          }
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
