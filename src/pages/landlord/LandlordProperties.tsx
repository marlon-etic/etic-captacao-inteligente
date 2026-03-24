import React from 'react'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { useProperties } from '@/hooks/useProperties'
import { PropertyCard } from '@/components/landlord/PropertyCard'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { Building } from 'lucide-react'

export default function LandlordProperties() {
  const { landlordProfile } = useLandlordAuth()
  const { properties, propertyPerformance, loading } = useProperties(landlordProfile?.id)

  if (loading) return <LoadingSpinner />

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto animate-fade-in-up">
      <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-[#1A3A52] tracking-tight">
            Meus Imóveis
          </h2>
          <p className="text-gray-500 text-sm font-medium mt-1">
            Acompanhe todos os seus imóveis e sua performance.
          </p>
        </div>
        <div className="bg-[#1A3A52] text-white px-4 py-2 rounded-lg font-bold text-sm shadow-sm">
          {properties.length} {properties.length === 1 ? 'Imóvel' : 'Imóveis'}
        </div>
      </div>

      {properties.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center">
          <Building className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-gray-600 font-medium text-lg">Nenhum imóvel cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {properties.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              performance={propertyPerformance.get(property.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
