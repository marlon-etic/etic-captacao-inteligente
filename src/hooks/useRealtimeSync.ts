import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

interface RealtimeSyncOptions {
  table: string
  filter?: string
  onDataChange: (payload: any) => void
  onError?: (error: Error) => void
  maxRetries?: number
  initialBackoff?: number
  enablePollingFallback?: boolean
  pollingFn?: () => Promise<any[] | null>
}

const logWithTimestamp = (prefix: string, message: any, error?: Error) => {
  const timestamp = new Date().toISOString()
  console.log(`[${timestamp}] [Realtime-${prefix}]`, message, error ? { stack: error.stack } : '')
}

export const useRealtimeSync = ({
  table,
  filter,
  onDataChange,
  onError,
  maxRetries = 3, // Reduzido para debug rápido
  initialBackoff = 1000,
  enablePollingFallback = true,
  pollingFn,
}: RealtimeSyncOptions) => {
  const { user: authUser } = useAuth()
  const subscriptionRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const backoffRef = useRef(initialBackoff)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isCleaningUpRef = useRef(false)
  const invokeCountRef = useRef(0) // Detecta double invoke (StrictMode)
  const realtimeFailedRef = useRef(0)

  // Teste RLS com try-catch
  const testRLSAndPermissions = useCallback(async () => {
    if (!authUser?.id) return false

    try {
      logWithTimestamp('RLS-TEST', `Iniciando teste para ${table}, user: ${authUser.id}`)

      const query = supabase.from(table).select('id').limit(1).single() // Força erro se vazio para testar a resposta

      const { data, error } = await query

      if (error) {
        // PGRST116 significa 0 rows returned, o que é normal se não houver dados ainda, a permissão não foi negada.
        if (error.code === 'PGRST116') {
          logWithTimestamp('RLS-TEST', '✅ Sucesso. 0 linhas (PGRST116 esperado).')
          return true
        }

        logWithTimestamp('RLS-TEST', 'Erro detectado:', error)
        onError?.(new Error(`RLS/Perm Error: ${error.message}`))
        return false
      }

      logWithTimestamp('RLS-TEST', `✅ Sucesso. Dados encontrados:`, data)
      return true
    } catch (err) {
      const error = err as Error
      logWithTimestamp('RLS-TEST', 'Catch no teste:', error)
      onError?.(error)
      return false
    }
  }, [authUser?.id, table, onError])

  // Polling com try-catch
  const startPolling = useCallback(async () => {
    if (!enablePollingFallback || !authUser?.id) return

    logWithTimestamp(
      'POLLING',
      `Ativando fallback para ${table}. Falhas realtime: ${realtimeFailedRef.current}`,
    )
    realtimeFailedRef.current++

    const pollData = async () => {
      try {
        logWithTimestamp('POLLING', 'Consultando dados...')

        let data: any[] | null = null

        if (pollingFn) {
          data = await pollingFn()
        } else {
          const { data: resData, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) throw new Error(`Polling Error: ${error.message}`)
          data = resData
        }

        if (data && data.length > 0) {
          logWithTimestamp('POLLING', `Atualizando ${data.length} itens`)
          data.forEach((item) => onDataChange({ new: item, eventType: 'UPDATE' }))
        }
      } catch (err) {
        const error = err as Error
        logWithTimestamp('POLLING', 'Erro na poll:', error)
        onError?.(error)
      }
    }

    await pollData()
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    pollingIntervalRef.current = setInterval(pollData, 5000) // 5s para debug rápido
  }, [authUser?.id, table, onDataChange, onError, enablePollingFallback, pollingFn])

  // Setup com try-catch total
  const setupSubscription = useCallback(async () => {
    invokeCountRef.current++
    logWithTimestamp('SETUP', `Invoke #${invokeCountRef.current}. User: ${authUser?.id || 'NULL'}`)

    try {
      const rlsOk = await testRLSAndPermissions()
      if (!rlsOk) {
        logWithTimestamp('SETUP', 'RLS falhou - ativando polling imediato')
        startPolling()
        return
      }

      if (isCleaningUpRef.current) {
        logWithTimestamp('SETUP', 'Cleanup ativo - abortando')
        return
      }

      // Cleanup forçado
      try {
        if (subscriptionRef.current) {
          logWithTimestamp('SETUP', 'Removendo canal antigo...')
          await supabase.removeChannel(subscriptionRef.current)
          subscriptionRef.current = null
        }
      } catch (cleanupErr) {
        logWithTimestamp('SETUP', 'Erro no cleanup - ignorando:', cleanupErr as Error)
      }

      const channelName = `${table}-changes-${authUser.id}-${Date.now()}`
      logWithTimestamp('SETUP', `Criando canal: ${channelName}. Filtro: ${filter || 'none'}`)

      let query = supabase.channel(channelName)

      // Listeners com try-catch interno
      query = query
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: table,
            filter: filter || undefined,
          },
          (payload) => {
            try {
              logWithTimestamp('PAYLOAD', `Evento recebido: ${payload.eventType}`, undefined)
              retryCountRef.current = 0
              backoffRef.current = initialBackoff
              onDataChange(payload)
            } catch (payloadErr) {
              logWithTimestamp('PAYLOAD', 'Erro processando payload:', payloadErr as Error)
              onError?.(payloadErr as Error)
            }
          },
        )
        .on('subscribe', (status: string, err?: Error) => {
          if (status === 'SUBSCRIBED') {
            logWithTimestamp(
              'SUBSCRIBE',
              `✅ Canal ${channelName} conectado! Invoke: ${invokeCountRef.current}`,
            )
            retryCountRef.current = 0
            backoffRef.current = initialBackoff
            realtimeFailedRef.current = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            logWithTimestamp('ERROR', 'Erro no canal:', err || new Error(status))
            onError?.(new Error(`Channel Error: ${status}`))
          }
        })
        .on('broadcast', (payload) => {
          logWithTimestamp('BROADCAST', 'Evento broadcast:', payload) // Para debug extra
        })
        .on('presence', (payload) => {
          logWithTimestamp('PRESENCE', 'Evento presence:', payload) // Se ativado
        })

      subscriptionRef.current = query

      try {
        logWithTimestamp('SETUP', 'Chamando query.subscribe()...')
        query.subscribe(async (status: string, err?: Error) => {
          logWithTimestamp('SUBSCRIBE-CALLBACK', `Status: ${status}`)
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            throw new Error(`Subscribe Error: ${status}`)
          }
        })
      } catch (subErr) {
        throw new Error(`Subscribe Error: ${(subErr as Error).message}`)
      }

      logWithTimestamp('SETUP', '✅ Setup agendado.')
    } catch (error) {
      const err = error as Error
      logWithTimestamp('SETUP', 'Catch geral no setup:', err)
      realtimeFailedRef.current++

      if (realtimeFailedRef.current >= 2 && enablePollingFallback) {
        startPolling()
      }

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        const waitTime = backoffRef.current
        logWithTimestamp(
          'RETRY',
          `Tentativa ${retryCountRef.current}/${maxRetries} em ${waitTime}ms`,
        )

        timeoutRef.current = setTimeout(async () => {
          if (!isCleaningUpRef.current) {
            await setupSubscription() // Await para chain
          }
        }, waitTime)

        backoffRef.current = Math.min(backoffRef.current * 2 + Math.random() * 500, 15000) // Jitter menor para debug
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
    maxRetries,
    initialBackoff,
    enablePollingFallback,
    startPolling,
    testRLSAndPermissions,
  ])

  useEffect(() => {
    logWithTimestamp('EFFECT', 'useEffect rodando. Auth ready:', !!authUser?.id)
    if (!authUser?.id) {
      logWithTimestamp('EFFECT', 'Aguardando auth - sem setup')
      return undefined // Cleanup não roda se não setup
    }

    setupSubscription()

    return () => {
      logWithTimestamp('CLEANUP', 'Iniciando cleanup useEffect')
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
        } catch (cleanupErr) {
          logWithTimestamp('CLEANUP', 'Erro removendo channel:', cleanupErr as Error)
        }
        subscriptionRef.current = null
      }

      // Força GC para channels globalmente (se exposto pelo SDK)
      if (typeof window !== 'undefined' && 'supabase' in window) {
        // Reservado para limpeza agressiva se necessário
      }

      isCleaningUpRef.current = false
      logWithTimestamp('CLEANUP', 'Cleanup finalizado')
    }
  }, [authUser?.id, setupSubscription])

  const reconnect = useCallback(async () => {
    logWithTimestamp('RECONNECT', 'Manual chamado')
    realtimeFailedRef.current = 0
    retryCountRef.current = 0
    backoffRef.current = initialBackoff
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    await setupSubscription()
  }, [setupSubscription, initialBackoff])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = undefined
      logWithTimestamp('POLLING', 'Parado manualmente')
    }
  }, [])

  // Expor invoke count para debug
  return { reconnect, stopPolling, invokeCount: invokeCountRef.current }
}
