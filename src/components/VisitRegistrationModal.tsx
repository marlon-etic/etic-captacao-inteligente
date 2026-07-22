import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Calendar, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'

export interface LinkedProperty {
  matchId: string
  imovelId: string
  label: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandId: string
  tipoDemanda: string
  imovelId?: string
  propertyLinkId?: string
  propertyLabel?: string
  linkedProperties?: LinkedProperty[]
}

export function VisitRegistrationModal({
  open,
  onOpenChange,
  demandId,
  tipoDemanda,
  imovelId,
  propertyLinkId,
  propertyLabel,
  linkedProperties,
}: Props) {
  const { toast } = useToast()
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [visitTime, setVisitTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('')

  const hasLinkedProperties = linkedProperties && linkedProperties.length > 0
  const showSelector = hasLinkedProperties && !propertyLinkId

  useEffect(() => {
    if (open && hasLinkedProperties && !propertyLinkId) {
      setSelectedProperty(linkedProperties![0].matchId)
    } else if (open && propertyLinkId) {
      setSelectedProperty(propertyLinkId)
    }
  }, [open, linkedProperties, propertyLinkId])

  const selectedProp = linkedProperties?.find((p) => p.matchId === selectedProperty)

  const handleSubmit = async () => {
    if (!demandId) return
    setLoading(true)
    try {
      const visitedAt = new Date(`${visitDate}T${visitTime}:00`).toISOString()
      const body: any = {
        demanda_id: demandId,
        tipo_demanda: tipoDemanda,
        visited_at: visitedAt,
        notes: notes || undefined,
      }

      if (showSelector && selectedProp) {
        body.property_link_id = selectedProp.matchId
        body.imovel_id = selectedProp.imovelId
      } else {
        body.property_link_id = propertyLinkId
        body.imovel_id = imovelId
      }

      const { error } = await supabase.functions.invoke('visit-registration', { body })
      if (error) throw error
      toast({
        title: 'Visita Registrada!',
        description: `Visita para ${new Date(visitedAt).toLocaleString('pt-BR')}. O captador foi notificado.`,
        className: 'bg-[#10B981] text-white border-none',
      })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: tipoDemanda,
            data: { id: demandId, _visitRegistered: true },
          },
        }),
      )
      onOpenChange(false)
      setNotes('')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar visita',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[1200]">
        <DialogHeader>
          <DialogTitle>Registrar Visita</DialogTitle>
          <DialogDescription>
            {selectedProp
              ? `Imóvel: ${selectedProp.label}`
              : propertyLabel
                ? `Imóvel: ${propertyLabel}`
                : 'Registre a data e hora da visita ao imóvel.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showSelector && (
            <div className="space-y-2">
              <Label>Selecione o Imóvel</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {linkedProperties!.map((prop) => (
                  <button
                    key={prop.matchId}
                    onClick={() => setSelectedProperty(prop.matchId)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all flex items-center gap-2',
                      selectedProperty === prop.matchId
                        ? 'border-[#3B82F6] bg-blue-50 ring-2 ring-[#3B82F6]/20'
                        : 'border-[#E5E5E5] hover:border-[#3B82F6]/30',
                    )}
                  >
                    <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0" />
                    <span className="text-sm font-medium text-[#1A3A52] line-clamp-1">
                      {prop.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Data da Visita</Label>
              <Input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-time">Hora da Visita</Label>
              <Input
                id="visit-time"
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit-notes">Observações (Opcional)</Label>
            <Textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes da visita, observações relevantes..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || (showSelector && !selectedProperty)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Confirmar Visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
