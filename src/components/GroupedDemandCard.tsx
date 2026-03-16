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
import { cn } from '@/lib/utils'

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

  const isSale = group.type === 'Venda'
  const mainColorClass = isSale ? 'bg-[#FF4444]' : 'bg-[#4444FF]'
  const mainTextClass = isSale ? 'text-[#FF4444]' : 'text-[#4444FF]'
  const mainBorderClass = isSale ? 'border-[#FF4444]' : 'border-[#4444FF]'
  const mainHoverBgClass = isSale ? 'hover:bg-[#FF4444]' : 'hover:bg-[#4444FF]'
  const lightBgClass = isSale ? 'bg-[#FFF0F0]' : 'bg-[#F0F0FF]'
  const lightBorderClass = isSale ? 'border-[#FF4444]/20' : 'border-[#4444FF]/20'

  return (
    <>
      <Card
        className={cn(
          'w-full min-h-[140px] md:min-h-[160px] lg:min-h-[180px] rounded-[12px] border transition-all hover:shadow-md flex flex-col relative overflow-hidden',
          lightBgClass,
          lightBorderClass,
        )}
      >
        <div className={cn('absolute left-0 top-0 bottom-0 w-[3px]', mainColorClass)} />
        <CardContent className="p-4 pl-5 lg:p-5 lg:pl-6 flex flex-col flex-1">
          <div className="flex justify-between items-start mb-3">
            <Badge
              className={cn(
                'text-white font-bold text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] px-2.5 py-1',
                mainColorClass,
                mainHoverBgClass,
              )}
            >
              🔴 AGRUPADO
            </Badge>
            <Badge
              variant="outline"
              className="bg-white text-[#333333] border-[#E5E5E5] font-bold text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] px-2.5 py-1"
            >
              {group.type}
            </Badge>
          </div>

          <div className="flex flex-col gap-1 flex-grow">
            <h3
              className={cn(
                'text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] flex items-center gap-2',
                mainTextClass,
              )}
            >
              👥 {group.demands.length} clientes interessados
            </h3>

            <div
              className={cn('bg-white/80 p-3 rounded-lg border mt-2 space-y-1', lightBorderClass)}
            >
              <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#333333] leading-[16px] md:leading-[18px] lg:leading-[20px]">
                📍 <span className="font-bold">{group.location}</span>
              </p>
              <p className="text-[14px] md:text-[16px] lg:text-[18px] font-bold text-[#333333] leading-[20px] md:leading-[24px] lg:leading-[28px]">
                💰 R$ {formatCurrency(group.minBudget)} - R$ {formatCurrency(group.maxBudget)}
              </p>
              <p className="text-[12px] md:text-[13px] lg:text-[14px] text-[#333333] leading-[16px] md:leading-[18px] lg:leading-[20px]">
                🏠 {group.bedrooms} dorm, {group.bathrooms} banh, {group.parkingSpots} vagas
              </p>
            </div>
          </div>

          <Button
            className={cn(
              'w-full h-[48px] md:h-[44px] lg:h-[40px] min-w-[48px] mt-auto pt-4 bg-white border font-bold text-[14px] leading-[20px] transition-colors hover:text-white',
              mainBorderClass,
              mainTextClass,
              mainHoverBgClass,
            )}
            onClick={() => setShowModal(true)}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Ver Todos os {group.demands.length} Clientes
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-[600px] h-[80vh] flex flex-col p-0 rounded-xl">
          <DialogHeader className={cn('p-4 md:p-6 border-b shrink-0', lightBgClass)}>
            <DialogTitle
              className={cn(
                'text-[18px] md:text-[20px] font-bold flex items-center gap-2 leading-[28px] md:leading-[30px]',
                mainTextClass,
              )}
            >
              👥 Clientes Agrupados
            </DialogTitle>
            <DialogDescription className="text-[#333333] text-[13px] md:text-[14px] leading-[18px] md:leading-[20px]">
              Demandas similares para o perfil selecionado
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-4">
              {group.demands.map((d) => (
                <div
                  key={d.id}
                  className="p-4 border border-[#E5E5E5] rounded-xl bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-[14px] md:text-[16px] lg:text-[18px] leading-[20px] md:leading-[24px] lg:leading-[28px] text-[#333333] truncate">
                        {d.clientName}
                      </p>
                      <p className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] text-[#999999] mt-1">
                        Orçamento: R$ {formatCurrency(d.maxBudget || 0)}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className="text-[#999999] border-[#999999]/20 bg-[#999999]/5 shrink-0 whitespace-nowrap text-[12px] leading-[16px] px-2 py-1"
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
