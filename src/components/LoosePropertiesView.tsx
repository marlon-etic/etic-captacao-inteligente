import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'
import { LoosePropertyCard } from './LoosePropertyCard'
import { ClaimPropertyModal } from './ClaimPropertyModal'
import { CapturedProperty } from '@/types'

export function LoosePropertiesView() {
  const { looseProperties, currentUser } = useAppStore()
  const [claimProperty, setClaimProperty] = useState<CapturedProperty | null>(null)
  const [ignoredCodes, setIgnoredCodes] = useState<string[]>([])

  const sortedProperties = useMemo(() => {
    return [...looseProperties]
      .filter((p) => {
        if (p.status_reivindicacao && p.status_reivindicacao !== 'disponivel') return false
        if (ignoredCodes.includes(p.code)) return false

        if (currentUser?.role === 'admin' || currentUser?.role === 'gestor') return true
        if (currentUser?.role === 'captador') return p.captador_id === currentUser?.id

        if (p.propertyType === 'Aluguel') {
          return (
            currentUser?.role === 'sdr' ||
            (currentUser?.role === 'corretor' &&
              currentUser?.tipos_demanda_solicitados?.includes('locacao'))
          )
        } else if (p.propertyType === 'Venda') {
          return currentUser?.role === 'corretor'
        }
        return true
      })
      .sort((a, b) => {
        const dateA = new Date(a.capturedAt || '').getTime()
        const dateB = new Date(b.capturedAt || '').getTime()
        return dateB - dateA
      })
  }, [looseProperties, currentUser, ignoredCodes])

  return (
    <div className="space-y-6">
      {sortedProperties.length === 0 ? (
        <div className="text-center p-12 bg-background border rounded-xl border-dashed">
          <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">Nenhum imóvel disponível encontrado.</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {sortedProperties.map((property) => (
            <LoosePropertyCard
              key={property.code}
              property={property}
              onClaim={setClaimProperty}
              onIgnore={() => setIgnoredCodes((prev) => [...prev, property.code])}
            />
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
