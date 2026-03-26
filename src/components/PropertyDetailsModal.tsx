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

  const getStatusBadgeLarge = (p: any) => {
    const isFechado = p.status_captacao === 'fechado' || p.etapa_funil === 'fechado'
    const isPerdido = p.status_captacao === 'perdido' || p.etapa_funil === 'perdido'
    const isNegociacao = p.etapa_funil === 'proposta' || p.etapa_funil === 'visitado'

    if (isFechado)
      return (
        <Badge className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm border-none uppercase tracking-wider font-black text-xs px-2 py-1">
          Fechado
        </Badge>
      )
    if (isPerdido)
      return (
        <Badge className="bg-red-500 hover:bg-red-600 text-white shadow-sm border-none uppercase tracking-wider font-black text-xs px-2 py-1">
          Perdido
        </Badge>
      )
    if (isNegociacao)
      return (
        <Badge className="bg-amber-500 hover:bg-amber-600 text-white shadow-sm border-none uppercase tracking-wider font-black text-xs px-2 py-1">
          Em Negociação
        </Badge>
      )
    return (
      <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm border-none uppercase tracking-wider font-black text-xs px-2 py-1">
        Disponível
      </Badge>
    )
  }

  return (
    <Dialog open={!!property} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-[95vw] max-w-lg rounded-2xl p-0 overflow-hidden bg-white z-[1100]">
        <DialogHeader className="p-5 bg-slate-50 border-b border-gray-100 relative z-10">
          <DialogTitle className="flex flex-col sm:flex-row sm:items-center justify-between text-xl font-black text-[#1A3A52] gap-3">
            <span>Detalhes do Imóvel</span>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="bg-[#1A3A52] px-3 py-1 shadow-sm text-sm">
                {property.codigo_imovel}
              </Badge>
              {getStatusBadgeLarge(property)}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-6 max-h-[75vh] overflow-y-auto relative z-0">
          {/* Header Stats */}
          <div className="grid grid-cols-2 gap-4 pointer-events-none">
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
              <p className="text-[11px] text-emerald-600 font-black uppercase tracking-wider mb-1">
                Valor{' '}
                {(property.status_captacao === 'fechado' || property.etapa_funil === 'fechado') &&
                  '(Fechamento)'}
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
                {property.tipo === 'Aluguel' ? '🏠' : property.tipo === 'Ambos' ? '🔄' : '🏢'}{' '}
                {property.tipo}
              </p>
            </div>
          </div>

          {/* Main Info */}
          <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-100 pointer-events-none flex flex-col gap-1">
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

            <div className="flex gap-3 pt-3 border-t border-gray-200">
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

            {property.data_fechamento && (
              <div className="flex gap-3 pt-3 border-t border-gray-200">
                <Calendar className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[11px] text-blue-600 font-black uppercase tracking-wider">
                    Data de Fechamento
                  </p>
                  <p className="text-sm font-bold text-[#1A3A52] mt-0.5">
                    {new Date(property.data_fechamento).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-3 gap-3 border-y border-gray-100 py-5 pointer-events-none">
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
          <div className="pointer-events-none">
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
                      : property.tipo === 'Ambos'
                        ? 'bg-purple-600 border-none shadow-sm'
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
            <div className="pointer-events-none">
              <div className="flex items-center gap-2 mb-3">
                <FileText className="w-4 h-4 text-gray-400" />
                <p className="text-[11px] text-gray-500 font-black uppercase tracking-wider">
                  Observações & Histórico
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
