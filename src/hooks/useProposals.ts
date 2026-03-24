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
  const [isConnected, setIsConnected] = useState(true)

  const fetchProposals = useCallback(async (id: string) => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)

      const { data, error } = await supabase
        .from('tenant_proposals')
        .select(`*,imoveis_captados!inner(landlord_id)`)
        .eq('imoveis_captados.landlord_id', id)
        .order('created_at', { ascending: false })

      clearTimeout(timeoutId)

      if (error) throw error

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

  const { reconnect } = useRealtimeSync({
    table: 'tenant_proposals',
    onDataChange: (payload) => {
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
    },
    onError: (err) => {
      setSyncError(err)
      setIsConnected(false)
    },
  })

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
    isConnected,
    refreshProposals: () => landlordId && fetchProposals(landlordId),
    respondToProposal,
    reconnect,
  }
}
