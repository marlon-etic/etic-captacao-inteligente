import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string, obs: string) => void
}

export function LostModal({ open, onOpenChange, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [obs, setObs] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason) {
      setError('Selecione um motivo')
      return
    }
    setError('')
    onConfirm(reason, obs)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            ❌ Marcar Demanda como Perdida
          </DialogTitle>
          <DialogDescription>Por que esta demanda foi perdida?</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo da Perda</Label>
            <Select
              value={reason}
              onValueChange={(val) => {
                setReason(val)
                setError('')
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Cliente desistiu">Cliente desistiu</SelectItem>
                <SelectItem value="Cliente já alugou">Cliente já alugou</SelectItem>
                <SelectItem value="Cliente já comprou">Cliente já comprou</SelectItem>
                <SelectItem value="Imóvel fora do mercado">Imóvel fora do mercado</SelectItem>
                <SelectItem value="Cliente mudou de ideia">Cliente mudou de ideia</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} variant="destructive">
            ✅ Confirmar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
