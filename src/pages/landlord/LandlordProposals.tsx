import React from 'react'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { useProposals } from '@/hooks/useProposals'
import { ProposalCard } from '@/components/landlord/ProposalCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { FileText } from 'lucide-react'

export default function LandlordProposals() {
  const { landlordProfile } = useLandlordAuth()
  const { proposals, pendingCount, loading, respondToProposal } = useProposals(landlordProfile?.id)

  if (loading) return <LoadingSpinner />

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1A3A52] tracking-tight">
            Propostas de Locação
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Analise e responda às propostas enviadas por interessados.
          </p>
        </div>
        <div className="flex gap-2">
          <div className="bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
            Total: {proposals.length}
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-100 text-yellow-800 border border-yellow-200 px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
              Pendentes: {pendingCount}
            </div>
          )}
        </div>
      </div>

      {proposals.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
          <FileText className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium text-lg">
            Nenhuma proposta recebida até o momento.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {proposals.map((proposal) => (
            <ProposalCard key={proposal.id} proposal={proposal} onRespond={respondToProposal} />
          ))}
        </div>
      )}
    </div>
  )
}
