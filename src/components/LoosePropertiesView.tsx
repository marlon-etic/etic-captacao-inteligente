import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { LoosePropertyCard } from './LoosePropertyCard'
import { ClaimPropertyModal } from './ClaimPropertyModal'
import { CapturedProperty } from '@/types'

export function LoosePropertiesView() {
  const { looseProperties } = useAppStore()
  const [claimProperty, setClaimProperty] = useState<CapturedProperty | null>(null)

  const sortedProperties = useMemo(() => {
    return [...looseProperties].sort((a, b) => {
      const dateA = new Date(a.capturedAt || '').getTime()
      const dateB = new Date(b.capturedAt || '').getTime()
      return dateB - dateA
    })
  }, [looseProperties])

  return (
    <div className="space-y-6">
      {sortedProperties.length === 0 ? (
        <div className="text-center p-12 bg-background border rounded-xl border-dashed">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum imóvel disponível no momento.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProperties.map((property) => (
            <LoosePropertyCard key={property.code} property={property} onClaim={setClaimProperty} />
          ))}
        </div>
      )}

      <ClaimPropertyModal
        isOpen={!!claimProperty}
        property={claimProperty}
        onClose={() => setClaimProperty(null)}
      />
    </div>
  )
}
