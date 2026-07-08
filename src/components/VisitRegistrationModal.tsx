import { useState } from 'react'
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
import { Loader2, Calendar } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandId: string
  tipoDemanda: string
  imovelId?: string
  propertyLinkId?: string
  propertyLabel?: string
}

export function VisitRegistrationModal({
  open,
  onOpenChange,
  demandId,
  tipoDemanda,
  imovelId,
  propertyLinkId,
  propertyLabel,
}: Props) {
  const { toast } = useToast()
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [visitTime, setVisitTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!demandId) return
    setLoading(true)
    try {
      const visitedAt = new Date(`${visitDate}T${visitTime}:00`).toISOString()
      const { error } = await supabase.functions.invoke('visit-registration', {
        body: {
          property_link_id: propertyLinkId,
          imovel_id: imovelId,
          demanda_id: demandId,
          tipo_demanda: tipoDemanda,
          visited_at: visitedAt,
          notes: notes || undefined,
        },
      })
      if (error) throw error
      toast({
        title: 'Visita Registrada!',
        description: `Visita para ${new Date(visitedAt).toLocaleString('pt-BR')}. O captador foi notificado.`,
        className: 'bg-[#10B981] text-white border-none',
      })
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Visita</DialogTitle>
          <DialogDescription>
            {propertyLabel
              ? `Imóvel: ${propertyLabel}`
              : 'Registre a data e hora da visita ao imóvel.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
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
            disabled={loading}
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
