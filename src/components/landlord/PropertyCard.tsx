import React from 'react'
import { Property, PropertyPerformance } from '@/types/landlord'
import { Home, Bed, Bath, Car, TrendingUp } from 'lucide-react'

export const PropertyCard = ({
  property,
  performance,
}: {
  property: Property
  performance?: PropertyPerformance
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full">
      <div className="h-40 bg-gray-100 relative shrink-0">
        {property.photoUrl ? (
          <img
            src={property.photoUrl}
            alt={property.address}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Home className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-bold text-gray-800 shadow-sm">
          {property.code}
        </div>
        <div className="absolute bottom-3 left-3 bg-[#1A3A52] text-white px-3 py-1.5 rounded-lg text-sm font-bold shadow-md">
          R$ {property.rent_value?.toLocaleString('pt-BR')}
        </div>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h4 className="font-bold text-gray-900 truncate" title={property.address}>
          {property.address || 'Endereço não informado'}
        </h4>
        <p
          className="text-sm text-gray-500 truncate mt-0.5"
          title={`${property.neighborhood}, ${property.city} - ${property.state}`}
        >
          {property.neighborhood || 'Bairro não informado'}
        </p>

        <div className="flex items-center gap-4 mt-4 text-gray-600 text-sm font-medium">
          <div className="flex items-center gap-1.5">
            <Bed className="w-4 h-4 text-gray-400" /> {property.bedrooms || 0}
          </div>
          <div className="flex items-center gap-1.5">
            <Bath className="w-4 h-4 text-gray-400" /> {property.bathrooms || 0}
          </div>
          <div className="flex items-center gap-1.5">
            <Car className="w-4 h-4 text-gray-400" /> {property.garage_spaces || 0}
          </div>
        </div>

        <div className="mt-auto pt-4">
          {performance ? (
            <div className="border-t border-gray-100 pt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">
                  Receita (Ano)
                </p>
                <p className="font-bold text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  R$ {performance.total_revenue?.toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold mb-1">
                  Ocupação
                </p>
                <p className="font-bold text-blue-600">{performance.months_occupied} meses</p>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 pt-4 text-sm text-gray-400 italic text-center">
              Métricas não disponíveis
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
