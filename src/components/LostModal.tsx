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
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val)
        if (!val) {
          setReason('')
          setObs('')
          setError('')
        }
      }}
    >
      <DialogContent className="w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] max-w-full sm:max-w-[400px] p-0 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border-[2px] sm:border-[#F44336]/20 flex flex-col overflow-hidden bg-[#FFFFFF]">
        <div className="flex flex-col h-full p-4 sm:p-0">
          <DialogHeader className="space-y-3 shrink-0 text-left">
            <DialogTitle className="flex items-center gap-2 text-[18px] md:text-[20px] font-bold leading-tight text-[#1A3A52]">
              ❌ Marcar Demanda como Perdida
            </DialogTitle>
            <DialogDescription className="text-[14px] leading-tight text-[#333333]">
              Por que esta demanda foi perdida? (Esta ação diminuirá a contagem de clientes no grupo
              ativo).
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 md:py-6">
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#1A3A52]">Motivo da Perda</Label>
              <Select
                value={reason}
                onValueChange={(val) => {
                  setReason(val)
                  setError('')
                }}
              >
                <SelectTrigger className="min-h-[48px] text-[14px] font-medium border-[#E5E5E5] focus:ring-[#1A3A52]">
                  <SelectValue placeholder="Selecione um motivo..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    value="Cliente desistiu"
                    className="min-h-[44px] text-[14px] cursor-pointer"
                  >
                    Cliente desistiu
                  </SelectItem>
                  <SelectItem
                    value="Cliente já alugou"
                    className="min-h-[44px] text-[14px] cursor-pointer"
                  >
                    Cliente já alugou
                  </SelectItem>
                  <SelectItem
                    value="Cliente já comprou"
                    className="min-h-[44px] text-[14px] cursor-pointer"
                  >
                    Cliente já comprou
                  </SelectItem>
                  <SelectItem
                    value="Imóvel fora do mercado"
                    className="min-h-[44px] text-[14px] cursor-pointer"
                  >
                    Imóvel fora do mercado
                  </SelectItem>
                  <SelectItem
                    value="Outro motivo"
                    className="min-h-[44px] text-[14px] cursor-pointer"
                  >
                    Outro motivo
                  </SelectItem>
                </SelectContent>
              </Select>
              {error && <p className="text-[13px] font-bold text-destructive mt-1">{error}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#1A3A52]">Observações (Opcional)</Label>
              <Textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Detalhes adicionais..."
                className="resize-none min-h-[88px] text-[14px] border-[#E5E5E5] focus-visible:ring-[#1A3A52]"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-0">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-1/2 min-h-[48px] text-[14px] font-bold border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              variant="destructive"
              className="w-full sm:w-1/2 min-h-[48px] text-[14px] font-bold bg-[#F44336] hover:bg-[#d32f2f] text-white"
            >
              ✅ Confirmar Perda
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
