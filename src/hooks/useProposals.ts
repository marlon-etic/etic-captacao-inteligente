import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { TenantProposal } from '@/types/landlord'

export const useProposals = (landlordId: string | undefined) => {
  const [proposals, setProposals] = useState<TenantProposal[]>([])
  const [pendingCount, setPendingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProposals = async (id: string) => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('tenant_proposals')
        .select(`
          *,
          imoveis_captados!inner(landlord_id)
        `)
        .eq('imoveis_captados.landlord_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mapped = (data || []).map((p) => ({
        ...p,
        imoveis_captados: undefined,
      })) as TenantProposal[]

      setProposals(mapped)
      setPendingCount(mapped.filter((p) => p.status === 'pending').length)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar propostas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (landlordId) {
      fetchProposals(landlordId)

      const subscription = supabase
        .channel(`proposals_for_landlord_${landlordId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tenant_proposals',
          },
          () => {
            fetchProposals(landlordId)
          },
        )
        .subscribe()

      return () => {
        supabase.removeChannel(subscription)
      }
    }
  }, [landlordId])

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
    refreshProposals: () => landlordId && fetchProposals(landlordId),
    respondToProposal,
  }
}
