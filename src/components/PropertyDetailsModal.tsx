import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { MapPin, User, Calendar, FileText } from 'lucide-react'

interface Props {
  property: any
  onClose: () => void
}

export function PropertyDetailsModal({ property, onClose }: Props) {
  if (!property) return null
  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <Dialog open={!!property} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg rounded-2xl p-0 overflow-hidden bg-white">
        <DialogHeader className="p-5 bg-slate-50 border-b border-gray-100">
          <DialogTitle className="flex items-center justify-between text-xl font-black text-[#1A3A52]">
            <span>Detalhes do Imóvel</span>
            <Badge className="bg-[#1A3A52] px-3 py-1 shadow-sm text-sm">
              {property.codigo_imovel}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Header Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
              <p className="text-[11px] text-emerald-600 font-black uppercase tracking-wider mb-1">
                Valor
              </p>
              <p className="text-2xl font-black text-emerald-700 tracking-tight">
                {formatCurrency(property.preco)}
              </p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
              <p className="text-[11px] text-blue-600 font-black uppercase tracking-wider mb-1">
                Tipo
              </p>
              <p className="text-xl font-black text-blue-700 flex items-center gap-2 mt-1">
                {property.tipo === 'Aluguel' ? '🏠' : '🏢'} {property.tipo}
              </p>
            </div>
          </div>

          {/* Main Info */}
          <div className="space-y-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
            <div className="flex gap-3">
              <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                  Localização
                </p>
                <p className="text-sm font-bold text-[#1A3A52] leading-relaxed mt-0.5">
                  {property.endereco}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                  Data de Captação
                </p>
                <p className="text-sm font-bold text-[#1A3A52] mt-0.5">
                  {new Date(property.created_at).toLocaleDateString('pt-BR')} às{' '}
                  {new Date(property.created_at).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-3 border-y border-gray-100 py-5">
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Dormitórios</p>
              <p className="text-2xl font-black text-[#1A3A52]">{property.dormitorios || 0}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Vagas</p>
              <p className="text-2xl font-black text-[#1A3A52]">{property.vagas || 0}</p>
            </div>
            <div className="flex flex-col items-center justify-center p-3 bg-white border border-gray-100 rounded-xl shadow-sm text-center">
              <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Captador</p>
              <p className="text-sm font-black text-[#1A3A52] mt-1 line-clamp-1 break-all">
                {property.captador_nome?.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Demand Linked */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <User className="w-4 h-4 text-gray-400" />
              <p className="text-[11px] text-gray-500 font-black uppercase tracking-wider">
                Demanda Vinculada
              </p>
            </div>
            {property.demanda ? (
              <div className="bg-slate-50 p-4 rounded-xl border-[2px] border-slate-200 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-[15px] font-black text-[#1A3A52]">
                    {property.demanda.clientName}
                  </p>
                  <p className="text-[11px] font-bold text-gray-500 mt-1 uppercase tracking-wider">
                    Demanda de {property.demanda.type}
                  </p>
                </div>
                <Badge
                  className={
                    property.tipo === 'Aluguel'
                      ? 'bg-blue-600 border-none shadow-sm'
                      : 'bg-green-600 border-none shadow-sm'
                  }
                >
                  Vinculado
                </Badge>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border-[2px] border-dashed border-gray-300 text-center">
                <p className="text-[13px] text-gray-500 italic font-bold">
                  Nenhuma demanda vinculada (Imóvel Avulso)
                </p>
              </div>
            )}
          </div>

          {/* Observations */}
          {property.observacoes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <p className="text-[11px] text-gray-500 font-black uppercase tracking-wider">
                  Observações
                </p>
              </div>
              <p className="text-sm font-medium text-gray-700 bg-amber-50 border border-amber-100 p-4 rounded-xl leading-relaxed whitespace-pre-wrap shadow-sm">
                {property.observacoes}
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
