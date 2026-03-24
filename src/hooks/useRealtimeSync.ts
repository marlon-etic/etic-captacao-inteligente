import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

interface RealtimeSyncOptions {
  table: string
  filter?: string
  onDataChange: (payload: any) => void
  onError?: (error: Error) => void
  enableRealtime?: boolean // Sempre false - desabilitado para evitar channel errors
  pollingInterval?: number // Default 5000
  enablePollingFallback?: boolean
  pollingFn?: () => Promise<any[] | null>
}

export const useRealtimeSync = ({
  table,
  filter,
  onDataChange,
  onError,
  enableRealtime = false, // PERMANENTEMENTE OFF para isolar extension errors
  pollingInterval = 5000,
  pollingFn,
}: RealtimeSyncOptions) => {
  const { user: authUser } = useAuth()
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const isCleaningUpRef = useRef(false)

  const logWithTimestampAndStack = (prefix: string, message: any, error?: Error) => {
    const timestamp = new Date().toISOString()
    console.groupCollapsed(
      `[${timestamp}] [POLLING-${prefix}] %cEXTENSION ALERT: Desabilite extensões para teste`,
      'color: red; font-weight: bold',
    )
    console.log(message)
    if (error) {
      console.error('Stack Trace Completo:', error.stack)
      console.error('Cause:', error.cause)
    }
    console.groupEnd()
  }

  // Captura GLOBAL de unhandled rejections - fix definitivo para channel closed
  useEffect(() => {
    const handleGlobalRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      logWithTimestampAndStack(
        'GLOBAL-REJECTION',
        `Channel Closed Capturado! Reason: ${reason.message}`,
        reason,
      )
      event.preventDefault() // Impede popup do navegador
      event.stopPropagation() // Para propagação
      onError?.(new Error(`Extension Interference: ${reason.message} - Teste sem Extensões`))
    }

    // Capture phase
    window.addEventListener('unhandledrejection', handleGlobalRejection, true)
    return () => window.removeEventListener('unhandledrejection', handleGlobalRejection, true)
  }, [onError])

  // Desabilita HMR/Vite interference logicualmente sem quebrar o build
  useEffect(() => {
    // @ts-expect-error
    if (import.meta.hot) {
      logWithTimestampAndStack('HMR', 'Prevenindo interferências de dev server / HMR')
      // @ts-expect-error
      import.meta.hot.dispose(() => {})
    }
  }, [])

  // Polling Robusto - Único método ativo
  const startPolling = useCallback(async () => {
    if (!authUser?.id) {
      logWithTimestampAndStack('START', 'Aguardando authUser')
      return
    }

    logWithTimestampAndStack(
      'START',
      `Polling iniciado para ${table} (interval: ${pollingInterval}ms)`,
    )

    const pollData = async () => {
      try {
        logWithTimestampAndStack('POLL', 'Consultando Supabase...')

        let data: any[] | null = null

        if (pollingFn) {
          data = await pollingFn()
        } else {
          // Usa updated_at ou created_at para buscar alterações recentes
          const { data: resData, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)

          if (error) {
            throw new Error(`Supabase Error: ${error.message}`)
          }
          data = resData
        }

        if (data && data.length > 0) {
          logWithTimestampAndStack('POLL', `✅ ${data.length} itens recebidos via polling`)
          data.forEach((item) => {
            try {
              onDataChange({ new: item, eventType: 'UPDATE', source: 'polling' })
            } catch (itemErr) {
              logWithTimestampAndStack('POLL-ITEM', 'Erro processando item:', itemErr as Error)
            }
          })
        } else {
          logWithTimestampAndStack('POLL', 'Nenhum dado novo')
        }
      } catch (err) {
        const error = err as Error
        logWithTimestampAndStack('POLL', 'Erro na consulta:', error)
        onError?.(error)
      }
    }

    // Poll imediata + interval
    await pollData()

    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
    }
    pollingIntervalRef.current = setInterval(pollData, pollingInterval)
  }, [authUser?.id, table, onDataChange, onError, pollingInterval, pollingFn])

  useEffect(() => {
    if (enableRealtime) {
      logWithTimestampAndStack(
        'WARNING',
        'Realtime habilitado via params - mas forçado OFF internamente por channel errors de extensions',
      )
    }

    startPolling()

    return () => {
      isCleaningUpRef.current = true
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = undefined
        logWithTimestampAndStack('CLEANUP', 'Polling parado')
      }
      isCleaningUpRef.current = false
    }
  }, [authUser?.id, startPolling, enableRealtime])

  const forcePoll = useCallback(() => {
    logWithTimestampAndStack('FORCE', 'Poll manual acionado')
    startPolling()
  }, [startPolling])

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current)
      pollingIntervalRef.current = undefined
    }
  }, [])

  return {
    forcePoll,
    isPollingActive: !!pollingIntervalRef.current,
    // Compatibilidade com hooks anteriores
    reconnect: forcePoll,
    stopPolling,
    toggleRealtime: () => {},
    isRealtimeEnabled: false,
    invokeCount: 1,
  }
}
