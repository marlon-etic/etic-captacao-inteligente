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
import { ScrollArea } from '@/components/ui/scroll-area'
import { BookOpen } from 'lucide-react'

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

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)

  return (
    <>
      <Card className="w-full min-h-[140px] md:min-h-[160px] rounded-[12px] mb-[16px] border border-[#FF4444]/20 bg-[#FFF0F0] transition-all hover:shadow-md flex flex-col relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#FF4444]" />
        <CardContent className="p-[16px] pl-[20px] flex flex-col flex-1">
          <div className="flex justify-between items-start mb-[12px]">
            <Badge className="bg-[#FF4444] text-white font-bold text-[10px] hover:bg-[#FF4444]">
              🔴 AGRUPADO
            </Badge>
            <Badge
              variant="outline"
              className="bg-white text-[#333333] border-[#E5E5E5] font-bold text-[10px]"
            >
              {group.type}
            </Badge>
          </div>

          <div className="flex flex-col gap-[4px] flex-grow">
            <h3 className="text-[16px] font-bold text-[#FF4444] leading-tight flex items-center gap-2">
              👥 {group.demands.length} clientes interessados neste perfil
            </h3>

            <div className="bg-white/80 p-[12px] rounded-[8px] border border-[#FF4444]/10 mt-[8px] space-y-[4px]">
              <p className="text-[12px] text-[#333333]">
                📍 <span className="font-bold">{group.location}</span>
              </p>
              <p className="text-[14px] font-bold text-[#333333]">
                💰 R$ {formatCurrency(group.minBudget)} - R$ {formatCurrency(group.maxBudget)}
              </p>
              <p className="text-[12px] text-[#333333]">
                🏠 {group.bedrooms} dorm, {group.bathrooms} banh, {group.parkingSpots} vagas
              </p>
            </div>
          </div>

          <Button
            className="w-full h-[44px] mt-[16px] bg-white border border-[#FF4444] text-[#FF4444] hover:bg-[#FF4444] hover:text-white font-bold text-[14px] transition-colors"
            onClick={() => setShowModal(true)}
          >
            <BookOpen className="w-[16px] h-[16px] mr-[8px]" />
            Ver Todos os {group.demands.length} Clientes
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col p-0">
          <DialogHeader className="p-[24px] border-b bg-[#FFF0F0] shrink-0">
            <DialogTitle className="text-[20px] font-bold text-[#FF4444] flex items-center gap-2">
              👥 Clientes Agrupados
            </DialogTitle>
            <DialogDescription className="text-[#333333]">
              Demandas similares para o perfil selecionado
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-[24px]">
            <div className="space-y-[16px]">
              {group.demands.map((d) => (
                <div
                  key={d.id}
                  className="p-[16px] border border-[#E5E5E5] rounded-[12px] bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[16px] text-[#333333]">{d.clientName}</p>
                      <p className="text-[12px] text-[#999999] mt-1">
                        Orçamento: R$ {formatCurrency(d.maxBudget)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[#4444FF] border-[#4444FF]/20 bg-[#4444FF]/5"
                    >
                      {d.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
