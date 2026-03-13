import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Demand } from '@/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from '@/components/ui/drawer'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, MapPin, Search } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'
import { ContactSolicitorAction } from '@/components/ContactSolicitorAction'
import useAppStore from '@/stores/useAppStore'

export interface GroupedDemand {
  id: string
  location: string
  type: string
  bedrooms: number
  bathrooms: number
  parkingSpots: number
  minBudget: number
  maxBudget: number
  demands: Demand[]
}

export function GroupedDemandCard({
  group,
  onAction,
}: {
  group: GroupedDemand
  onAction: (id: string, action: 'encontrei' | 'nao_encontrei') => void
}) {
  const [showModal, setShowModal] = useState(false)
  const isMobile = useIsMobile()
  const { users } = useAppStore()

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)

  const content = (
    <div className="space-y-4 pb-6 px-4 sm:px-6">
      {group.demands.map((d) => {
        const solicitor = users.find((u) => u.id === d.createdBy)
        return (
          <div key={d.id} className="p-4 border rounded-lg bg-muted/20 space-y-3">
            <div className="flex flex-col sm:flex-row justify-between gap-2">
              <div>
                <p className="font-semibold text-base">{d.clientName}</p>
                <p className="text-sm text-muted-foreground">
                  {d.clientEmail || 'Email não informado'}
                </p>
                <p className="text-sm text-muted-foreground">Telefone não informado</p>
              </div>
              <Badge variant="outline" className="self-start">
                {d.status}
              </Badge>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                size="sm"
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => onAction(d.id, 'encontrei')}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" /> ✅ Encontrei Imóvel
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex-1 text-destructive hover:bg-destructive/10"
                onClick={() => onAction(d.id, 'nao_encontrei')}
              >
                <XCircle className="w-4 h-4 mr-1.5" /> ❌ Não Encontrei
              </Button>
              <ContactSolicitorAction
                demand={d}
                solicitor={solicitor}
                className="flex-1"
                buttonClassName="w-full h-9"
                buttonText="💬 Contatar"
              />
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <>
      <Card className="w-full transition-all hover:shadow-md flex flex-col h-full relative overflow-hidden border-2 border-red-200 bg-red-50/10">
        <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
        <CardContent className="p-4 flex flex-col gap-3 flex-grow pl-5">
          <div className="flex justify-between items-start gap-2">
            <Badge className="bg-red-100 text-red-800 border-red-300 whitespace-nowrap font-bold">
              🔴 AGRUPADO
            </Badge>
            <Badge variant="outline" className="bg-background">
              {group.type}
            </Badge>
          </div>

          <h3 className="font-bold text-lg text-red-950 flex items-center gap-2 mt-1 leading-tight">
            <span className="text-xl">👥</span>
            {group.demands.length} clientes interessados neste perfil
          </h3>

          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground bg-white/80 p-3 rounded-lg border border-red-100">
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">📍</span>
              <span className="font-medium text-foreground">Bairro: {group.location}</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">💰</span>
              <span className="font-medium text-foreground">
                Orçamento: {formatCurrency(group.minBudget)} - {formatCurrency(group.maxBudget)}
              </span>
            </p>
            <p className="flex items-start gap-2">
              <span className="shrink-0 text-base leading-none">🏠</span>
              <span className="font-medium text-foreground">
                Perfil: {group.bedrooms} dorm, {group.bathrooms} banh, {group.parkingSpots} vagas
              </span>
            </p>
          </div>
        </CardContent>
        <div className="p-4 pt-0 pl-5 border-t border-red-100 bg-red-50/30 mt-auto">
          <Button
            className="w-full mt-3 bg-red-600 hover:bg-red-700 text-white shadow-sm font-semibold"
            onClick={() => setShowModal(true)}
          >
            📖 Ver Todos os {group.demands.length} Clientes
          </Button>
        </div>
      </Card>

      {isMobile ? (
        <Drawer open={showModal} onOpenChange={setShowModal}>
          <DrawerContent className="max-h-[90vh] bg-background">
            <DrawerHeader className="text-left border-b pb-4 px-4">
              <DrawerTitle className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">👥</span> Clientes Agrupados
              </DrawerTitle>
              <DrawerDescription>Demandas similares para {group.location}</DrawerDescription>
            </DrawerHeader>
            <ScrollArea className="overflow-y-auto mt-2">{content}</ScrollArea>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[650px] h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
            <DialogHeader className="px-6 py-4 border-b shrink-0 bg-red-50/30">
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <span className="text-2xl">👥</span> Clientes Agrupados
              </DialogTitle>
              <DialogDescription>Demandas similares para {group.location}</DialogDescription>
            </DialogHeader>
            <ScrollArea className="flex-1 py-4">{content}</ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
