import { X } from 'lucide-react'
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
        <DialogContent className="p-4">
          <div className="text-center text-[14px] leading-[20px] text-destructive font-medium">
            Erro ao carregar. Tente novamente.
          </div>
          <Button
            onClick={() => onOpenChange(false)}
            className="min-h-[48px] md:min-h-[44px] lg:min-h-[40px] text-[14px] leading-[20px]"
          >
            Fechar
          </Button>
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
      <DialogContent className="max-w-full h-[100dvh] sm:h-[85vh] sm:max-w-[700px] p-0 flex flex-col rounded-none sm:rounded-xl border-0 sm:border gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-4 md:p-6 border-b shrink-0 flex flex-row items-center justify-between bg-muted/10 text-left relative">
          <DialogTitle className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] m-0 p-0 pr-8 truncate">
            Detalhes da Demanda - {demand.clientName}
          </DialogTitle>
          <DialogClose className="absolute right-4 top-3 w-10 h-10 md:w-8 md:h-8 flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="space-y-6 pb-6">
            <section className="space-y-3">
              <h4 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] border-b pb-2">
                👤 Informações do Cliente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    Nome
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    {demand.clientName}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    Email
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    {demand.clientEmail || 'Não informado'}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    Telefone
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    Não informado
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] border-b pb-2">
                📍 Detalhes da Demanda
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    Localização
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    {demand.location}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    💰 Orçamento
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    R$ {formatPrice(demand.minBudget)} - R$ {formatPrice(demand.maxBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    🏠 Perfil
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    {demand.bedrooms || 0} dorm, {demand.bathrooms || 0} banh,{' '}
                    {demand.parkingSpots || 0} vagas
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] border-b pb-2">
                📝 Necessidades
              </h4>
              <p className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px]">
                {demand.description || 'Nenhuma descrição detalhada.'}
              </p>
            </section>

            <section className="space-y-3">
              <h4 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] border-b pb-2">
                ⏰ Informações Adicionais
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    Urgência
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold text-orange-700">
                    {demand.timeframe}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    📊 Status
                  </span>
                  <Badge variant="outline" className="mt-1 text-[12px] leading-[16px] px-2.5 py-1">
                    {statusLabel}
                  </Badge>
                </div>
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    📅 Data de Criação
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    {new Date(demand.createdAt).toLocaleDateString('pt-BR')} por {creatorName}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-muted-foreground block mb-0.5">
                    📅 Data de Finalização
                  </span>
                  <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-bold">
                    {demand.status === 'Negócio' &&
                    demand.capturedProperties?.find((p) => p.fechamentoDate)
                      ? new Date(
                          demand.capturedProperties.find((p) => p.fechamentoDate)!.fechamentoDate!,
                        ).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>

                {demand.isPrioritized && demand.data_priorizacao && (
                  <div className="col-span-1 sm:col-span-2 mt-2 p-4 bg-red-50 rounded-xl border border-red-100">
                    <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-red-800/80 block uppercase font-bold mb-1">
                      🔴 Priorização
                    </span>
                    <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-medium text-red-900 block mb-1">
                      Realizada em {new Date(demand.data_priorizacao).toLocaleDateString('pt-BR')}{' '}
                      por {creatorName}
                    </span>
                    <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] text-red-800 block">
                      Motivo: {demand.motivo_priorizacao}
                    </span>
                  </div>
                )}

                {demand.status === 'Perdida' && demand.data_perda && (
                  <div className="col-span-1 sm:col-span-2 mt-2 p-4 bg-gray-100 rounded-xl border border-gray-200">
                    <span className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-gray-600 block uppercase font-bold mb-1">
                      ⚫ Demanda Perdida
                    </span>
                    <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] font-medium text-gray-900 block mb-1">
                      Marcada em {new Date(demand.data_perda).toLocaleDateString('pt-BR')} por{' '}
                      {creatorName}
                    </span>
                    <span className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] text-gray-800 block capitalize">
                      Motivo: {demand.motivo_perda?.replace('_', ' ')}
                    </span>
                    {demand.observacoes_perda && (
                      <span className="text-[13px] md:text-[14px] lg:text-[16px] leading-[20px] md:leading-[22px] lg:leading-[24px] text-gray-700 block mt-2 italic">
                        Obs: {demand.observacoes_perda}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-3">
              <h4 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] border-b pb-2">
                👥 Clientes Similares
              </h4>
              {similarDemands.length > 0 ? (
                <ul className="list-disc pl-5 text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px]">
                  {similarDemands.map((d) => (
                    <li key={d.id}>
                      {d.clientName} ({d.location})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] text-muted-foreground">
                  Nenhum cliente similar encontrado.
                </p>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="p-4 md:p-6 border-t shrink-0 flex flex-col sm:flex-row gap-2 bg-background">
          {onPrioritize && (
            <Button
              className="min-h-[48px] md:min-h-[44px] lg:min-h-[40px] w-full text-[14px] font-bold leading-[20px] bg-red-600 hover:bg-red-700 text-white"
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
              className="min-h-[48px] md:min-h-[44px] lg:min-h-[40px] w-full text-[14px] font-bold leading-[20px] bg-gray-200 text-gray-800 hover:bg-gray-300"
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
            className="min-h-[48px] md:min-h-[44px] lg:min-h-[40px] w-full text-[14px] font-bold leading-[20px]"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
