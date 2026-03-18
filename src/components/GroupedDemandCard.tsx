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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { BookOpen, MapPin, Bed, Check, X, Users, Calendar, MessageSquare, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DemandDetailsModal } from './DemandDetailsModal'
import { EncontreiGrupoModal } from './EncontreiGrupoModal'
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
  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null)
  const [newComment, setNewComment] = useState('')
  const { users, groupComments, addGroupComment, currentUser } = useAppStore()

  const groupCommentsForThisGroup = groupComments
    .filter((c) => c.groupId === group.id)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)

  const getUserName = (id?: string) => users.find((u) => u.id === id)?.name || 'Desconhecido'

  // Only count demands that are not lost or finished
  const activeDemandsInGroup = group.demands.filter(
    (d) => !['Perdida', 'Impossível', 'Negócio'].includes(d.status),
  )
  const clientCount = activeDemandsInGroup.length

  if (clientCount === 0) return null // Hide card if group is empty/inactive

  let bgClass = 'bg-[#e3f2fd]'
  let badgeLabel = `🔵 ${clientCount} clientes`
  let badgeColor = 'bg-[#2196F3] text-white hover:bg-[#1976D2]'

  if (clientCount >= 7) {
    bgClass = 'bg-[#ffebee]'
    badgeLabel = `🔥 ${clientCount} clientes`
    badgeColor = 'bg-[#F44336] text-white hover:bg-[#d32f2f]'
  } else if (clientCount >= 4) {
    bgClass = 'bg-[#fff3e0]'
    badgeLabel = `🟠 ${clientCount} clientes`
    badgeColor = 'bg-[#FF9800] text-white hover:bg-[#F57C00]'
  }

  const isCaptador = currentUser?.role === 'captador'
  const displayClientName = (name: string) => (isCaptador ? 'Cliente Oculto' : name)

  const handleGroupAction = (actionType: 'encontrei' | 'nao_encontrei') => {
    if (actionType === 'encontrei') {
      setShowCaptureModal(true)
    } else {
      toast({
        title: '❌ Descartado',
        description: `Busca pausada para o grupo.`,
        variant: 'destructive',
      })
      onAction?.(group.id, actionType)
    }
  }

  const handleSendComment = () => {
    if (!newComment.trim()) return
    addGroupComment(group.id, newComment)
    setNewComment('')
  }

  return (
    <>
      <Card
        className={cn(
          'w-full h-full min-h-[auto] min-[480px]:min-h-[200px] md:min-h-[220px] rounded-[12px] transition-all hover:shadow-lg flex flex-col relative overflow-hidden border-[2px] border-[#1A3A52]/20',
          bgClass,
        )}
      >
        <CardContent className="p-[16px] flex flex-col flex-1 h-full gap-3">
          <div className="flex justify-between items-start gap-2">
            <Badge
              className={cn(
                'font-bold text-[14px] leading-tight px-3 py-1.5 min-h-[28px]',
                badgeColor,
              )}
            >
              {badgeLabel}
            </Badge>
            <Badge
              variant="outline"
              className="bg-white text-[#333333] border-[#1A3A52]/20 font-bold text-[12px] px-2 py-1.5 min-h-[28px] shrink-0 shadow-sm"
            >
              {group.type}
            </Badge>
          </div>

          <div className="flex flex-col gap-2 flex-grow">
            <div className="bg-white/90 p-3 rounded-xl border border-[#1A3A52]/10 space-y-2 shadow-sm">
              <p className="text-[14px] md:text-[15px] text-[#333333] flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#1A3A52]" />
                <span className="font-bold break-words whitespace-normal leading-tight">
                  {group.location}
                </span>
              </p>
              <p className="text-[15px] md:text-[17px] font-black text-[#1A3A52] flex items-center gap-2">
                💰 R$ {formatCurrency(group.minBudget)} - R$ {formatCurrency(group.maxBudget)}
              </p>
              <p className="text-[13px] md:text-[14px] text-[#333333] flex items-center gap-2 font-medium">
                <Bed className="w-4 h-4 text-[#1A3A52]" />
                <span>
                  {group.bedrooms} dorm • {group.parkingSpots} vagas
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 shrink-0">
            <Button
              className="w-full min-h-[48px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[12px] sm:text-[14px] shadow-sm leading-tight px-4 whitespace-normal break-words h-auto py-3"
              onClick={() => handleGroupAction('encontrei')}
            >
              <Check className="w-5 h-5 mr-2 shrink-0" /> ENCONTREI IMÓVEL PARA ESTE GRUPO
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              <Button
                className="w-full min-h-[44px] bg-[#FFFFFF] border border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5] font-bold text-[14px] px-4 whitespace-normal break-words"
                onClick={() => setShowModal(true)}
              >
                <Users className="w-5 h-5 mr-2 shrink-0 text-[#1A3A52]" />
                Ver {clientCount} Clientes
              </Button>
              <Button
                className="w-full min-h-[44px] bg-[#FFFFFF] hover:bg-[#F5F5F5] border border-[#E5E5E5] text-[#F44336] font-bold text-[14px] px-4 whitespace-normal break-words"
                onClick={() => handleGroupAction('nao_encontrei')}
              >
                <X className="w-5 h-5 mr-2 shrink-0" /> Não Encontrei
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <EncontreiGrupoModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        demandIds={activeDemandsInGroup.map((d) => d.id)}
      />

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-[700px] h-[85vh] flex flex-col p-0 rounded-[12px] bg-white border-[2px] border-[#1A3A52] overflow-hidden">
          <DialogHeader className="p-4 md:p-6 border-b border-[#E5E5E5] shrink-0 bg-[#1A3A52] text-white rounded-t-[10px] relative">
            <DialogTitle className="text-[18px] md:text-[22px] font-bold flex items-center gap-2 text-white pr-8">
              <Users className="w-6 h-6" />
              Detalhes do Grupo ({clientCount} clientes)
            </DialogTitle>
            <DialogDescription className="text-white/80 text-[14px] mt-1 font-medium">
              {group.location} • {group.bedrooms} dorm • R$ {formatCurrency(group.minBudget)} a R${' '}
              {formatCurrency(group.maxBudget)}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="clientes" className="flex-1 flex flex-col min-h-0 bg-[#F5F5F5]">
            <div className="px-4 pt-4 shrink-0 bg-[#F5F5F5]">
              <TabsList className="w-full grid grid-cols-2 bg-[#E5E5E5] rounded-[8px] p-1">
                <TabsTrigger
                  value="clientes"
                  className="font-bold data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white rounded-[6px]"
                >
                  Lista de Clientes
                </TabsTrigger>
                <TabsTrigger
                  value="chat"
                  className="font-bold data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white rounded-[6px] flex items-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Chat da Demanda
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              value="clientes"
              className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <ScrollArea className="flex-1 p-4 md:p-6">
                <div className="space-y-4">
                  {activeDemandsInGroup.map((d) => (
                    <div
                      key={d.id}
                      className="p-4 border-[2px] border-[#E5E5E5] rounded-xl bg-white flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between hover:border-[#1A3A52]/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4
                            className={cn(
                              'font-bold text-[16px] truncate',
                              isCaptador ? 'text-[#999999] italic' : 'text-[#1A3A52]',
                            )}
                          >
                            {displayClientName(d.clientName)}
                          </h4>
                          <Badge
                            variant="outline"
                            className="text-[12px] h-[24px] bg-[#F5F5F5] text-[#333333] border-none px-2 shrink-0 font-bold"
                          >
                            {d.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-[#333333]">
                          <span className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> SDR/Realtor:{' '}
                            {getUserName(d.createdBy)}
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
                        className="w-full sm:w-auto border-[2px] border-[#1A3A52] text-[#1A3A52] hover:bg-[#F5F5F5] font-bold min-h-[44px]"
                        onClick={() => setSelectedDemand(d)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent
              value="chat"
              className="flex-1 overflow-hidden m-0 data-[state=active]:flex data-[state=active]:flex-col"
            >
              <div className="flex-1 flex flex-col p-4 md:p-6 gap-4 overflow-hidden bg-white m-4 mt-0 rounded-[12px] border-[2px] border-[#E5E5E5] shadow-sm">
                <ScrollArea className="flex-1 pr-4">
                  <div className="space-y-4 pb-4">
                    {groupCommentsForThisGroup.length === 0 && (
                      <p className="text-center text-[#999999] text-[14px] font-medium py-8">
                        Nenhum comentário ainda. Inicie a colaboração!
                      </p>
                    )}
                    {groupCommentsForThisGroup.map((c) => (
                      <div key={c.id} className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[14px] text-[#1A3A52]">{c.userName}</span>
                          <Badge
                            variant="secondary"
                            className="text-[12px] h-[20px] px-1.5 capitalize bg-[#E8F0F8] text-[#1A3A52] border-none font-bold"
                          >
                            {c.userRole}
                          </Badge>
                          <span className="text-[12px] text-[#999999] ml-auto">
                            {new Date(c.createdAt).toLocaleString('pt-BR').slice(0, 16)}
                          </span>
                        </div>
                        <div className="bg-[#F5F5F5] text-[#333333] text-[14px] p-3 rounded-[8px] rounded-tl-none border border-[#E5E5E5]">
                          {c.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2 pt-4 border-t border-[#E5E5E5] shrink-0">
                  <Textarea
                    placeholder="Digite sua mensagem..."
                    className="min-h-[48px] h-[48px] resize-none border-[2px] border-[#E5E5E5] focus-visible:ring-[#1A3A52]"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSendComment()
                      }
                    }}
                  />
                  <Button
                    onClick={handleSendComment}
                    className="h-[48px] min-h-[48px] px-4 shrink-0 bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold border-none"
                  >
                    <Send className="w-5 h-5 mr-2" />
                    Enviar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
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
