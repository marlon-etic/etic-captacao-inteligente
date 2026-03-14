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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) {
          setReason('')
          setError('')
        }
      }}
    >
      <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-[400px] p-4 md:p-6 rounded-xl">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px]">
            🔴 Priorizar Demanda
          </DialogTitle>
          <DialogDescription className="text-[14px] md:text-[14px] lg:text-[14px] leading-[20px] text-[#333333]">
            Esta demanda será destacada para os captadores com {similarCount} clientes interessados
            no mesmo perfil.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 md:py-6">
          <div className="space-y-2">
            <Label className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold">
              Motivo da Priorização
            </Label>
            <Select
              value={reason}
              onValueChange={(val) => {
                setReason(val)
                setError('')
              }}
            >
              <SelectTrigger className="min-h-[48px] md:min-h-[44px] lg:min-h-[40px] text-[14px] leading-[20px]">
                <SelectValue placeholder="Selecione um motivo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  value="Múltiplos clientes interessados"
                  className="min-h-[44px] text-[14px] leading-[20px]"
                >
                  Múltiplos clientes interessados
                </SelectItem>
                <SelectItem
                  value="Cliente com urgência alta"
                  className="min-h-[44px] text-[14px] leading-[20px]"
                >
                  Cliente com urgência alta
                </SelectItem>
                <SelectItem
                  value="Perfil de alto valor"
                  className="min-h-[44px] text-[14px] leading-[20px]"
                >
                  Perfil de alto valor
                </SelectItem>
                <SelectItem value="Outro" className="min-h-[44px] text-[14px] leading-[20px]">
                  Outro
                </SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-[12px] font-medium text-destructive mt-1">{error}</p>}
          </div>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-[48%] min-h-[48px] md:min-h-[44px] lg:min-h-[40px] text-[14px] font-bold leading-[20px]"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="w-full sm:w-[48%] bg-red-600 hover:bg-red-700 text-white min-h-[48px] md:min-h-[44px] lg:min-h-[40px] text-[14px] font-bold leading-[20px]"
          >
            ✅ Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
