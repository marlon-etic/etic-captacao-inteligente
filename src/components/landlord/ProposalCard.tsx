import React, { useState } from 'react'
import { TenantProposal } from '@/types/landlord'
import { ProposalModal } from '@/components/landlord/ProposalModal'
import { TenantScoreDisplay } from '@/components/landlord/TenantScoreDisplay'
import { triggerProposalResponse } from '@/services/n8nService'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'

interface ProposalCardProps {
  proposal: TenantProposal
  onRespond?: (
    proposalId: string,
    status: 'accepted' | 'rejected',
    message?: string,
  ) => Promise<boolean>
}

export const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onRespond }) => {
  const { landlordProfile } = useLandlordAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isResponding, setIsResponding] = useState(false)
  const [respondingWith, setRespondingWith] = useState<'accepted' | 'rejected' | null>(null)

  const handleRespondClick = (status: 'accepted' | 'rejected') => {
    setRespondingWith(status)
    setIsModalOpen(true)
  }

  const handleConfirmResponse = async (message: string) => {
    if (respondingWith && onRespond) {
      setIsResponding(true)
      const success = await onRespond(proposal.id, respondingWith, message)
      setIsResponding(false)

      if (success && landlordProfile?.id) {
        await triggerProposalResponse(landlordProfile.id, proposal.id, respondingWith, message)
      }
    }
    setIsModalOpen(false)
    setRespondingWith(null)
  }

  const isExpired = new Date(proposal.created_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  return (
    <>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
        <div className="bg-blue-50 p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-start gap-4">
            <div className="min-w-0 flex-1">
              <h4 className="text-lg font-bold text-gray-900 truncate" title={proposal.tenant_name}>
                {proposal.tenant_name}
              </h4>
              <p className="text-sm text-gray-600 truncate">{proposal.tenant_email}</p>
            </div>
            <TenantScoreDisplay score={proposal.tenant_score} />
          </div>
        </div>

        <div className="p-4 space-y-4 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                Telefone
              </p>
              <a
                href={`tel:${proposal.tenant_phone}`}
                className="text-blue-600 font-medium hover:underline text-sm truncate block"
              >
                {proposal.tenant_phone}
              </a>
            </div>
            <div>
              <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                Renda (Mês)
              </p>
              <p className="text-green-600 font-bold text-sm">
                R$ {proposal.monthly_income?.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-1">
              Previsão Mudança
            </p>
            <p className="font-bold text-gray-900 text-sm">
              {proposal.proposed_move_date
                ? new Date(proposal.proposed_move_date).toLocaleDateString('pt-BR')
                : 'A Combinar'}
            </p>
          </div>

          <div>
            <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-1">
              Mensagem
            </p>
            <p className="text-gray-700 text-sm italic bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
              "{proposal.message || 'Sem mensagem do interessado.'}"
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <span
              className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                proposal.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : proposal.status === 'accepted'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
              }`}
            >
              {proposal.status === 'pending'
                ? 'Aguardando Resposta'
                : proposal.status === 'accepted'
                  ? 'Aceita'
                  : 'Recusada'}
            </span>
            {isExpired && proposal.status === 'pending' && (
              <span className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-bold">
                Expirada
              </span>
            )}
          </div>
        </div>

        {proposal.status === 'pending' && !isExpired && (
          <div className="bg-gray-50 px-4 py-3 flex gap-3 border-t border-gray-100 mt-auto">
            <button
              onClick={() => handleRespondClick('accepted')}
              disabled={isResponding}
              className="flex-1 bg-green-600 text-white font-bold py-2.5 rounded-lg hover:bg-green-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isResponding && respondingWith === 'accepted' ? 'Processando...' : 'Aceitar'}
            </button>
            <button
              onClick={() => handleRespondClick('rejected')}
              disabled={isResponding}
              className="flex-1 bg-red-600 text-white font-bold py-2.5 rounded-lg hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isResponding && respondingWith === 'rejected' ? 'Processando...' : 'Recusar'}
            </button>
          </div>
        )}
      </div>

      {isModalOpen && respondingWith && (
        <ProposalModal
          isOpen={isModalOpen}
          title={respondingWith === 'accepted' ? 'Aceitar Proposta' : 'Recusar Proposta'}
          proposalId={proposal.id}
          action={respondingWith}
          onConfirm={handleConfirmResponse}
          onClose={() => {
            setIsModalOpen(false)
            setRespondingWith(null)
          }}
        />
      )}
    </>
  )
}
