import React, { useMemo } from 'react'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { useProperties } from '@/hooks/useProperties'
import { useProposals } from '@/hooks/useProposals'
import { PropertyCard } from '@/components/landlord/PropertyCard'
import { ProposalCard } from '@/components/landlord/ProposalCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { DashboardStats } from '@/types/landlord'
import { Building, Key, Bell, DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LandlordDashboard() {
  const { landlordProfile } = useLandlordAuth()
  const {
    properties,
    propertyPerformance,
    loading: propsLoading,
  } = useProperties(landlordProfile?.id)
  const {
    proposals,
    pendingCount,
    loading: proposalsLoading,
    respondToProposal,
  } = useProposals(landlordProfile?.id)

  const stats: DashboardStats = useMemo(() => {
    const occupiedProperties = properties.filter(
      (p) => p.status === 'fechado' || p.status === 'rented',
    ).length
    const totalRevenue = properties.reduce((sum, p) => sum + (p.rent_value || 0), 0)
    const avgScore =
      proposals.length > 0
        ? proposals.reduce((sum, p) => sum + p.tenant_score, 0) / proposals.length
        : 0

    return {
      total_properties: properties.length,
      occupied_properties: occupiedProperties,
      pending_proposals: pendingCount,
      total_revenue: totalRevenue,
      average_score: Math.round(avgScore),
    }
  }, [properties, proposals, pendingCount])

  if (propsLoading || proposalsLoading) return <LoadingSpinner />

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto animate-fade-in-up">
      <h2 className="text-2xl md:text-3xl font-black mb-6 text-[#1A3A52] tracking-tight">
        Visão Geral
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Total de Imóveis
            </p>
            <p className="text-3xl font-black text-[#1A3A52] mt-1">{stats.total_properties}</p>
          </div>
          <div className="bg-blue-50 p-3.5 rounded-xl">
            <Building className="w-6 h-6 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Alugados/Fechados
            </p>
            <p className="text-3xl font-black text-[#1A3A52] mt-1">{stats.occupied_properties}</p>
          </div>
          <div className="bg-green-50 p-3.5 rounded-xl">
            <Key className="w-6 h-6 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Propostas Pendentes
            </p>
            <p className="text-3xl font-black text-[#1A3A52] mt-1">{stats.pending_proposals}</p>
          </div>
          <div className="bg-yellow-50 p-3.5 rounded-xl">
            <Bell className="w-6 h-6 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">
              Renda Base (Mês)
            </p>
            <p className="text-2xl md:text-3xl font-black text-[#1A3A52] mt-1 tracking-tight">
              R$ {stats.total_revenue.toLocaleString('pt-BR')}
            </p>
          </div>
          <div className="bg-purple-50 p-3.5 rounded-xl">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {pendingCount > 0 && (
        <div className="mb-10">
          <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-500" />
              Propostas Aguardando Resposta
            </h3>
            <Link
              to="/landlord/proposals"
              className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
            >
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {proposals
              .filter((p) => p.status === 'pending')
              .slice(0, 4)
              .map((proposal) => (
                <ProposalCard key={proposal.id} proposal={proposal} onRespond={respondToProposal} />
              ))}
          </div>
        </div>
      )}

      <div>
        <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-500" />
            Destaques dos Seus Imóveis
          </h3>
          <Link
            to="/landlord/properties"
            className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Ver todos
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.slice(0, 4).map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              performance={propertyPerformance.get(property.id)}
            />
          ))}
        </div>
        {properties.length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
            <Building className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-gray-600 font-medium">Nenhum imóvel cadastrado ainda.</p>
            <p className="text-gray-400 text-sm mt-1">
              Seus imóveis sincronizados aparecerão aqui.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
