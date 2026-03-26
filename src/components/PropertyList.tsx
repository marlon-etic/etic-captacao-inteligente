import { useState, useMemo } from 'react'
import { useIsMobile } from '@/hooks/use-mobile'
import { useSupabaseProperties } from '@/hooks/use-supabase-properties'
import { PropertyListMobile } from './PropertyListMobile'
import { PropertyListDesktop } from './PropertyListDesktop'
import { PropertyFilters } from './PropertyFilters'
import { PropertyDetailsModal } from './PropertyDetailsModal'
import { Skeleton } from '@/components/ui/skeleton'

interface Props {
  initialType?: 'Venda' | 'Aluguel'
}

export function PropertyList({ initialType }: Props) {
  const isMobile = useIsMobile()
  const { properties, loading } = useSupabaseProperties()
  const [filters, setFilters] = useState({
    bairro: '',
    minValor: '',
    maxValor: '',
    dormitorios: '',
    vagas: '',
    tipo: initialType || 'Todos',
  })

  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  const filteredProperties = useMemo(() => {
    return properties.filter((p) => {
      if (filters.tipo !== 'Todos' && p.tipo !== filters.tipo && p.tipo !== 'Ambos') return false
      if (filters.bairro && !p.endereco?.toLowerCase().includes(filters.bairro.toLowerCase()))
        return false
      if (filters.minValor && p.preco < Number(filters.minValor)) return false
      if (filters.maxValor && p.preco > Number(filters.maxValor)) return false
      if (filters.dormitorios && (p.dormitorios || 0) < Number(filters.dormitorios)) return false
      if (filters.vagas && (p.vagas || 0) < Number(filters.vagas)) return false
      return true
    })
  }, [properties, filters])

  if (loading && properties.length === 0) {
    return (
      <div className="space-y-4 w-full">
        <Skeleton className="h-[120px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in w-full pb-8">
      <PropertyFilters filters={filters} onChange={setFilters} />

      {isMobile ? (
        <PropertyListMobile properties={filteredProperties} onSelect={setSelectedProperty} />
      ) : (
        <PropertyListDesktop properties={filteredProperties} onSelect={setSelectedProperty} />
      )}

      <PropertyDetailsModal property={selectedProperty} onClose={() => setSelectedProperty(null)} />
    </div>
  )
}
