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
import { BookOpen, MapPin, Bed, Check, X, Users, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DemandDetailsModal } from './DemandDetailsModal'
import useAppStore from '@/stores/useAppStore'
import { toast } from '@/hooks/use-toast'

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
  oldestDate: number
  tier: number
}

export function GroupedDemandCard({
  group,
  onAction,
}: {
  group: GroupedDemand
  onAction?: (id: string, action: 'encontrei' | 'nao_encontrei') => void
}) {
  const [showModal, setShowModal] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const { users } = useAppStore()

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)

  const getUserName = (id?: string) => users.find((u) => u.id === id)?.name || 'Desconhecido'

  const isTier1 = group.tier === 1
  const isTier2 = group.tier === 2

  const bgClass = 'bg-[#E8F0F8]'
  const borderClass =
    isTier1 || isTier2 ? 'border-[3px] border-[#1A3A52]' : 'border-[2px] border-[#1A3A52]'

  const badgeColor = isTier1
    ? 'bg-[#F44336] text-white hover:bg-[#d32f2f]'
    : isTier2
      ? 'bg-[#FF9800] text-white hover:bg-[#F57C00]'
      : 'bg-[#1A3A52] text-white hover:bg-[#153043]'

  const icon = isTier1 ? '🔥 ' : '👥 '
  const tierLabel = isTier1 ? 'ALTA PRIORIDADE' : isTier2 ? 'MÉDIA PRIORIDADE' : 'AGRUPADO'

  const handleGroupAction = (actionType: 'encontrei' | 'nao_encontrei') => {
    if (actionType === 'encontrei') {
      toast({
        title: '✅ Em Captação',
        description: `Busca iniciada para o grupo de ${group.demands.length} clientes.`,
        className: 'bg-[#4CAF50] text-white border-none',
      })
    } else {
      toast({
        title: '❌ Descartado',
        description: `Busca pausada para o grupo.`,
        variant: 'destructive',
      })
    }
    onAction?.(group.id, actionType)
  }

  return (
    <>
      <Card
        className={cn(
          'w-full h-full min-h-[auto] min-[480px]:min-h-[200px] md:min-h-[220px] rounded-[12px] transition-all hover:shadow-lg flex flex-col relative overflow-hidden',
          bgClass,
          borderClass,
        )}
      >
        <CardContent className="p-[16px] flex flex-col flex-1 h-full gap-3">
          <div className="flex justify-between items-start gap-2">
            <Badge className={cn('font-bold text-[12px] leading-tight px-2 py-1', badgeColor)}>
              {icon}
              {tierLabel}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white text-[#333333] border-[#1A3A52]/20 font-bold text-[12px] px-2 py-1 shrink-0"
            >
              {group.type}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 flex-grow">
            <h3 className="text-[18px] md:text-[20px] font-bold leading-tight text-[#1A3A52] flex items-center gap-2">
              <Users className="w-5 h-5 shrink-0" />
              <span>{group.demands.length} clientes interessados</span>
            </h3>

            <div className="bg-white/80 p-3 rounded-xl border border-[#1A3A52]/10 space-y-1.5 shadow-sm">
              <p className="text-[13px] md:text-[14px] text-[#333333] flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#1A3A52]" />
                <span className="font-bold">{group.location}</span>
              </p>
              <p className="text-[14px] md:text-[16px] font-bold text-[#1A3A52] flex items-center gap-1.5">
                💰 R$ {formatCurrency(group.minBudget)} - R$ {formatCurrency(group.maxBudget)}
              </p>
              <p className="text-[13px] md:text-[14px] text-[#333333] flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-[#1A3A52]" />
                <span>
                  {group.bedrooms} dorm, {group.bathrooms} banh, {group.parkingSpots} vagas
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 shrink-0">
            <Button
              className="w-full min-h-[44px] bg-[#FFFFFF] border-2 border-[#1A3A52] text-[#1A3A52] hover:bg-[#F5F5F5] font-bold text-[14px]"
              onClick={() => setShowModal(true)}
            >
              <BookOpen className="w-4 h-4 mr-2 shrink-0" />
              Ver os {group.demands.length} Clientes
            </Button>

            <div className="grid grid-cols-2 gap-2">
              <Button
                className="w-full min-h-[44px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold px-2"
                onClick={() => handleGroupAction('encontrei')}
              >
                <Check className="w-4 h-4 mr-1.5 shrink-0" /> Encontrei
              </Button>
              <Button
                className="w-full min-h-[44px] bg-[#FFFFFF] hover:bg-[#F5F5F5] border-2 border-[#E5E5E5] text-[#333333] font-bold px-2"
                onClick={() => handleGroupAction('nao_encontrei')}
              >
                <X className="w-4 h-4 mr-1.5 shrink-0" /> Não
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-[700px] h-[85vh] flex flex-col p-0 rounded-[12px] bg-white border-[2px] border-[#1A3A52]">
          <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] shrink-0 bg-[#F5F5F5] rounded-t-[10px]">
            <DialogTitle className="text-[18px] md:text-[22px] font-bold flex items-center gap-2 text-[#1A3A52]">
              <Users className="w-6 h-6 text-[#1A3A52]" />
              Lista de Clientes do Grupo
            </DialogTitle>
            <DialogDescription className="text-[#333333] text-[14px] mt-1 font-medium">
              {group.location} • {group.bedrooms} dorm • R$ {formatCurrency(group.minBudget)} a R${' '}
              {formatCurrency(group.maxBudget)}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="flex-1 p-4 md:p-6">
            <div className="space-y-4">
              {group.demands.map((d) => (
                <div
                  key={d.id}
                  className="p-4 border-[2px] border-[#E5E5E5] rounded-xl bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-[#1A3A52]/30 transition-colors"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-[16px] text-[#1A3A52] truncate">
                        {d.clientName}
                      </h4>
                      <Badge
                        variant="outline"
                        className="text-[11px] h-[20px] bg-[#F5F5F5] text-[#333333] border-none px-2 shrink-0"
                      >
                        {d.status}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#333333]">
                      <span className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5" /> SDR/Realtor: {getUserName(d.createdBy)}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />{' '}
                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                      <span className="font-bold text-[#1A3A52]">
                        💰 R$ {formatCurrency(d.maxBudget || d.budget || 0)}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-[2px] border-[#1A3A52] text-[#1A3A52] hover:bg-[#F5F5F5] font-bold"
                    onClick={() => setSelectedDemand(d)}
                  >
                    Ver Detalhes
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <DemandDetailsModal
        open={!!selectedDemand}
        onOpenChange={(open) => !open && setSelectedDemand(null)}
        demand={selectedDemand || undefined}
      />
    </>
  )
}
