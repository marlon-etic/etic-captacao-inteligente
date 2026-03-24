import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import {
  MapPin,
  DollarSign,
  BedDouble,
  Car,
  Tag,
  Clock,
  User,
  Info,
  CheckCircle,
  X,
  History,
  Star,
  Pencil,
} from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ImovelCapturadoCard } from './ImovelCapturadoCard'
import useAppStore from '@/stores/useAppStore'

interface Props {
  demand: SupabaseDemand | null
  isOpen: boolean
  onClose: () => void
  onFoundProperty?: () => void
  onEdit?: () => void
  onPrioritize?: () => void
  onLost?: () => void
}

export function DemandDetailModal({
  demand,
  isOpen,
  onClose,
  onFoundProperty,
  onEdit,
  onPrioritize,
  onLost,
}: Props) {
  const { currentUser } = useAppStore()
  if (!demand) return null

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const getUrgencyColor = (urgency: string) => {
    const u = urgency?.toLowerCase() || ''
    if (u.includes('alta') || u.includes('urgente') || u.includes('15'))
      return 'text-[#EF4444] bg-[#FEF2F2] border-[#EF4444]'
    if (u.includes('média') || u.includes('30'))
      return 'text-[#F59E0B] bg-[#FFFBEB] border-[#F59E0B]'
    return 'text-[#6B7280] bg-[#F3F4F6] border-[#D1D5DB]'
  }

  const createdDate = new Date(demand.created_at)
  const daysAgo = Math.floor((new Date().getTime() - createdDate.getTime()) / (1000 * 3600 * 24))
  const capturedCount = demand.imoveis_captados?.length || 0
  const prazo = demand.prazos_captacao?.[0]

  const isOwnerOrAdmin =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor' ||
    demand.sdr_id === currentUser?.id ||
    demand.corretor_id === currentUser?.id

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="w-full max-w-[calc(100%-32px)] md:max-w-2xl lg:max-w-3xl h-[95vh] md:h-[85vh] p-0 flex flex-col rounded-[16px] bg-[#FFFFFF] border-0 shadow-2xl overflow-hidden z-[100]">
        <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] shrink-0 bg-[#F8FAFC] flex flex-row items-center justify-between sticky top-0 z-10">
          <div className="flex flex-col gap-1 text-left pr-8">
            <DialogTitle className="text-xl md:text-2xl text-[#1A3A52] font-black flex items-center gap-2 flex-wrap">
              Detalhes da Demanda
              {demand.is_prioritaria && (
                <span className="bg-[#FCD34D] text-[#854D0E] text-[10px] md:text-[12px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 uppercase tracking-wide border border-[#F59E0B] shadow-sm">
                  <Star className="w-3.5 h-3.5 fill-current" /> Prioritária
                </span>
              )}
            </DialogTitle>
            <p className="text-sm text-[#666666] font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Criada há {daysAgo === 0 ? 'menos de 1 dia' : `${daysAgo} dias`}(
              {createdDate.toLocaleDateString('pt-BR')})
            </p>
          </div>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white border border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5] transition-colors">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <ScrollArea className="flex-1 p-4 md:p-6 bg-white">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
            <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-[12px] border border-[#E2E8F0]">
              <h3 className="text-[14px] font-black uppercase text-[#64748B] tracking-wider flex items-center gap-2">
                <User className="w-4 h-4" /> Cliente
              </h3>
              <div className="flex flex-col gap-1">
                <span className="text-[18px] font-bold text-[#1A3A52]">
                  {demand.nome_cliente || 'Não informado'}
                </span>
                <span className="text-[14px] font-medium text-[#64748B]">Tipo: {demand.tipo}</span>
              </div>
            </div>

            <div className="space-y-3 bg-[#F8FAFC] p-4 rounded-[12px] border border-[#E2E8F0]">
              <h3 className="text-[14px] font-black uppercase text-[#64748B] tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4" /> Status e Urgência
              </h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#64748B]">Urgência:</span>
                  <span
                    className={`text-[12px] font-bold px-2.5 py-0.5 rounded-full border ${getUrgencyColor(demand.nivel_urgencia)}`}
                  >
                    {demand.nivel_urgencia || 'Não informada'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-medium text-[#64748B]">Capturas:</span>
                  <span className="text-[14px] font-bold text-[#10B981] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full">
                    {capturedCount} imóveis
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3 bg-white p-4 rounded-[12px] border border-[#E2E8F0] shadow-sm">
              <h3 className="text-[14px] font-black uppercase text-[#64748B] tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-pink-500" /> Bairros de Interesse
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {demand.bairros && demand.bairros.length > 0 ? (
                  demand.bairros.map((b, i) => (
                    <span
                      key={i}
                      className="bg-[#F1F5F9] text-[#334155] text-[14px] font-medium px-3 py-1.5 rounded-[8px] border border-[#E2E8F0]"
                    >
                      {b}
                    </span>
                  ))
                ) : (
                  <span className="text-[14px] text-[#94A3B8] italic">Qualquer bairro</span>
                )}
              </div>
            </div>

            <div className="md:col-span-2 space-y-3 bg-white p-4 rounded-[12px] border border-[#E2E8F0] shadow-sm">
              <h3 className="text-[14px] font-black uppercase text-[#64748B] tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#10B981]" /> Especificações do Imóvel
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                <div className="col-span-2 sm:col-span-4 bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E2E8F0] flex items-center justify-between">
                  <span className="text-[14px] font-medium text-[#64748B]">
                    Orçamento (Mín - Máx)
                  </span>
                  <span className="text-[18px] font-black text-[#10B981]">
                    {formatPrice(demand.valor_minimo)} - {formatPrice(demand.valor_maximo)}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E2E8F0] flex flex-col items-center justify-center text-center gap-1">
                  <BedDouble className="w-5 h-5 text-[#64748B]" />
                  <span className="text-[12px] font-medium text-[#64748B] uppercase">
                    Dormitórios
                  </span>
                  <span className="text-[16px] font-bold text-[#1A3A52]">
                    {demand.dormitorios || 'Indif.'}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E2E8F0] flex flex-col items-center justify-center text-center gap-1">
                  <Car className="w-5 h-5 text-[#64748B]" />
                  <span className="text-[12px] font-medium text-[#64748B] uppercase">Vagas</span>
                  <span className="text-[16px] font-bold text-[#1A3A52]">
                    {demand.vagas_estacionamento || 'Indif.'}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E2E8F0] flex flex-col items-center justify-center text-center gap-1">
                  <Tag className="w-5 h-5 text-[#64748B]" />
                  <span className="text-[12px] font-medium text-[#64748B] uppercase">Tipo</span>
                  <span className="text-[16px] font-bold text-[#1A3A52]">
                    {demand.tipo_imovel || 'Indif.'}
                  </span>
                </div>

                <div className="bg-[#F8FAFC] p-3 rounded-[8px] border border-[#E2E8F0] flex flex-col items-center justify-center text-center gap-1">
                  <History className="w-5 h-5 text-[#64748B]" />
                  <span className="text-[12px] font-medium text-[#64748B] uppercase">Prazo</span>
                  <span className="text-[14px] font-bold text-[#1A3A52]">
                    {prazo
                      ? prazo.status === 'respondido'
                        ? 'Respondido'
                        : new Date(prazo.prazo_resposta).toLocaleDateString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3 bg-[#ECFDF5] p-4 rounded-[12px] border border-[#A7F3D0]">
              <h3 className="text-[14px] font-black uppercase text-[#065F46] tracking-wider flex items-center gap-2">
                <Info className="w-4 h-4 text-[#10B981]" /> Observações
              </h3>
              <p className="text-[15px] leading-relaxed text-[#064E3B] font-medium whitespace-pre-wrap">
                {demand.observacoes || 'Nenhuma observação adicional fornecida para esta demanda.'}
              </p>
            </div>

            {/* Histórico/Imóveis */}
            <div className="md:col-span-2 bg-white p-5 rounded-[12px] border border-[#E5E5E5] shadow-sm">
              <span className="text-[12px] text-[#999999] font-black uppercase tracking-wider flex items-center gap-1.5 mb-4 border-b border-[#F5F5F5] pb-2">
                📦 Imóveis Capturados ({demand.imoveis_captados?.length || 0})
              </span>

              {demand.imoveis_captados && demand.imoveis_captados.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {demand.imoveis_captados.map((p, i) => (
                    <ImovelCapturadoCard
                      key={p.id || i}
                      property={p}
                      demand={demand}
                      isOwnerOrAdmin={isOwnerOrAdmin}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8FAFC] p-6 rounded-[8px] border border-[#E5E5E5] text-center flex flex-col items-center gap-2">
                  <span className="text-[24px]">🏠</span>
                  <p className="text-[14px] text-[#666666] font-medium leading-snug">
                    Nenhum imóvel capturado ainda.
                    <br />
                    <span className="text-[#999999]">
                      Aguardando os captadores encontrarem opções.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>

        {(onFoundProperty || onEdit || onPrioritize || onLost) && (
          <DialogFooter className="p-[16px] md:p-[20px] border-t border-[#E5E5E5] shrink-0 flex flex-col sm:flex-row gap-[12px] bg-white z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
            {onFoundProperty &&
              (demand.status_demanda === 'aberta' ||
                demand.status_demanda === 'sem_resposta_24h') && (
                <Button
                  className="w-full min-h-[56px] bg-[#10B981] hover:bg-[#059669] text-white font-black text-[16px] tracking-wide shadow-[0_4px_14px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.01]"
                  onClick={onFoundProperty}
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  ENCONTREI IMÓVEL PARA ESTA DEMANDA
                </Button>
              )}

            {!onFoundProperty && (
              <div className="flex flex-col sm:flex-row gap-3 w-full justify-end">
                {onPrioritize && (
                  <Button
                    variant="outline"
                    className="min-h-[48px] sm:flex-1 text-[14px] font-bold border-[#FCD34D] text-[#854D0E] hover:bg-[#FFFBEB] transition-colors"
                    onClick={() => {
                      onClose()
                      onPrioritize()
                    }}
                  >
                    <Star className="w-4 h-4 mr-2 fill-current" />{' '}
                    {demand.is_prioritaria ? 'REMOVER PRIORIDADE' : 'PRIORIZAR'}
                  </Button>
                )}
                {onEdit && (
                  <Button
                    variant="outline"
                    className="min-h-[48px] sm:flex-1 text-[14px] font-bold border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5] transition-colors"
                    onClick={() => {
                      onClose()
                      onEdit()
                    }}
                  >
                    <Pencil className="w-4 h-4 mr-2" /> EDITAR
                  </Button>
                )}
                {onLost && (
                  <Button
                    className="min-h-[48px] sm:flex-1 text-[14px] font-bold bg-[#EF4444] hover:bg-[#DC2626] text-white border-none transition-colors shadow-sm"
                    onClick={() => {
                      onClose()
                      onLost()
                    }}
                  >
                    <X className="w-4 h-4 mr-2" /> PERDIDO
                  </Button>
                )}
              </div>
            )}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
