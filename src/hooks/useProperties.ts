import { useEffect, useState, useRef } from 'react'
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
  const [isConnected, setIsConnected] = useState(true)

  const retryCountRef = useRef(0)
  const maxRetries = 3

  useEffect(() => {
    if (landlordId) {
      fetchProperties(landlordId)
    }
  }, [landlordId])

  const fetchProperties = async (id: string, retryCount = 0) => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 20000)

      const { data, error } = await supabase
        .from('imoveis_captados')
        .select('*')
        .eq('landlord_id', id)
        .order('created_at', { ascending: false })

      clearTimeout(timeoutId)

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
        await enrichPropertiesWithVistaSoftData(mappedProperties)
        await fetchPropertyPerformance(mappedProperties.map((p) => p.id))
      }

      setError(null)
      setIsConnected(true)
      retryCountRef.current = 0
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Erro ao carregar propriedades'
      console.error('Erro ao buscar propriedades:', errorMsg)
      setError(errorMsg)
      setIsConnected(false)

      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000)
        console.log(`Retentando em ${delay}ms (tentativa ${retryCount + 1}/${maxRetries})`)

        setTimeout(() => {
          fetchProperties(id, retryCount + 1)
        }, delay)
      }
    } finally {
      setLoading(false)
    }
  }

  const enrichPropertiesWithVistaSoftData = async (props: Property[]) => {
    try {
      const batchSize = 5
      const enrichedProperties = [...props]

      for (let i = 0; i < props.length; i += batchSize) {
        const batch = props.slice(i, i + batchSize)

        await Promise.all(
          batch.map(async (property) => {
            if (!property.code) return
            try {
              const vistaSoftData = await fetchPropertyDetailsFromVistaSoft(property.code)
              const index = enrichedProperties.findIndex((p) => p.id === property.id)
              if (index !== -1) {
                enrichedProperties[index] = { ...enrichedProperties[index], ...vistaSoftData }
              }
            } catch (err) {
              console.error(`Erro ao enriquecer propriedade ${property.code}:`, err)
            }
          }),
        )
      }

      setProperties(enrichedProperties)
    } catch (err) {
      console.error('Erro ao enriquecer dados da VistaSoft:', err)
    }
  }

  const fetchPropertyPerformance = async (propertyIds: string[]) => {
    try {
      if (propertyIds.length === 0) return

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
    isConnected,
    refreshProperties: () => landlordId && fetchProperties(landlordId),
  }
}
