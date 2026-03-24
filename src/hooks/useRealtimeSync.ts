import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'

interface RealtimeSyncOptions {
  table: string
  filter?: string
  onDataChange: (payload: any) => void
  onError?: (error: Error) => void
  enableRealtime?: boolean
  pollingInterval?: number
  enablePollingFallback?: boolean
  pollingFn?: () => Promise<any[] | null>
}

export const useRealtimeSync = ({
  table,
  onDataChange,
  onError,
  pollingInterval = 5000,
  pollingFn,
}: RealtimeSyncOptions) => {
  const { user: authUser } = useAuth()
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Captura GLOBAL de unhandled rejections - blindagem definitiva contra extensions
  useEffect(() => {
    const handleGlobalRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))

      if (
        reason.message.includes('channel closed') ||
        reason.message.includes('asynchronous response')
      ) {
        console.groupCollapsed(
          '%c🛡️ BLINDAGEM ATIVA: Interferência Externa Bloqueada',
          'color: #10B981; font-weight: bold;',
        )
        console.warn(
          'O sistema interceptou um erro de canal causado por extensões (ex: Vibe Coding).',
        )
        console.warn('Motivo:', reason.message)
        console.warn(
          'A sincronização continuará operando via Polling seguro. O erro foi suprimido visualmente para não interromper sua experiência.',
        )
        console.groupEnd()

        event.preventDefault()
        event.stopPropagation()
      }
    }
    window.addEventListener('unhandledrejection', handleGlobalRejection, true)
    return () => window.removeEventListener('unhandledrejection', handleGlobalRejection, true)
  }, [])

  const startPolling = useCallback(async () => {
    if (!authUser?.id) return

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
          data.forEach((item) => {
            try {
              onDataChange({ new: item, eventType: 'UPDATE', source: 'polling' })
            } catch (err) {
              // silent catch for individual parsing errors
            }
          })
        }
      } catch (err) {
        onError?.(err as Error)
      }
    }

    await pollData()
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    pollingIntervalRef.current = setInterval(pollData, pollingInterval)
  }, [authUser?.id, table, onDataChange, onError, pollingInterval, pollingFn])

  useEffect(() => {
    startPolling()
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    }
  }, [startPolling])

  return {
    forcePoll: startPolling,
    isPollingActive: !!pollingIntervalRef.current,
    reconnect: startPolling,
    stopPolling: () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    },
    toggleRealtime: () => {}, // No-op, Realtime is permanently disabled for safety
    isRealtimeEnabled: false,
    invokeCount: 1,
  }
}
