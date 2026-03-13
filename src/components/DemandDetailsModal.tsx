import { X, CheckCircle2, XCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import { useTimeElapsed } from '@/hooks/useTimeElapsed'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demand?: Demand
  onAction?: (action: 'encontrei' | 'nao_encontrei') => void
}

export function DemandDetailsModal({ open, onOpenChange, demand, onAction }: Props) {
  const timeElapsed = useTimeElapsed(demand?.createdAt)

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

  const { text } = timeElapsed

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full h-[100dvh] sm:h-[85vh] sm:max-w-[700px] p-0 flex flex-col rounded-none sm:rounded-[12px] border-0 sm:border gap-0 overflow-hidden bg-background">
        <DialogHeader className="p-[16px] border-b shrink-0 flex flex-row items-center justify-between bg-muted/10 text-left relative">
          <DialogTitle className="text-[16px] font-bold leading-[24px] m-0 p-0">
            Detalhes da Demanda
          </DialogTitle>
          <DialogClose className="absolute right-[16px] top-[12px] w-[32px] h-[32px] flex items-center justify-center rounded-full bg-muted/50 hover:bg-muted transition-colors">
            <X className="w-5 h-5" />
          </DialogClose>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-[16px]">
          <div className="space-y-[24px] pb-[24px]">
            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                Informações do Cliente
              </h4>
              <div className="flex flex-col gap-[8px]">
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
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                Detalhes da Demanda
              </h4>
              <div className="grid grid-cols-2 gap-[12px]">
                <div className="col-span-2">
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Localização
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">{demand.location}</span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Orçamento Mín.
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    R$ {formatPrice(demand.minBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Orçamento Máx.
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    R$ {formatPrice(demand.maxBudget)}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Dormitórios
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">{demand.bedrooms}</span>
                </div>
                <div>
                  <span className="text-[12px] leading-[16px] text-muted-foreground block">
                    Vagas
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">
                    {demand.parkingSpots}
                  </span>
                </div>
              </div>
            </section>

            <section className="space-y-[12px]">
              <h4 className="text-[16px] font-bold leading-[24px] border-b pb-[8px]">
                Urgência e Tempo
              </h4>
              <div className="flex flex-col gap-[8px]">
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
                    Criado há
                  </span>
                  <span className="text-[14px] leading-[20px] font-bold">{text}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        {onAction && (
          <div className="p-[16px] border-t shrink-0 flex flex-col sm:flex-row gap-[8px] bg-background">
            <Button
              className="h-[44px] w-full text-[14px] leading-[20px] bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => onAction('encontrei')}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> Encontrei Imóvel
            </Button>
            <Button
              className="h-[44px] w-full text-[14px] leading-[20px]"
              variant="outline"
              onClick={() => onAction('nao_encontrei')}
            >
              <XCircle className="w-5 h-5 mr-2 text-destructive" /> Não Encontrei
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
