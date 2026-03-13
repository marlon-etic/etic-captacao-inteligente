import { User, MapPin, Search, Clock, History, Zap, CheckCircle2, XCircle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import { useIsMobile } from '@/hooks/use-mobile'
import { useTimeElapsed, useSlaCountdown } from '@/hooks/useTimeElapsed'
import useAppStore from '@/stores/useAppStore'
import { ContactSolicitorAction } from '@/components/ContactSolicitorAction'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demand?: Demand
  onAction?: (action: 'encontrei' | 'nao_encontrei') => void
}

export function DemandDetailsModal({ open, onOpenChange, demand, onAction }: Props) {
  const isMobile = useIsMobile()
  const { getSimilarDemands, users } = useAppStore()

  const timeElapsed = useTimeElapsed(demand?.createdAt)
  const slaInfo = useSlaCountdown(
    demand?.createdAt,
    demand?.isExtension48h,
    demand?.extensionRequestedAt,
    demand?.status,
  )

  if (!demand) {
    const err = (
      <div className="p-6 text-center text-destructive font-medium">
        Erro ao carregar detalhes. Tente novamente.
      </div>
    )
    return isMobile ? (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>{err}</DrawerContent>
      </Drawer>
    ) : (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>{err}</DialogContent>
      </Dialog>
    )
  }

  const { text } = timeElapsed
  const similarCount = getSimilarDemands(demand.id).length
  const captadoresCount = users.filter((u) => u.role === 'captador').length
  const solicitor = users.find((u) => u.id === demand.createdBy)

  const formatPrice = (val?: number, type?: string) => {
    if (!val) return 'Não informado'
    const formatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
    return type === 'Aluguel' ? `${formatted}/mês` : formatted
  }

  const content = (
    <div className="space-y-6 pb-6">
      {demand.status === 'Pendente' && slaInfo.text && (
        <div className="bg-orange-50 border border-orange-200 text-orange-900 p-4 rounded-lg flex items-center justify-between">
          <div>
            <h4 className="font-bold">Tempo Restante (SLA)</h4>
            <p className="text-sm">
              Esta demanda expira em breve. Evite punições respondendo agora.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black">{slaInfo.text.replace('⏰ ', '')}</span>
          </div>
        </div>
      )}

      <section className="space-y-3">
        <h4 className="flex items-center gap-2 font-semibold text-blue-700 border-b pb-2">
          <User className="w-5 h-5" /> SEÇÃO 1: Informações do Cliente
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Nome Completo
            </span>
            <span className="font-medium">{demand.clientName || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Solicitado por
            </span>
            <span className="font-medium">{solicitor?.name || 'Desconhecido'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Email
            </span>
            <span className="font-medium">{demand.clientEmail || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Telefone
            </span>
            <span className="font-medium">Não informado</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="flex items-center gap-2 font-semibold text-emerald-700 border-b pb-2">
          <MapPin className="w-5 h-5" /> SEÇÃO 2: Detalhes da Demanda
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
          <div className="col-span-2 sm:col-span-3">
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Localização
            </span>
            <span className="font-medium">{demand.location || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Orçamento Mínimo
            </span>
            <span className="font-medium">{formatPrice(demand.minBudget, demand.type)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Orçamento Máximo
            </span>
            <span className="font-medium">{formatPrice(demand.maxBudget, demand.type)}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Dormitórios
            </span>
            <span className="font-medium">{demand.bedrooms || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Banheiros
            </span>
            <span className="font-medium">{demand.bathrooms || 'Não informado'}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Vagas
            </span>
            <span className="font-medium">{demand.parkingSpots ?? 'Não informado'}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="flex items-center gap-2 font-semibold text-purple-700 border-b pb-2">
          <Search className="w-5 h-5" /> SEÇÃO 3: Necessidades Específicas
        </h4>
        <div className="space-y-4 text-sm bg-muted/20 p-4 rounded-lg">
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Necessidades
            </span>
            <span className="font-medium block whitespace-pre-wrap">
              {demand.description || 'Não informado'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Tipo de Transação
            </span>
            <span className="font-medium">{demand.type || 'Não informado'}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="flex items-center gap-2 font-semibold text-orange-700 border-b pb-2">
          <Clock className="w-5 h-5" /> SEÇÃO 4: Urgência e Prazo
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Urgência
            </span>
            <span className="font-medium text-orange-700 font-semibold">
              {demand.timeframe || 'Não informado'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Tempo de Aquisição
            </span>
            <span className="font-medium">{demand.timeframe || 'Não informado'}</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="flex items-center gap-2 font-semibold text-gray-700 border-b pb-2">
          <History className="w-5 h-5" /> SEÇÃO 5: Histórico
        </h4>
        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/20 p-4 rounded-lg">
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Data de Criação
            </span>
            <span className="font-medium">
              {new Date(demand.createdAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Tempo Aguardando
            </span>
            <span className="font-medium">{text}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Captadores Acionados
            </span>
            <span className="font-medium">{captadoresCount}</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs uppercase tracking-wider mb-1">
              Clientes com Perfil Similar
            </span>
            <span className="font-medium">{similarCount} clientes</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="flex items-center gap-2 font-semibold text-red-700 border-b pb-2">
          <Zap className="w-5 h-5" /> SEÇÃO 6: Ações Rápidas
        </h4>
        <div className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-12"
              onClick={() => {
                if (onAction) onAction('encontrei')
              }}
              disabled={!onAction}
            >
              <CheckCircle2 className="w-5 h-5 mr-2" /> ✅ Encontrei Imóvel
            </Button>
            <Button
              className="flex-1 h-12"
              variant="outline"
              onClick={() => {
                if (onAction) onAction('nao_encontrei')
              }}
              disabled={!onAction}
            >
              <XCircle className="w-5 h-5 mr-2 text-destructive" /> ❌ Não Encontrei
            </Button>
          </div>
          <ContactSolicitorAction
            demand={demand}
            solicitor={solicitor}
            buttonClassName="h-12 w-full text-sm font-semibold"
            buttonText="💬 Contatar"
          />
        </div>
      </section>
    </div>
  )

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh] bg-background">
          <DrawerHeader className="text-left border-b pb-4 px-4">
            <DrawerTitle className="text-xl font-bold">Detalhes da Demanda</DrawerTitle>
          </DrawerHeader>
          <ScrollArea className="px-4 py-4 overflow-y-auto">{content}</ScrollArea>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-4 border-b shrink-0 bg-muted/10">
          <DialogTitle className="text-xl font-bold">Detalhes da Demanda</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 px-6 py-6">{content}</ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
