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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (count: number) => void
}

export function PrioritizeModal({ open, onOpenChange, onConfirm }: Props) {
  const [count, setCount] = useState('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    const num = parseInt(count, 10)
    if (isNaN(num) || num <= 0) {
      setError('Número deve ser positivo')
      return
    }
    setError('')
    onConfirm(num)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">🔴 Priorizar Demanda</DialogTitle>
          <DialogDescription>
            Informe o número de clientes interessados para priorizar esta demanda.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="interested-count">Clientes Interessados</Label>
            <Input
              id="interested-count"
              type="number"
              min="1"
              value={count}
              onChange={(e) => {
                setCount(e.target.value)
                setError('')
              }}
              placeholder="Ex: 3"
            />
            {error && <p className="text-sm font-medium text-destructive">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-pink-600 hover:bg-pink-700 text-white">
            Confirmar Prioridade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
