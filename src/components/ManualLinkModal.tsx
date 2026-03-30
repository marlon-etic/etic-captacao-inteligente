import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Home, DollarSign, MapPin } from 'lucide-react'
import { CapturedProperty, Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { calculateMatching, getScoreBadgeColor, getScoreProgressColor } from '@/lib/matching'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'

interface ManualLinkModalProps {
  isOpen: boolean
  onClose: () => void
  property: CapturedProperty | null
}

export function ManualLinkModal({ isOpen, onClose, property }: ManualLinkModalProps) {
  const { demands, currentUser, linkLoosePropertyToDemand } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')

  const compatibleDemands = useMemo(() => {
    if (!property || !currentUser) return []

    return demands
      .map((d) => {
        const clienteMock = {
          bairros:
            d.location && Array.isArray(d.location)
              ? d.location
              : d.location?.split(',').map((s: string) => s.trim()) || [],
          valor_minimo: d.minBudget || 0,
          valor_maximo: d.maxBudget || d.budget || 0,
          dormitorios: d.bedrooms || 0,
          vagas_estacionamento: d.parkingSpots || 0,
          nivel_urgencia: 'Média',
        }

        const imovelMock = {
          endereco: Array.isArray(property.neighborhood)
            ? property.neighborhood[0]
            : property.neighborhood || '',
          preco: property.value || 0,
          dormitorios: property.bedrooms || property.dormitorios || 0,
          vagas: property.parkingSpots || property.vagas || 0,
        }

        const match = calculateMatching(imovelMock, clienteMock)
        return { ...d, score: match.score }
      })
      .filter((d) => {
        if (d.createdBy !== currentUser.id) return false
        if (['Perdida', 'Impossível', 'Negócio', 'Arquivado'].includes(d.status)) return false
        if (property.propertyType && d.type && property.propertyType !== d.type) return false

        return d.score >= 60
      })
      .sort((a, b) => b.score - a.score)
  }, [demands, currentUser, property])

  const filteredDemands = useMemo(() => {
    if (!searchTerm) return compatibleDemands
    return compatibleDemands.filter((d) =>
      d.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [compatibleDemands, searchTerm])

  const handleLink = (demand: Demand) => {
    if (!property) return
    const res = linkLoosePropertyToDemand(property.code, demand.id)
    if (res.success) {
      toast({
        title: 'Sucesso',
        description: `Imóvel vinculado a ${demand.clientName} com sucesso!`,
        className: 'bg-[#4CAF50] text-white',
      })
      onClose()
      setSearchTerm('')
    } else {
      toast({
        title: 'Erro',
        description: res.message,
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          onClose()
          setSearchTerm('')
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FFFFFF]">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-[20px] text-[#1A3A52]">
            Vincular imóvel {property?.code} a qual cliente?
          </DialogTitle>
          <DialogDescription className="text-[#999999]">
            Selecione um cliente com demanda compatível para vincular este imóvel.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 shrink-0 border-b border-[#E5E5E5]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] w-4 h-4" />
            <Input
              placeholder="Buscar cliente por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-[48px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 bg-[#F5F5F5]">
          {compatibleDemands.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#333333] font-medium">
                Nenhum cliente seu tem demanda compatível
              </p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#333333] font-medium">Nenhum cliente encontrado com este nome</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDemands.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E5E5] shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[16px] text-[#1A3A52]">{d.clientName}</p>
                      <Badge variant="outline" className="mt-1">
                        {d.status}
                      </Badge>
                    </div>
                    <Badge
                      className={cn(
                        'text-[12px] font-black px-2.5 py-1 border-none shadow-sm',
                        getScoreBadgeColor(d.score),
                      )}
                    >
                      {d.score}% Match
                    </Badge>
                  </div>
                  <Progress
                    value={d.score}
                    indicatorClassName={getScoreProgressColor(d.score)}
                    className="h-1.5"
                  />

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#333333]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {d.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {d.minBudget ? `R$ ${d.minBudget.toLocaleString('pt-BR')} - ` : ''}R${' '}
                      {(d.maxBudget || d.budget || 0).toLocaleString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" /> {d.bedrooms || 0} dorms
                    </span>
                  </div>

                  <Button
                    className="w-full bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-[48px] mt-2"
                    onClick={() => handleLink(d)}
                  >
                    ✅ VINCULAR A {d.clientName.toUpperCase()}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 shrink-0 border-t border-[#E5E5E5] bg-[#FFFFFF] sm:justify-center">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-[48px]">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
