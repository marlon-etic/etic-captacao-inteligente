import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TenantProposal } from '@/types/landlord'

const RETRY_CONFIG = {
  maxAttempts: 8,
  initialDelay: 500,
  maxDelay: 60000,
  backoffMultiplier: 1.5,
}

const SUBSCRIPTION_CONFIG = {
  reconnectInterval: 2000,
  maxReconnectAttempts: 10,
  heartbeatInterval: 5000,
}

export const useProposals = (landlordId: string | undefined) => {
  const [proposals, setProposals] = useState<TenantProposal[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  const subscriptionRef = useRef<any>(null)
  const reconnectCountRef = useRef(0)
  const reconnectDelayMs = useRef(RETRY_CONFIG.initialDelay)

  useEffect(() => {
    if (landlordId) {
      fetchProposals(landlordId)
      const cleanup = setupSubscriptions(landlordId)
      return () => {
        cleanup()
      }
    }
  }, [landlordId])

  const fetchProposals = async (landlordId: string) => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const { data, error } = await supabase
        .from('tenant_proposals')
        .select(`*,imoveis_captados!inner(landlord_id)`)
        .eq('imoveis_captados.landlord_id', landlordId)
        .order('created_at', { ascending: false })

      clearTimeout(timeoutId)

      if (error) throw error

      const mapped = (data || []).map((p) => ({
        ...p,
        imoveis_captados: undefined,
      })) as TenantProposal[]

      setProposals(mapped)
      const pending = mapped.filter((p) => p.status === 'pending').length || 0
      setPendingCount(pending)

      reconnectCountRef.current = 0
      reconnectDelayMs.current = RETRY_CONFIG.initialDelay
      setIsConnected(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar propostas'
      console.error('Erro ao buscar propostas:', errorMsg)
      setError(errorMsg)
      setIsConnected(false)

      if (reconnectCountRef.current < RETRY_CONFIG.maxAttempts) {
        reconnectCountRef.current++
        const delay = reconnectDelayMs.current
        reconnectDelayMs.current = Math.min(
          reconnectDelayMs.current * RETRY_CONFIG.backoffMultiplier,
          RETRY_CONFIG.maxDelay,
        )

        console.log(
          `Tentando reconectar em ${delay}ms (tentativa ${reconnectCountRef.current}/${RETRY_CONFIG.maxAttempts})`,
        )

        setTimeout(() => {
          fetchProposals(landlordId)
        }, delay)
      }
    } finally {
      setLoading(false)
    }
  }

  const setupSubscriptions = (landlordId: string) => {
    try {
      if (subscriptionRef.current) {
        console.log('🧹 Removendo subscription anterior...')
        supabase.removeChannel(subscriptionRef.current)
      }

      const channelName = `proposals_${landlordId}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      console.log(`📡 Criando subscription: ${channelName}`)

      const subscription = supabase
        .channel(channelName, {
          config: {
            broadcast: { self: true },
            presence: { key: landlordId },
          },
        })
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'tenant_proposals' },
          (payload) => {
            console.log('✅ Real-time update recebido:', payload.eventType)

            if (payload.eventType === 'INSERT') {
              setProposals((prev) => [payload.new as TenantProposal, ...prev])
              setPendingCount((prev) => prev + 1)
            } else if (payload.eventType === 'UPDATE') {
              setProposals((prev) =>
                prev.map((p) =>
                  p.id === (payload.new as TenantProposal).id
                    ? ({ ...p, ...payload.new } as TenantProposal)
                    : p,
                ),
              )
              const wasChanged =
                (payload.old as TenantProposal).status !== (payload.new as TenantProposal).status
              if (wasChanged && (payload.new as TenantProposal).status !== 'pending') {
                setPendingCount((prev) => Math.max(0, prev - 1))
              }
            } else if (payload.eventType === 'DELETE') {
              setProposals((prev) =>
                prev.filter((p) => p.id !== (payload.old as TenantProposal).id),
              )
              if ((payload.old as TenantProposal).status === 'pending') {
                setPendingCount((prev) => Math.max(0, prev - 1))
              }
            }

            setIsConnected(true)
            reconnectCountRef.current = 0
          },
        )
        .on('system', { event: 'subscribe' }, () => {
          console.log('🟢 SUBSCRIBED ao canal')
          setIsConnected(true)
        })
        .on('system', { event: 'unsubscribe' }, () => {
          console.log('🔴 UNSUBSCRIBED do canal')
          setIsConnected(false)
        })
        .on('system', { event: 'error' }, (err) => {
          console.error('❌ Erro no canal:', err)
          setIsConnected(false)

          if (reconnectCountRef.current < SUBSCRIPTION_CONFIG.maxReconnectAttempts) {
            reconnectCountRef.current++
            const delay = SUBSCRIPTION_CONFIG.reconnectInterval * reconnectCountRef.current
            console.log(`⏳ Reconectando em ${delay}ms (tentativa ${reconnectCountRef.current})`)

            setTimeout(() => {
              setupSubscriptions(landlordId)
            }, delay)
          }
        })

      subscriptionRef.current = subscription

      subscription.subscribe(async (status) => {
        console.log(`📊 Status subscription: ${status}`)

        if (status === 'SUBSCRIBED') {
          console.log('✅ Conectado ao realtime')
          setIsConnected(true)
          reconnectCountRef.current = 0
        } else if (status === 'CHANNEL_ERROR' || status === 'CHANNEL_FAILED') {
          console.error('❌ Erro na conexão:', status)
          setIsConnected(false)

          if (reconnectCountRef.current < SUBSCRIPTION_CONFIG.maxReconnectAttempts) {
            reconnectCountRef.current++
            const delay =
              SUBSCRIPTION_CONFIG.reconnectInterval * Math.pow(1.5, reconnectCountRef.current)
            console.log(`⏳ Reconectando em ${delay}ms...`)

            setTimeout(
              () => {
                setupSubscriptions(landlordId)
              },
              Math.min(delay, 30000),
            )
          }
        }
      })

      return () => {
        console.log('🧹 Limpando subscription...')
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current)
        }
      }
    } catch (err) {
      console.error('❌ Erro ao setup subscriptions:', err)
      setIsConnected(false)
      return () => {}
    }
  }

  const respondToProposal = async (
    proposalId: string,
    status: 'accepted' | 'rejected',
    message?: string,
  ) => {
    try {
      const { error } = await supabase
        .from('tenant_proposals')
        .update({
          status,
          response_date: new Date().toISOString(),
          response_message: message,
        })
        .eq('id', proposalId)

      if (error) throw error

      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId
            ? { ...p, status, response_date: new Date().toISOString(), response_message: message }
            : p,
        ),
      )

      if (status !== 'pending') {
        setPendingCount((prev) => Math.max(0, prev - 1))
      }

      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao responder proposta')
      return false
    }
  }

  return {
    proposals,
    pendingCount,
    loading,
    error,
    isConnected,
    refreshProposals: () => landlordId && fetchProposals(landlordId),
    respondToProposal,
  }
}
