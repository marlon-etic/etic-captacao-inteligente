import { X, CheckCircle2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { ImovelCapturadoCard } from './ImovelCapturadoCard'
import { RespostasHistory } from './RespostasHistory'

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
  const { users, currentUser } = useAppStore()

  if (!demand) return null

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const creatorId = demand.sdr_id || demand.corretor_id
  const creator = users.find((u) => u.id === creatorId)
  const creatorName = creator?.name || 'Desconhecido'

  const isHighUrgency = demand.nivel_urgencia === 'Alta' || demand.nivel_urgencia === 'Urgente'
  const urgencyColor = isHighUrgency
    ? 'text-[#F44336]'
    : demand.nivel_urgencia === 'Média'
      ? 'text-[#FF9800]'
      : 'text-[#4CAF50]'

  const isOwnerOrAdmin =
    currentUser?.role === 'admin' || currentUser?.role === 'gestor' || currentUser?.id === creatorId

  let statusLabel = demand.status_demanda
  if (statusLabel === 'aberta' && demand.is_prioritaria) statusLabel = 'priorizada'
  if (demand.status_demanda === 'localmente_perdida') statusLabel = 'perdida (você)'
  if (demand.db_status_demanda === 'impossivel' || demand.db_status_demanda === 'PERDIDA_BAIXA') {
    statusLabel =
      demand.db_status_demanda === 'PERDIDA_BAIXA' ? 'baixa automática' : 'perdida global'
  }

  const respostasNaoEncontrei = (demand.respostas_captador || []).filter(
    (r: any) => r.resposta === 'nao_encontrei',
  )

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-full h-[100dvh] sm:h-[85vh] sm:max-w-[700px] p-0 flex flex-col rounded-none sm:rounded-[16px] border-0 sm:border-[2px] sm:border-[#2E5F8A]/20 gap-0 overflow-hidden bg-[#F8FAFC] shadow-2xl z-[1100]">
        <DialogHeader className="p-[16px] md:p-[24px] border-b border-[#E5E5E5] shrink-0 flex flex-row items-center justify-between bg-white text-left relative z-10 shadow-sm pointer-events-none">
          <div className="flex flex-col gap-1 pr-8">
            <DialogTitle className="text-[22px] font-black leading-tight text-[#1A3A52] m-0 p-0">
              {demand.nome_cliente}
            </DialogTitle>
            <span className="text-[13px] font-bold text-[#666666] flex items-center gap-2">
              <Badge
                className={cn(
                  'text-[10px] px-2 py-0.5',
                  demand.tipo === 'Venda' ? 'bg-[#FF9800]' : 'bg-[#1A3A52]',
                )}
              >
                {demand.tipo === 'Venda' ? 'VENDA' : 'ALUGUEL'}
              </Badge>
              Solicitado por {creatorName}
            </span>
          </div>
          <DialogClose className="absolute right-4 top-[50%] -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] transition-colors text-[#333333] pointer-events-auto">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-[16px] md:p-[24px] bg-[#F8FAFC] relative z-0">
          <div className="space-y-[16px] pb-[24px]">
            {/* Localização e Budget */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pointer-events-none">
              <div className="bg-white p-5 rounded-[12px] border border-[#E5E5E5] shadow-sm flex flex-col gap-1">
                <span className="text-[12px] text-[#999999] font-black uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  📍 Localização Desejada
                </span>
                <span className="text-[16px] text-[#1A3A52] font-bold leading-snug">
                  {demand.bairros?.join(', ') || 'Não informada'}
                </span>
              </div>
              <div className="bg-white p-5 rounded-[12px] border border-[#E5E5E5] shadow-sm flex flex-col gap-1">
                <span className="text-[12px] text-[#999999] font-black uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  💰 Orçamento
                </span>
                <span className="text-[20px] text-[#10B981] font-black leading-snug tracking-tight">
                  R$ {formatPrice(demand.valor_minimo)} - R$ {formatPrice(demand.valor_maximo)}
                </span>
              </div>
            </div>

            {/* Especificações */}
            <div className="bg-white p-5 rounded-[12px] border border-[#E5E5E5] shadow-sm pointer-events-none">
              <span className="text-[12px] text-[#999999] font-black uppercase tracking-wider flex items-center gap-1.5 mb-3 border-b border-[#F5F5F5] pb-2">
                🏠 Especificações do Imóvel
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-[16px]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-[#666666] font-medium">Tipo</span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {demand.tipo_imovel || 'Indiferente'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-[#666666] font-medium">Dormitórios</span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {demand.dormitorios || 'Indiferente'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-[#666666] font-medium">Vagas</span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {demand.vagas_estacionamento || 'Indiferente'}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[12px] text-[#666666] font-medium">Urgência</span>
                  <span className={cn('text-[16px] font-bold', urgencyColor)}>
                    {demand.nivel_urgencia}
                  </span>
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="bg-[#E8F5E9] p-5 rounded-[12px] border border-[#A7F3D0] shadow-sm pointer-events-none">
              <span className="text-[12px] text-[#065F46] font-black uppercase tracking-wider flex items-center gap-1.5 mb-2">
                📝 Detalhes e Observações
              </span>
              <p className="text-[15px] text-[#065F46] font-medium leading-relaxed whitespace-pre-wrap">
                {demand.observacoes || 'Nenhuma observação específica fornecida pelo solicitante.'}
              </p>
            </div>

            <RespostasHistory respostas={respostasNaoEncontrei} />

            {/* Histórico/Imóveis */}
            <div className="bg-white p-5 rounded-[12px] border border-[#E5E5E5] shadow-sm relative z-0 mt-4">
              <span className="text-[12px] text-[#999999] font-black uppercase tracking-wider flex items-center gap-1.5 mb-4 border-b border-[#F5F5F5] pb-2 pointer-events-none">
                📦 Imóveis Captados ({demand.imoveis_captados?.length || 0})
              </span>

              {demand.imoveis_captados && demand.imoveis_captados.length > 0 ? (
                <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar relative z-10">
                  {demand.imoveis_captados.map((p, i) => (
                    <ImovelCapturadoCard
                      key={p.id || i}
                      property={p}
                      demand={demand as any}
                      isOwnerOrAdmin={isOwnerOrAdmin}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-[#F8FAFC] p-6 rounded-[8px] border border-[#E5E5E5] text-center flex flex-col items-center gap-2 pointer-events-none">
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

            {/* Informações Adicionais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px] opacity-70 pointer-events-none mt-4">
              <div className="bg-white p-4 rounded-[12px] border border-[#E5E5E5]">
                <span className="text-[11px] text-[#999999] font-bold uppercase block mb-1">
                  Status
                </span>
                <Badge variant="outline" className="font-bold">
                  {statusLabel}
                </Badge>
              </div>
              <div className="bg-white p-4 rounded-[12px] border border-[#E5E5E5]">
                <span className="text-[11px] text-[#999999] font-bold uppercase block mb-1">
                  Criada em
                </span>
                <span className="text-[14px] text-[#333333] font-bold">
                  {new Date(demand.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Rodapé Dinâmico */}
        <DialogFooter className="p-[16px] md:p-[20px] border-t border-[#E5E5E5] shrink-0 flex flex-col sm:flex-row gap-[12px] bg-white z-10 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] relative">
          {onFoundProperty &&
            demand.db_status_demanda !== 'impossivel' &&
            demand.db_status_demanda !== 'PERDIDA_BAIXA' && (
              <Button
                className="min-h-[56px] w-full text-[16px] font-black bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_4px_12px_rgba(16,185,129,0.3)] animate-pulse-green relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onFoundProperty()
                }}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" /> ENCONTREI UM IMÓVEL
              </Button>
            )}

          {onEdit &&
            isOwnerOrAdmin &&
            demand.db_status_demanda !== 'impossivel' &&
            demand.db_status_demanda !== 'PERDIDA_BAIXA' && (
              <Button
                variant="outline"
                className="min-h-[48px] w-full sm:flex-1 text-[14px] font-bold relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit()
                }}
              >
                Editar Demanda
              </Button>
            )}

          {onPrioritize &&
            isOwnerOrAdmin &&
            demand.db_status_demanda !== 'impossivel' &&
            demand.db_status_demanda !== 'PERDIDA_BAIXA' && (
              <Button
                className="min-h-[48px] w-full sm:flex-1 text-[14px] font-bold bg-[#FCD34D] hover:bg-[#F59E0B] text-[#854D0E] border-none relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onPrioritize()
                }}
              >
                {demand.is_prioritaria ? 'REMOVER PRIORIDADE' : '⭐ PRIORIZAR'}
              </Button>
            )}

          {onLost &&
            isOwnerOrAdmin &&
            demand.db_status_demanda !== 'impossivel' &&
            demand.db_status_demanda !== 'PERDIDA_BAIXA' && (
              <Button
                className="min-h-[48px] w-full sm:flex-1 text-[14px] font-bold bg-[#EF4444] hover:bg-[#DC2626] text-white border-none relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onLost()
                }}
              >
                ❌ MARCAR PERDIDA
              </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
