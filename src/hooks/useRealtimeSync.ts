import { useEffect, useRef, useCallback, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

interface RealtimeSyncOptions {
  table: string
  filter?: string
  onDataChange: (payload: any) => void
  onError?: (error: Error) => void
  enableRealtime?: boolean // Novo: Toggle para desabilitar realtime (default false para debug)
  maxRetries?: number
  initialBackoff?: number
  enablePollingFallback?: boolean
  pollingFn?: () => Promise<any[] | null>
}

export const useRealtimeSync = ({
  table,
  filter,
  onDataChange,
  onError,
  enableRealtime = false, // Default OFF para isolar channel error
  maxRetries = 3,
  initialBackoff = 1000,
  enablePollingFallback = true,
  pollingFn,
}: RealtimeSyncOptions) => {
  const { user: authUser } = useAuth()
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(enableRealtime)
  const subscriptionRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const backoffRef = useRef(initialBackoff)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isCleaningUpRef = useRef(false)
  const realtimeFailedRef = useRef(0)
  const invokeCountRef = useRef(0)

  const logWithTimestamp = (prefix: string, message: any, error?: Error) => {
    const timestamp = new Date().toISOString()
    const logObj = { message, ...(error && { stack: error.stack, cause: error.cause }) }
    console.groupCollapsed(`[${timestamp}] [Realtime-${prefix}]`)
    console.log(logObj)
    if (error) console.trace('Stack Trace:')
    console.groupEnd()
  }

  // Captura global de unhandled rejections (fix channel closed)
  useEffect(() => {
    const handleGlobalRejection = (event: PromiseRejectionEvent) => {
      logWithTimestamp('GLOBAL-REJECTION', 'Channel Closed detectado!', event.reason as Error)
      event.preventDefault()
      onError?.(
        new Error(`Global Rejection: ${(event.reason as Error)?.message || String(event.reason)}`),
      )
    }
    window.addEventListener('unhandledrejection', handleGlobalRejection)
    return () => window.removeEventListener('unhandledrejection', handleGlobalRejection)
  }, [onError])

  // Função para desabilitar HMR/Vite interference (debug)
  const disableHMRInterference = useCallback(() => {
    // @ts-expect-error
    if (import.meta.hot) {
      logWithTimestamp('HMR', 'Desabilitando HMR temporariamente para isolar channel errors')
      // @ts-expect-error
      import.meta.hot.accept(() => {})
      // @ts-expect-error
      import.meta.hot.dispose(() => {
        // Cleanup HMR listeners
      })
    }
  }, [])

  const testRLSAndPermissions = useCallback(async () => {
    if (!authUser?.id) return false
    try {
      logWithTimestamp('RLS-TEST', `Testando ${table} para user ${authUser.id}`)

      const { data, error } = await supabase.from(table).select('id').limit(1).single() // Force error if empty to test response

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = 0 rows returned
        logWithTimestamp('RLS-TEST', 'Falha:', error as unknown as Error)
        onError?.(new Error(`RLS Error: ${error.message}`))
        return false
      }

      logWithTimestamp('RLS-TEST', `✅ OK, dados testados.`)
      return true
    } catch (err) {
      logWithTimestamp('RLS-TEST', 'Catch:', err as Error)
      return false
    }
  }, [authUser?.id, table, onError])

  const startPolling = useCallback(async () => {
    if (!enablePollingFallback || !authUser?.id) return

    logWithTimestamp('POLLING', 'Iniciando polling (default ativo para debug)')
    realtimeFailedRef.current++

    const pollData = async () => {
      try {
        let data: any[] | null = null

        if (pollingFn) {
          data = await pollingFn()
        } else {
          const { data: resData, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) throw error
          data = resData
        }

        if (data && data.length > 0) {
          logWithTimestamp('POLLING', `Atualizando ${data.length} itens`)
          data.forEach((item) => onDataChange({ new: item, eventType: 'UPDATE' }))
        }
      } catch (err) {
        logWithTimestamp('POLLING', 'Erro:', err as Error)
        onError?.(err as Error)
      }
    }

    await pollData()
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    pollingIntervalRef.current = setInterval(pollData, 5000) // 5s para fallback
  }, [authUser?.id, table, onDataChange, onError, enablePollingFallback, pollingFn])

  const setupSubscription = useCallback(async () => {
    invokeCountRef.current++

    if (!isRealtimeEnabled) {
      logWithTimestamp('SETUP', 'Realtime desabilitado - usando apenas polling')
      startPolling()
      return
    }

    try {
      const rlsOk = await testRLSAndPermissions()
      if (!rlsOk) {
        logWithTimestamp('SETUP', 'RLS falhou - fallback polling')
        startPolling()
        return
      }

      disableHMRInterference() // Isola Vite issues

      if (isCleaningUpRef.current) {
        logWithTimestamp('SETUP', 'Cleanup ativo - abortando')
        return
      }

      if (subscriptionRef.current) {
        await supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
        logWithTimestamp('SETUP', 'Canal antigo removido')
      }

      const channelName = `${table}-debug-${authUser.id}-${Date.now()}`
      let query = supabase.channel(channelName)

      query = query
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: filter || undefined },
          (payload) => {
            try {
              logWithTimestamp('PAYLOAD', `Evento: ${payload.eventType}`)
              retryCountRef.current = 0
              backoffRef.current = initialBackoff
              onDataChange(payload)
            } catch (err) {
              logWithTimestamp('PAYLOAD', 'Process error:', err as Error)
            }
          },
        )
        .on('subscribe', (status: string, err?: Error) => {
          if (status === 'SUBSCRIBED') {
            logWithTimestamp('SUBSCRIBE', '✅ Conectado')
            retryCountRef.current = 0
            backoffRef.current = initialBackoff
            realtimeFailedRef.current = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logWithTimestamp('ERROR', 'Canal error:', err || new Error(status))
            onError?.(new Error(`Channel: ${status}`))
          }
        })
        .on('broadcast', (payload) => {
          logWithTimestamp('BROADCAST', 'Evento broadcast:', payload)
        })

      subscriptionRef.current = query

      query.subscribe(async (status: string, err?: Error) => {
        logWithTimestamp('SUBSCRIBE-CALLBACK', `Status: ${status}`)
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          throw new Error(`Subscribe Error: ${status}`)
        }
      })

      logWithTimestamp('SETUP', '✅ Setup realtime OK')
    } catch (error) {
      const err = error as Error
      logWithTimestamp('SETUP', 'Falha total:', err)
      realtimeFailedRef.current++

      if (realtimeFailedRef.current >= 1 && enablePollingFallback) {
        startPolling() // Ativa polling imediato
      }

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        timeoutRef.current = setTimeout(setupSubscription, backoffRef.current)
        backoffRef.current = Math.min(backoffRef.current * 2, 15000)
      } else {
        onError?.(new Error(`Max retries. Stack: ${err.stack}`))
      }
    }
  }, [
    authUser?.id,
    table,
    filter,
    onDataChange,
    onError,
    isRealtimeEnabled,
    maxRetries,
    initialBackoff,
    startPolling,
    testRLSAndPermissions,
    disableHMRInterference,
  ])

  useEffect(() => {
    logWithTimestamp('EFFECT', `Ativado. Realtime: ${isRealtimeEnabled ? 'ON' : 'OFF'}`)
    if (!authUser?.id) return

    setupSubscription()

    return () => {
      logWithTimestamp('CLEANUP', 'Executando')
      isCleaningUpRef.current = true

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = undefined
      }

      if (subscriptionRef.current) {
        try {
          supabase.removeChannel(subscriptionRef.current)
        } catch (e) {}
        subscriptionRef.current = null
      }
      isCleaningUpRef.current = false
    }
  }, [authUser?.id, setupSubscription])

  const toggleRealtime = useCallback(() => {
    setIsRealtimeEnabled((prev) => !prev)
    logWithTimestamp('TOGGLE', `Realtime alternado`)
  }, [])

  const reconnect = useCallback(() => {
    logWithTimestamp('RECONNECT', 'Manual chamado')
    realtimeFailedRef.current = 0
    retryCountRef.current = 0
    backoffRef.current = initialBackoff
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    setupSubscription()
  }, [setupSubscription, initialBackoff])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = undefined
      logWithTimestamp('POLLING', 'Parado manualmente')
    }
  }, [])

  return {
    reconnect,
    stopPolling,
    toggleRealtime,
    isRealtimeEnabled,
    invokeCount: invokeCountRef.current,
  }
}
