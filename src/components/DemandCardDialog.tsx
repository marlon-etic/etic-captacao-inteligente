import { useState } from 'react'
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog'
import { ExpandableDemandCardSDR } from './ExpandableDemandCardSDR'
import { DemandDetailsModal } from './DemandDetailsModal'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { X } from 'lucide-react'

function mapDemandForModal(demand: SupabaseDemand) {
  return {
    id: demand.id,
    clientName: demand.nome_cliente,
    type: demand.tipo,
    location: demand.bairros,
    minBudget: demand.valor_minimo,
    maxBudget: demand.valor_maximo,
    bedrooms: demand.dormitorios,
    bathrooms: 0,
    parkingSpots: demand.vagas_estacionamento,
    timeframe: demand.nivel_urgencia,
    description: demand.observacoes,
    status: demand.status_demanda === 'aberta' ? 'Pendente' : 'Perdida',
    createdAt: demand.created_at,
    isPrioritized: demand.is_prioritaria,
    createdBy: demand.sdr_id || demand.corretor_id || '',
    capturedProperties: (demand.imoveis_captados || []).map((i: any) => ({
      id: i.id,
      code: i.codigo_imovel,
      value: i.preco,
      neighborhood: i.endereco,
      capturedAt: i.created_at,
      status: i.status_captacao,
      captador_id: i.user_captador_id,
      etapa_funil: i.etapa_funil || 'capturado',
      data_visita: i.data_visita,
      data_fechamento: i.data_fechamento,
      dormitorios: i.dormitorios,
      vagas: i.vagas,
      observacoes: i.observacoes,
    })),
  } as any
}

export function DemandCardDialog({
  demand,
  open,
  onOpenChange,
}: {
  demand: SupabaseDemand | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [detailsDemand, setDetailsDemand] = useState<SupabaseDemand | null>(null)

  return (
    <>
      <Dialog open={open && !!demand} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[640px] max-h-[92vh] overflow-y-auto p-4 sm:p-6 rounded-[16px]">
          <DialogClose className="absolute right-4 top-4 z-[60] rounded-full bg-white/90 hover:bg-gray-100 p-1.5 shadow-sm transition-colors">
            <X className="w-5 h-5 text-[#1A3A52]" />
          </DialogClose>
          {demand && (
            <div className="pt-2">
              <ExpandableDemandCardSDR
                demand={demand}
                onAction={(action, d) => {
                  if (action === 'details') setDetailsDemand(d)
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <DemandDetailsModal
        open={!!detailsDemand}
        onOpenChange={(o) => !o && setDetailsDemand(null)}
        demand={detailsDemand ? mapDemandForModal(detailsDemand) : null}
      />
    </>
  )
}
