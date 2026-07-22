import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, MapPin, DollarSign } from 'lucide-react'

interface Props {
  negotiation: any
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NegotiationDetailsModal({ negotiation, open, onOpenChange }: Props) {
  if (!negotiation) return null

  const property = negotiation.imovel_demand_match?.imoveis_captados
  const isNegotiated = negotiation.negotiation_status === 'negotiated'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-white max-h-[90vh] overflow-y-auto z-[1200]">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-[#1A3A52]">
            Detalhes da Negociação
          </DialogTitle>
          <DialogDescription>Resumo da negociação registrada.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Data</p>
              <p className="font-bold text-gray-800">
                {format(
                  new Date(negotiation.negotiation_date || negotiation.created_at),
                  'dd/MM/yyyy HH:mm',
                )}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                Status
              </p>
              <Badge
                className={
                  isNegotiated
                    ? 'bg-emerald-100 text-emerald-800 border-none'
                    : 'bg-red-100 text-red-800 border-none'
                }
              >
                {isNegotiated ? 'Negócio Fechado' : 'Falhou'}
              </Badge>
            </div>
          </div>

          {property && (
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">
                  Imóvel
                </p>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="font-medium text-gray-700">
                    {property.endereco || property.localizacao_texto || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{property.codigo_imovel || 'S/Código'}</Badge>
                <Badge variant="outline">{property.tipo_imovel || 'N/A'}</Badge>
                {property.preco && (
                  <Badge variant="outline" className="text-emerald-600">
                    <DollarSign className="w-3 h-3 mr-1" />
                    R$ {property.preco}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {negotiation.notes && (
            <div>
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-2">
                Observações
              </p>
              <p className="text-sm text-gray-700 bg-blue-50/50 p-4 rounded-md border border-blue-100 leading-relaxed whitespace-pre-wrap">
                {negotiation.notes}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {isNegotiated ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            ) : (
              <XCircle className="w-5 h-5 text-red-500" />
            )}
            <span className="font-bold text-gray-700">
              {isNegotiated ? 'Negociação concluída com sucesso' : 'Negociação não teve êxito'}
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
