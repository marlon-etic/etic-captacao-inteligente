import { useMemo, useState } from 'react'
import { useActiveCampaigns, type CampanhaRow } from '@/hooks/use-active-campaigns'
import { CampanhaCard } from '@/components/campanhas/CampanhaCard'
import { CampanhaDetailsModal } from '@/components/campanhas/CampanhaDetailsModal'
import { Skeleton } from '@/components/ui/skeleton'
import { Megaphone } from 'lucide-react'
import type { Campanha } from '@/services/campanhaService'

export function ActiveCampaignsWidget() {
  const { campanhas } = useActiveCampaigns()
  const [selectedCampanha, setSelectedCampanha] = useState<Campanha | null>(null)
  const [detailsOpen, setDetailsOpen] = useState(false)

  const activeCampanhas = useMemo(
    () => campanhas.filter((c: CampanhaRow) => c.status === 'ativa'),
    [campanhas],
  )

  return (
    <>
      <div className="mb-6 animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black text-[#1A3A52] flex items-center gap-2">
            <Megaphone className="w-5 h-5 text-emerald-600" />
            Campanhas Ativas
          </h2>
        </div>

        {activeCampanhas.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">Nenhuma campanha ativa no momento</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeCampanhas.map((campanha) => (
              <CampanhaCard
                key={campanha.id}
                campanha={campanha as any}
                readOnly
                onClick={(c) => {
                  setSelectedCampanha(c as Campanha)
                  setDetailsOpen(true)
                }}
              />
            ))}
          </div>
        )}
      </div>

      <CampanhaDetailsModal
        campanha={selectedCampanha}
        isOpen={detailsOpen}
        onClose={() => {
          setDetailsOpen(false)
          setSelectedCampanha(null)
        }}
      />
    </>
  )
}

export function ActiveCampaignsWidgetSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Skeleton className="h-6 w-48" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
        ))}
      </div>
    </div>
  )
}
