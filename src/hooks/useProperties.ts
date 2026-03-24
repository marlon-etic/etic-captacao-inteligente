import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Property, PropertyPerformance } from '@/types/landlord'
import { fetchPropertyDetailsFromVistaSoft } from '@/services/vistaSoftService'

export const useProperties = (landlordId: string | undefined) => {
  const [properties, setProperties] = useState<Property[]>([])
  const [propertyPerformance, setPropertyPerformance] = useState<Map<string, PropertyPerformance>>(
    new Map(),
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProperties = async (id: string) => {
    try {
      setLoading(true)

      const { data, error } = await supabase
        .from('imoveis_captados')
        .select('*')
        .eq('landlord_id', id)
        .order('created_at', { ascending: false })

      if (error) throw error

      const mappedProperties: Property[] = (data || []).map((p: any) => ({
        id: p.id,
        landlord_id: p.landlord_id,
        code: p.codigo_imovel,
        address: p.endereco,
        city: '',
        state: '',
        zipcode: '',
        rent_value: p.preco || p.valor || 0,
        bedrooms: p.dormitorios || 0,
        bathrooms: 0,
        garage_spaces: p.vagas || 0,
        created_at: p.created_at,
        updated_at: p.updated_at,
        neighborhood: p.localizacao_texto,
        photoUrl: p.fotos && p.fotos.length > 0 ? p.fotos[0] : undefined,
        status: p.status_captacao,
      }))

      setProperties(mappedProperties)

      if (mappedProperties.length > 0) {
        await fetchPropertyPerformance(mappedProperties.map((p) => p.id))
        enrichPropertiesWithVistaSoftData(mappedProperties)
      }

      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar propriedades')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (landlordId) {
      fetchProperties(landlordId)
    } else {
      setProperties([])
      setLoading(false)
    }
  }, [landlordId])

  const enrichPropertiesWithVistaSoftData = async (props: Property[]) => {
    try {
      const enrichedProperties = await Promise.all(
        props.map(async (property) => {
          if (!property.code) return property
          try {
            const vistaSoftData = await fetchPropertyDetailsFromVistaSoft(property.code)
            return { ...property, ...vistaSoftData }
          } catch {
            return property
          }
        }),
      )
      setProperties(enrichedProperties)
    } catch (err) {
      console.error('Erro ao enriquecer dados da VistaSoft:', err)
    }
  }

  const fetchPropertyPerformance = async (propertyIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('property_performance')
        .select('*')
        .in('property_id', propertyIds)

      if (error) throw error

      const performanceMap = new Map()
      data?.forEach((perf: any) => {
        performanceMap.set(perf.property_id, perf)
      })

      setPropertyPerformance(performanceMap)
    } catch (err) {
      console.error('Erro ao carregar performance:', err)
    }
  }

  return {
    properties,
    propertyPerformance,
    loading,
    error,
    refreshProperties: () => landlordId && fetchProperties(landlordId),
  }
}
