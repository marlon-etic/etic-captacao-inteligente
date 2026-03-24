import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TenantProposal } from '@/types/landlord'

export const useProposals = (landlordId: string | undefined) => {
  const [proposals, setProposals] = useState<TenantProposal[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(true)

  const subscriptionRef = useRef<any>(null)
  const reconnectCountRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelayMs = useRef(1000)

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
      reconnectDelayMs.current = 1000
      setIsConnected(true)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar propostas'
      console.error('Erro ao buscar propostas:', errorMsg)
      setError(errorMsg)
      setIsConnected(false)

      if (reconnectCountRef.current < maxReconnectAttempts) {
        reconnectCountRef.current++
        const delay = reconnectDelayMs.current
        reconnectDelayMs.current = Math.min(reconnectDelayMs.current * 2, 30000)

        console.log(
          `Tentando reconectar em ${delay}ms (tentativa ${reconnectCountRef.current}/${maxReconnectAttempts})`,
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
        supabase.removeChannel(subscriptionRef.current)
      }

      const channelName = `proposals_${landlordId}_${Date.now()}`

      subscriptionRef.current = supabase
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
            console.log('Real-time update recebido:', payload)

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
          },
        )
        .on('system', { event: 'join' }, () => {
          console.log('✅ Inscrito no canal de real-time')
          setIsConnected(true)
        })
        .on('system', { event: 'error' }, (err) => {
          console.error('❌ Erro no canal de real-time:', err)
          setIsConnected(false)
        })
        .subscribe(async (status) => {
          console.log('Status da subscription:', status)

          if (status === 'CHANNEL_ERROR') {
            setIsConnected(false)
            setTimeout(() => setupSubscriptions(landlordId), 3000)
          } else if (status === 'SUBSCRIBED') {
            setIsConnected(true)
          }
        })

      return () => {
        if (subscriptionRef.current) {
          supabase.removeChannel(subscriptionRef.current)
        }
      }
    } catch (err) {
      console.error('Erro ao setup subscriptions:', err)
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
