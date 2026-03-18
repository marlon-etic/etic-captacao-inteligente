import { X, RefreshCw } from 'lucide-react'
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
import { Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demand?: Demand
  onPrioritize?: () => void
  onLost?: () => void
}

export function DemandDetailsModal({ open, onOpenChange, demand, onPrioritize, onLost }: Props) {
  const { getSimilarDemands, users } = useAppStore()

  if (!demand) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-[24px] bg-[#FFFFFF] border-[2px] border-[#E5E5E5] rounded-[12px] flex flex-col items-center justify-center min-h-[200px]">
          <div className="text-center text-[16px] leading-[24px] text-[#F44336] font-bold flex flex-col items-center gap-3">
            <span className="text-[32px] opacity-80">⚠️</span>
            Erro ao carregar. Tente novamente.
          </div>
          <div className="flex gap-3 mt-[24px] w-full max-w-[200px]">
            <Button
              onClick={() => onOpenChange(false)}
              className="flex-1 min-h-[44px] text-[14px] font-bold bg-[#F5F5F5] text-[#333333] hover:bg-[#E5E5E5]"
            >
              Fechar
            </Button>
            <Button
              onClick={() => {
                onOpenChange(false)
                setTimeout(() => onOpenChange(true), 300)
              }}
              className="flex-1 min-h-[44px] text-[14px] font-bold bg-[#1A3A52] text-white hover:bg-[#2E5F8A] gap-2"
            >
              <RefreshCw className="w-4 h-4" /> Tentar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  const similarDemands = getSimilarDemands(demand.id)

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  let statusLabel = demand.status
  if (demand.status === 'Pendente' && demand.isPrioritized) statusLabel = 'Priorizada'

  const creator = users.find((u) => u.id === demand.createdBy)
  const creatorName = creator?.name || 'Desconhecido'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-[100dvh] sm:h-[85vh] sm:max-w-[700px] p-0 flex flex-col rounded-none sm:rounded-[12px] border-0 sm:border-[2px] sm:border-[#2E5F8A] gap-0 overflow-hidden bg-[#FFFFFF] shadow-[0_8px_32px_rgba(26,58,82,0.2)]">
        <DialogHeader className="p-[16px] md:p-[24px] border-b border-[#2E5F8A]/20 shrink-0 flex flex-row items-center justify-between bg-[#1A3A52] text-left relative">
          <DialogTitle className="text-[20px] font-bold leading-[28px] m-0 p-0 pr-8 truncate text-white">
            Detalhes da Demanda - {demand.clientName}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-[50%] -translate-y-1/2 w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-[16px] md:p-[24px] bg-[#FFFFFF]">
          <div className="space-y-[24px] pb-[24px]">
            <section className="space-y-[12px]">
              <h4 className="text-[20px] font-bold text-[#1A3A52] border-b border-[#2E5F8A]/20 pb-[8px]">
                👤 Informações do Cliente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">Nome</span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">{demand.clientName}</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">Email</span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {demand.clientEmail || 'Não informado'}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    Telefone
                  </span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">Não informado</span>
                </div>
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[20px] font-bold text-[#1A3A52] border-b border-[#2E5F8A]/20 pb-[8px]">
                📍 Detalhes da Demanda
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    Localização
                  </span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">{demand.location}</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    💰 Orçamento
                  </span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    R$ {formatPrice(demand.minBudget)} - R$ {formatPrice(demand.maxBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    🏠 Perfil
                  </span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {demand.bedrooms || 0} dorm, {demand.bathrooms || 0} banh,{' '}
                    {demand.parkingSpots || 0} vagas
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[20px] font-bold text-[#1A3A52] border-b border-[#2E5F8A]/20 pb-[8px]">
                📝 Necessidades
              </h4>
              <p className="text-[16px] text-[#333333] leading-[24px]">
                {demand.description || 'Nenhuma descrição detalhada.'}
              </p>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[20px] font-bold text-[#1A3A52] border-b border-[#2E5F8A]/20 pb-[8px]">
                ⏰ Informações Adicionais
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    Urgência
                  </span>
                  <span className="text-[16px] text-[#FF9800] font-bold">{demand.timeframe}</span>
                </div>
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    📊 Status
                  </span>
                  <Badge variant="outline" className="mt-1">
                    {statusLabel}
                  </Badge>
                </div>
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    📅 Data de Criação
                  </span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {new Date(demand.createdAt).toLocaleDateString('pt-BR')} por {creatorName}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-[#333333] font-medium block mb-1">
                    📅 Data de Finalização
                  </span>
                  <span className="text-[16px] text-[#1A3A52] font-bold">
                    {demand.status === 'Negócio' &&
                    demand.capturedProperties?.find((p) => p.fechamentoDate)
                      ? new Date(
                          demand.capturedProperties.find((p) => p.fechamentoDate)!.fechamentoDate!,
                        ).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>

                {demand.isPrioritized && demand.data_priorizacao && (
                  <div className="col-span-1 sm:col-span-2 mt-[8px] p-[16px] bg-[#ffebee] rounded-[8px] border-[2px] border-[#F44336]/30">
                    <span className="text-[12px] text-[#F44336] block uppercase font-bold mb-[4px]">
                      🔴 Priorização
                    </span>
                    <span className="text-[16px] font-bold text-[#1A3A52] block mb-[4px]">
                      Realizada em {new Date(demand.data_priorizacao).toLocaleDateString('pt-BR')}{' '}
                      por {creatorName}
                    </span>
                    <span className="text-[14px] text-[#333333] font-medium block">
                      Motivo: {demand.motivo_priorizacao}
                    </span>
                  </div>
                )}

                {demand.status === 'Perdida' && demand.data_perda && (
                  <div className="col-span-1 sm:col-span-2 mt-[8px] p-[16px] bg-[#F5F5F5] rounded-[8px] border-[2px] border-[#999999]/30">
                    <span className="text-[12px] text-[#999999] block uppercase font-bold mb-[4px]">
                      ⚫ Demanda Perdida
                    </span>
                    <span className="text-[16px] font-bold text-[#1A3A52] block mb-[4px]">
                      Marcada em {new Date(demand.data_perda).toLocaleDateString('pt-BR')} por{' '}
                      {creatorName}
                    </span>
                    <span className="text-[14px] text-[#333333] font-medium block capitalize">
                      Motivo: {demand.motivo_perda?.replace('_', ' ')}
                    </span>
                    {demand.observacoes_perda && (
                      <span className="text-[14px] text-[#333333] font-medium block mt-[8px] italic">
                        Obs: {demand.observacoes_perda}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[20px] font-bold text-[#1A3A52] border-b border-[#2E5F8A]/20 pb-[8px]">
                👥 Clientes Similares
              </h4>
              {similarDemands.length > 0 ? (
                <ul className="list-disc pl-[20px] text-[16px] text-[#333333]">
                  {similarDemands.map((d) => (
                    <li key={d.id} className="mb-[4px]">
                      {d.clientName} ({d.location})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[16px] text-[#999999]">Nenhum cliente similar encontrado.</p>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="p-[16px] md:p-[24px] border-t border-[#2E5F8A]/20 shrink-0 flex flex-col sm:flex-row gap-[12px] bg-[#F5F5F5]">
          {onPrioritize && (
            <Button
              className="min-h-[44px] w-full text-[14px] font-bold bg-[#F44336] hover:bg-[#d32f2f] text-white border-none"
              onClick={() => {
                onOpenChange(false)
                onPrioritize()
              }}
            >
              🔴 PRIORIZAR
            </Button>
          )}
          {onLost && (
            <Button
              className="min-h-[44px] w-full text-[14px] font-bold bg-[#999999] hover:bg-[#777777] text-white border-none"
              onClick={() => {
                onOpenChange(false)
                onLost()
              }}
            >
              ❌ PERDIDO
            </Button>
          )}
          <Button
            variant="outline"
            className="min-h-[44px] w-full text-[14px] font-bold"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
