import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TenantProposal } from '@/types/landlord'
import { useRealtimeSync } from './useRealtimeSync'

export const useProposals = (landlordId: string | undefined) => {
  const [proposals, setProposals] = useState<TenantProposal[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [syncError, setSyncError] = useState<Error | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [isConnected, setIsConnected] = useState(true)

  const fetchProposals = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const { data, error: err } = await supabase
        .from('tenant_proposals')
        .select(`*,imoveis_captados!inner(landlord_id)`)
        .eq('imoveis_captados.landlord_id', id)
        .order('created_at', { ascending: false })

      clearTimeout(timeoutId)

      if (err) throw err

      const mapped = (data || []).map((p) => ({
        ...p,
        imoveis_captados: undefined,
      })) as TenantProposal[]

      setProposals(mapped)
      setPendingCount(mapped.filter((p) => p.status === 'pending').length || 0)
      setIsConnected(true)
      setSyncError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar propostas'
      console.error('Erro ao buscar propostas:', errorMsg)
      setError(errorMsg)
      setIsConnected(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (landlordId) {
      fetchProposals(landlordId)
    }
  }, [landlordId, fetchProposals])

  const { reconnect, stopPolling } = useRealtimeSync({
    table: 'tenant_proposals',
    enablePollingFallback: true,
    pollingFn: async () => {
      if (landlordId) await fetchProposals(landlordId)
      return null // Retorna null para evitar loop genérico de updates via hook e reusar o estado de fetchProposals
    },
    onDataChange: (payload) => {
      console.log('[useProposals] onDataChange chamado:', payload)
      setProposals((prev) => {
        let updated = [...prev]

        if (payload.eventType === 'INSERT') {
          if (!updated.some((p) => p.id === payload.new.id)) {
            updated = [payload.new as TenantProposal, ...updated]
          }
        } else if (payload.eventType === 'UPDATE') {
          updated = updated.map((p) =>
            p.id === payload.new.id ? ({ ...p, ...payload.new } as TenantProposal) : p,
          )
        } else if (payload.eventType === 'DELETE') {
          updated = updated.filter((p) => p.id !== payload.old.id)
        }

        setPendingCount(updated.filter((p) => p.status === 'pending').length)
        return updated
      })

      setIsConnected(true)
      setSyncError(null)
      setRetryCount(0)
    },
    onError: (err) => {
      console.error('[useProposals] Erro capturado:', err)
      setSyncError(err)
      setRetryCount((prev) => prev + 1)
      setIsConnected(false)
    },
    maxRetries: 3,
    initialBackoff: 2000,
  })

  const handleManualRetry = useCallback(() => {
    console.log('[useProposals] Retry manual acionado')
    setRetryCount(0)
    setSyncError(null)
    stopPolling()
    reconnect()
  }, [reconnect, stopPolling])

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

      setProposals((prev) => {
        const updated = prev.map((p) =>
          p.id === proposalId
            ? { ...p, status, response_date: new Date().toISOString(), response_message: message }
            : p,
        )
        setPendingCount(updated.filter((p) => p.status === 'pending').length)
        return updated
      })

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
    syncError,
    retryCount,
    isConnected,
    refreshProposals: () => landlordId && fetchProposals(landlordId),
    respondToProposal,
    reconnect: handleManualRetry,
  }
}
