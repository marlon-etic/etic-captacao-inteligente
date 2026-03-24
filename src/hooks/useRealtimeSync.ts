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

export const useRealtimeSync = ({
  table,
  filter,
  onDataChange,
  onError,
  maxRetries = 5,
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
  const realtimeFailedRef = useRef(0)

  const testRLSAndPermissions = useCallback(async () => {
    if (!authUser?.id) return false

    try {
      console.log(`[DEBUG-RLS] Testando query em ${table} para user ${authUser.id}`)
      const { data, error } = await supabase.from(table).select('id').limit(1)

      if (error) {
        console.error(`[DEBUG-RLS] Erro RLS/Permissões:`, error.message)
        onError?.(new Error(`RLS Error: ${error.message}`))
        return false
      }

      console.log(`[DEBUG-RLS] ✅ Query OK. Dados encontrados:`, data?.length || 0)
      return true
    } catch (err) {
      console.error(`[DEBUG-RLS] Falha no teste:`, err)
      return false
    }
  }, [authUser?.id, table, onError])

  const startPolling = useCallback(async () => {
    if (!enablePollingFallback || !authUser?.id) return

    console.log(`[POLLING] Ativando fallback polling para ${table}`)
    realtimeFailedRef.current++

    const pollData = async () => {
      try {
        console.log(`[POLLING] Consultando ${table}...`)

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
          console.log(`[POLLING] Dados atualizados via polling:`, data.length)
          data.forEach((item) => onDataChange({ new: item, eventType: 'UPDATE' }))
        }
      } catch (err) {
        console.error(`[POLLING] Erro na consulta:`, err)
        onError?.(err as Error)
      }
    }

    await pollData()
    if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
    pollingIntervalRef.current = setInterval(pollData, 10000)
  }, [authUser?.id, table, onDataChange, onError, enablePollingFallback, pollingFn])

  const setupSubscription = useCallback(async () => {
    const rlsOk = await testRLSAndPermissions()
    if (!rlsOk) {
      console.error(`[Realtime] ❌ RLS falhou. Ativando polling fallback.`)
      if (enablePollingFallback) startPolling()
      return
    }

    if (!authUser?.id) {
      console.warn(`[Realtime] ❌ AuthUser inválido:`, authUser)
      return
    }

    if (isCleaningUpRef.current) {
      console.log('[Realtime] Limpeza em progresso, abortando setup')
      return
    }

    try {
      if (subscriptionRef.current) {
        console.log('[Realtime] Removendo canal anterior...')
        await supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      const channelName = `${table}-changes-${authUser.id}-${Date.now()}`
      let query = supabase.channel(channelName).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: table,
          filter: filter || undefined,
        },
        (payload) => {
          console.log(`[Realtime] 📦 Payload recebido:`, {
            eventType: payload.eventType,
            table: payload.table,
            new: payload.new ? 'Sim' : 'Não',
            old: payload.old ? 'Sim' : 'Não',
          })
          retryCountRef.current = 0
          backoffRef.current = initialBackoff
          onDataChange(payload)
        },
      )

      query
        .on('subscribe', (status: string, err?: Error) => {
          if (status === 'SUBSCRIBED') {
            console.log(`✅ [Realtime] Canal ${channelName} inscrito com sucesso!`)
            retryCountRef.current = 0
            backoffRef.current = initialBackoff
            realtimeFailedRef.current = 0
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            console.error(`❌ [Realtime] Erro no canal (${status}):`, err)
            onError?.(new Error(`Canal Error: ${status}`))
          }
        })
        .on('system', (message: any) => {
          console.warn('[Realtime] Sistema:', message)
        })

      subscriptionRef.current = query
      console.log(`[Realtime] Subscribing ao canal ${channelName}...`)

      query.subscribe(async (status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ✅ Subscription status:`, status)
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          throw new Error(`Subscribe Error: ${status}`)
        }
      })
    } catch (error) {
      const err = error as Error
      console.error(`❌ [Realtime] Erro completo no setup:`, {
        message: err.message,
        stack: err.stack,
        table,
        filter,
        authUserId: authUser?.id,
      })

      realtimeFailedRef.current++
      if (realtimeFailedRef.current >= 3 && enablePollingFallback) {
        console.log(
          `[Realtime] Ativando polling após ${realtimeFailedRef.current} falhas realtime.`,
        )
        startPolling()
      }

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
        const maxRetriesError = new Error(
          `Falha realtime após ${maxRetries} tentativas. Verifique RLS e auth.`,
        )
        onError?.(maxRetriesError)
      }
    }
  }, [
    authUser,
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
    console.log('[Realtime] useEffect ativado | AuthUser:', authUser?.id ? 'OK' : 'NULL')
    if (!authUser?.id) {
      console.warn('[Realtime] Aguardando authUser...')
      return
    }

    setupSubscription()

    return () => {
      console.log('[Realtime] Cleanup useEffect...')
      isCleaningUpRef.current = true

      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)

      if (subscriptionRef.current) {
        supabase.removeChannel(subscriptionRef.current)
        subscriptionRef.current = null
      }

      isCleaningUpRef.current = false
      console.log('[Realtime] Cleanup concluído.')
    }
  }, [authUser?.id, setupSubscription])

  const reconnect = useCallback(() => {
    console.log('[Realtime] 🔄 Reconexão forçada manual')
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
      console.log('[POLLING] Parado.')
    }
  }, [])

  return { reconnect, stopPolling }
}
