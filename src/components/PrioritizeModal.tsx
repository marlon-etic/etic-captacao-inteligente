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
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (reason: string) => void
  similarCount: number
}

export function PrioritizeModal({ open, onOpenChange, onConfirm, similarCount }: Props) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!reason) {
      setError('Selecione um motivo para a priorização')
      return
    }
    setError('')
    onConfirm(reason)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🔴 Priorizar Demanda</DialogTitle>
          <DialogDescription>
            Esta demanda será destacada para os captadores com {similarCount} clientes interessados
            no mesmo perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Motivo da Priorização</Label>
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
                <SelectItem value="Múltiplos clientes interessados">
                  Múltiplos clientes interessados
                </SelectItem>
                <SelectItem value="Cliente com urgência alta">Cliente com urgência alta</SelectItem>
                <SelectItem value="Perfil de alto valor">Perfil de alto valor</SelectItem>
                <SelectItem value="Outro">Outro</SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-red-600 hover:bg-red-700 text-white">
            ✅ Confirmar Priorização
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
