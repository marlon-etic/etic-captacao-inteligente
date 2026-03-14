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
  const { getSimilarDemands } = useAppStore()

  if (!demand) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="p-[16px]">
          <div className="text-center text-[14px] text-destructive font-medium">
            Erro ao carregar. Tente novamente.
          </div>
          <Button onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogContent>
      </Dialog>
    )
  }

  const similarDemands = getSimilarDemands(demand.id)

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  let statusLabel = 'Aberta'
  if (demand.status === 'Perdida') statusLabel = 'Perdida'
  else if (demand.isPrioritized) statusLabel = 'Priorizada'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-[100dvh] sm:h-[85vh] sm:max-w-[700px] p-0 flex flex-col rounded-none sm:rounded-[12px] border-0 sm:border gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-[16px] border-b shrink-0 flex flex-row items-center justify-between bg-muted/10 text-left relative">
          <DialogTitle className="text-[16px] font-bold leading-[24px] m-0 p-0 pr-[32px] truncate">
            Detalhes da Demanda - {demand.clientName}
          </DialogTitle>
          <DialogClose className="absolute right-[16px] top-[12px] w-[32px] h-[32px] flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-[16px]">
          <div className="space-y-[24px] pb-[24px]">
            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                👤 Informações do Cliente
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Nome
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">{demand.clientName}</span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Email
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    {demand.clientEmail || 'Não informado'}
                  </span>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Telefone
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">Não informado</span>
                </div>
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                📍 Detalhes da Demanda
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div className="col-span-1 sm:col-span-2">
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Localização
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">{demand.location}</span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    💰 Orçamento
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    R$ {formatPrice(demand.minBudget)} - R$ {formatPrice(demand.maxBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    🏠 Perfil
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    {demand.bedrooms || 0} dorm, {demand.bathrooms || 0} banh,{' '}
                    {demand.parkingSpots || 0} vagas
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                📝 Necessidades
              </h4>
              <p className="text-[14px] leading-[20px]">
                {demand.description || 'Nenhuma descrição detalhada.'}
              </p>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                ⏰ Informações Adicionais
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-[12px]">
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Urgência
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold text-orange-700">
                    {demand.timeframe}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    📊 Status
                  </span>
                  <Badge variant="outline" className="mt-1">
                    {statusLabel}
                  </Badge>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    📅 Data de Criação
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    📅 Data de Finalização
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    {demand.status === 'Negócio' &&
                    demand.capturedProperties?.find((p) => p.fechamentoDate)
                      ? new Date(
                          demand.capturedProperties.find((p) => p.fechamentoDate)!.fechamentoDate!,
                        ).toLocaleDateString('pt-BR')
                      : '-'}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                👥 Clientes Similares
              </h4>
              {similarDemands.length > 0 ? (
                <ul className="list-disc pl-[20px] text-[14px] leading-[20px]">
                  {similarDemands.map((d) => (
                    <li key={d.id}>
                      {d.clientName} ({d.location})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[14px] leading-[20px] text-muted-foreground">
                  Nenhum cliente similar encontrado.
                </p>
              )}
            </section>
          </div>
        </div>

        <DialogFooter className="p-[16px] border-t shrink-0 flex flex-col sm:flex-row gap-[8px] bg-background">
          {onPrioritize && (
            <Button
              className="h-[44px] md:h-[40px] w-full text-[14px] leading-[20px] bg-red-600 hover:bg-red-700 text-white"
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
              className="h-[44px] md:h-[40px] w-full text-[14px] leading-[20px] bg-gray-200 text-gray-800 hover:bg-gray-300"
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
            className="h-[44px] md:h-[40px] w-full text-[14px] leading-[20px]"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
