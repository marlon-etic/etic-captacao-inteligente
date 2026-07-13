import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { X, Building2, User, Calendar, Loader2, Trophy } from 'lucide-react'
import { Campanha, CampanhaImovel, fetchCampanhaImoveis } from '@/services/campanhaService'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface CampanhaDetailsModalProps {
  campanha: Campanha | null
  isOpen: boolean
  onClose: () => void
}

const tipoLabels: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  galpao: 'Galpão',
  comercial: 'Comercial',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function CampanhaDetailsModal({ campanha, isOpen, onClose }: CampanhaDetailsModalProps) {
  const [imoveis, setImoveis] = useState<CampanhaImovel[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (campanha && isOpen) {
      setLoading(true)
      fetchCampanhaImoveis(campanha.id)
        .then(setImoveis)
        .catch(() => setImoveis([]))
        .finally(() => setLoading(false))
    } else {
      setImoveis([])
    }
  }, [campanha, isOpen])

  if (!campanha) return null

  const pct = Math.min(100, (campanha.progresso / campanha.meta) * 100)
  const goalReached = campanha.progresso >= campanha.meta

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {tipoLabels[campanha.tipo_imovel] || campanha.tipo_imovel}
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Faixa de Valor</p>
              <p className="text-sm font-bold text-[#1A3A52]">
                {formatCurrency(campanha.faixa_valor_min)}
              </p>
              <p className="text-sm font-bold text-[#1A3A52]">
                {formatCurrency(campanha.faixa_valor_max)}
              </p>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Encerramento</p>
              <p className="text-sm font-bold text-[#1A3A52]">{formatDate(campanha.data_fim)}</p>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Status</p>
              <p
                className={cn(
                  'text-sm font-bold',
                  campanha.status === 'ativa' ? 'text-green-600' : 'text-gray-500',
                )}
              >
                {campanha.status === 'ativa'
                  ? 'Ativa'
                  : campanha.status === 'pausada'
                    ? 'Pausada'
                    : 'Fechada'}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-bold text-[#666666]">Progresso da Meta</span>
              <span
                className={cn(
                  'text-lg font-black',
                  goalReached ? 'text-green-600' : 'text-[#1A3A52]',
                )}
              >
                {campanha.progresso}/{campanha.meta}
                {goalReached && <Trophy className="inline-block w-4 h-4 ml-1" />}
              </span>
            </div>
            <Progress
              value={pct}
              className={cn(
                'h-3',
                campanha.status === 'ativa' ? '[&>div]:bg-green-500' : '[&>div]:bg-gray-400',
              )}
            />
            {goalReached && (
              <p className="text-green-600 font-bold text-xs mt-1.5">Meta atingida!</p>
            )}
          </div>

          <div>
            <h4 className="font-bold text-[#1A3A52] text-sm mb-2">
              Imóveis Vinculados ({imoveis.length})
            </h4>
            <ScrollArea className="max-h-[300px] rounded-lg border border-[#E5E5E5]">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A3A52]" />
                </div>
              ) : imoveis.length === 0 ? (
                <div className="text-center py-12 text-[#999999] font-medium text-sm">
                  Nenhum imóvel vinculado ainda.
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {imoveis.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors"
                    >
                      <div>
                        <p className="font-bold text-[#1A3A52] text-sm">
                          {item.imovel?.codigo_imovel || 'Sem código'}
                        </p>
                        <p className="text-xs text-[#999999]">
                          {item.imovel?.endereco || 'Endereço não informado'}
                        </p>
                        {item.imovel?.preco && (
                          <p className="text-xs text-[#666666] font-medium">
                            {formatCurrency(item.imovel.preco)}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-[#1A3A52] flex items-center gap-1 justify-end">
                          <User className="w-3 h-3" />
                          {item.captador?.nome || 'N/D'}
                        </p>
                        <p className="text-xs text-[#999999] flex items-center gap-1 justify-end mt-0.5">
                          <Calendar className="w-3 h-3" />
                          {formatDate(item.data_adicionado)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
