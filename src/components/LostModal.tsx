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
      setError('Selecione um motivo para marcar como perdido')
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
      <DialogContent className="w-full max-w-[calc(100%-32px)] sm:max-w-[400px] p-4 md:p-6 rounded-xl border-[2px] border-[#F44336]/20">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] text-[#1A3A52]">
            ❌ Marcar Demanda como Perdida
          </DialogTitle>
          <DialogDescription className="text-[14px] md:text-[14px] lg:text-[14px] leading-[20px] text-[#333333]">
            Por que esta demanda foi perdida? (Esta ação diminuirá a contagem de clientes no grupo
            ativo).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 md:py-6">
          <div className="space-y-2">
            <Label className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold">
              Motivo da Perda
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
                <SelectItem value="desistiu" className="min-h-[44px] text-[14px] leading-[20px]">
                  Cliente desistiu
                </SelectItem>
                <SelectItem value="alugou" className="min-h-[44px] text-[14px] leading-[20px]">
                  Cliente já alugou
                </SelectItem>
                <SelectItem value="comprou" className="min-h-[44px] text-[14px] leading-[20px]">
                  Cliente já comprou
                </SelectItem>
                <SelectItem
                  value="fora_mercado"
                  className="min-h-[44px] text-[14px] leading-[20px]"
                >
                  Imóvel fora do mercado
                </SelectItem>
                <SelectItem value="mudou_ideia" className="min-h-[44px] text-[14px] leading-[20px]">
                  Cliente mudou de ideia
                </SelectItem>
                <SelectItem value="outro" className="min-h-[44px] text-[14px] leading-[20px]">
                  Outro
                </SelectItem>
              </SelectContent>
            </Select>
            {error && <p className="text-[12px] font-medium text-destructive mt-1">{error}</p>}
          </div>
          <div className="space-y-2">
            <Label className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-bold">
              Observações (Opcional)
            </Label>
            <Textarea
              value={obs}
              onChange={(e) => setObs(e.target.value)}
              placeholder="Detalhes adicionais..."
              className="resize-none min-h-[88px] text-[14px] leading-[20px]"
              rows={3}
            />
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
            variant="destructive"
            className="w-full sm:w-[48%] min-h-[48px] md:min-h-[44px] lg:min-h-[40px] text-[14px] font-bold leading-[20px]"
          >
            ✅ Confirmar Perda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
