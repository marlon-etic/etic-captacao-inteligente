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
}

export const useRealtimeSync = ({
  table,
  filter,
  onDataChange,
  onError,
  maxRetries = 5,
  initialBackoff = 1000,
}: RealtimeSyncOptions) => {
  const { user: authUser } = useAuth()
  const subscriptionRef = useRef<any>(null)
  const retryCountRef = useRef(0)
  const backoffRef = useRef(initialBackoff)
  const timeoutRef = useRef<NodeJS.Timeout>(undefined)
  const isCleaningUpRef = useRef(false)

  const handleError = useCallback(
    (errMsg: string) => {
      console.error(`❌ [Realtime] Erro ao conectar ${table}:`, errMsg)

      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++
        console.log(
          `⏳ [Realtime] Retry ${retryCountRef.current}/${maxRetries} em ${backoffRef.current}ms`,
        )

        timeoutRef.current = setTimeout(() => {
          if (!isCleaningUpRef.current) {
            setupSubscription()
          }
        }, backoffRef.current)

        backoffRef.current = Math.min(backoffRef.current * 2 + Math.random() * 1000, 30000)
      } else {
        const maxRetriesError = new Error(`Falha ao conectar após ${maxRetries} tentativas`)
        onError?.(maxRetriesError)
      }
    },
    [maxRetries, onError, table],
  )

  const setupSubscription = useCallback(async () => {
    if (!authUser?.id) {
      console.warn('[Realtime] AuthUser não está pronto, aguardando...')
      return
    }

    if (isCleaningUpRef.current) {
      console.log('[Realtime] Limpeza em progresso, abortando setup')
      return
    }

    try {
      console.log(`[Realtime] Setup para ${table} com filtro: ${filter || 'nenhum'}`)

      if (subscriptionRef.current) {
        await supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      const channelName = `${table}-changes-${authUser.id}-${Date.now()}`
      const channel = supabase.channel(channelName)

      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter || undefined,
        },
        (payload) => {
          console.log(`[Realtime] ${table} atualizado:`, payload)
          retryCountRef.current = 0
          backoffRef.current = initialBackoff
          onDataChange(payload)
        },
      )

      subscriptionRef.current = channel

      channel.subscribe((status) => {
        console.log(`📊 Status subscription [${table}]: ${status}`)
        if (status === 'SUBSCRIBED') {
          console.log(`✅ [Realtime] Inscrito em ${table}`)
          retryCountRef.current = 0
          backoffRef.current = initialBackoff
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (!isCleaningUpRef.current) {
            handleError(`Falha na inscrição: ${status}`)
          }
        }
      })
    } catch (error) {
      handleError((error as Error).message)
    }
  }, [authUser?.id, table, filter, onDataChange, initialBackoff, handleError])

  useEffect(() => {
    if (!authUser?.id) return

    setupSubscription()

    return () => {
      isCleaningUpRef.current = true

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      isCleaningUpRef.current = false
    }
  }, [authUser?.id, setupSubscription])

  const reconnect = useCallback(() => {
    console.log('[Realtime] Reconexão forçada')
    retryCountRef.current = 0
    backoffRef.current = initialBackoff
    setupSubscription()
  }, [setupSubscription, initialBackoff])

  return { reconnect }
}
