import { useRef, useCallback } from 'react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'

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
  filter,
  onDataChange,
  onError,
  pollingInterval = 30000,
  pollingFn,
}: RealtimeSyncOptions) => {
  const { user: authUser } = useAuth()
  const { fetchWithResilience, circuitBreakerActive } = useSmartSync()
  const pollingIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined)

  const executePoll = useCallback(async () => {
    if (!authUser?.id) return

    try {
      const data = await fetchWithResilience(`poll_${table}`, async () => {
        if (pollingFn) {
          return await pollingFn()
        } else {
          const { data: resData, error } = await supabase
            .from(table)
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50)
          if (error) throw error
          return resData
        }
      })

      if (data && data.length > 0) {
        data.forEach((item: any) => {
          try {
            onDataChange({ new: item, eventType: 'UPDATE', source: 'polling' })
          } catch (err) {
            // silent catch
          }
        })
      }
    } catch (err) {
      onError?.(err as Error)
    }
  }, [authUser?.id, table, onDataChange, onError, pollingFn, fetchWithResilience])

  useConsolidatedSync({
    channelName: `realtime_${table}_${filter || 'all'}`,
    setupRealtime: (channel) => {
      let filterString = undefined
      if (filter) filterString = filter

      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table, filter: filterString },
        (payload: any) => {
          onDataChange({
            new: payload.new,
            old: payload.old,
            eventType: payload.eventType,
            source: 'realtime',
          })
        },
      )
    },
    onFallbackPoll: executePoll,
  })

  return {
    forcePoll: executePoll,
    isPollingActive: true,
    reconnect: executePoll,
    stopPolling: () => {},
    toggleRealtime: () => {},
    isRealtimeEnabled: !circuitBreakerActive,
    invokeCount: 1,
  }
}
