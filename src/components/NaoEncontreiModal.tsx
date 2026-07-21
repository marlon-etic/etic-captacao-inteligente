import { useState, useEffect } from 'react'
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
import { STANDARDIZED_LOST_REASONS } from '@/lib/lost-reasons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, obs: string, finalizar: boolean) => Promise<void>
}

export function NaoEncontreiModal({ isOpen, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const [obs, setObs] = useState('')
  const [finalizar, setFinalizar] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOpen) {
      setReason('')
      setObs('')
      setFinalizar(false)
      setError('')
      setIsSubmitting(false)
    }
  }, [isOpen])

  const canSubmit = reason !== '' && (!finalizar || obs.trim().length > 0)

  const handleConfirm = async () => {
    if (!canSubmit || isSubmitting) return
    setIsSubmitting(true)
    setError('')
    try {
      await onConfirm(reason, obs.trim(), finalizar)
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        if (!val) onClose()
      }}
    >
      <DialogContent className="w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] max-w-full sm:max-w-[440px] p-0 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border-[2px] sm:border-orange-400/20 flex flex-col overflow-hidden bg-[#FFFFFF]">
        <div className="flex flex-col h-full p-4 sm:p-0">
          <DialogHeader className="space-y-3 shrink-0 text-left">
            <DialogTitle className="flex items-center gap-2 text-[18px] md:text-[20px] font-bold leading-tight text-[#1A3A52]">
              🔍 Não Encontrei Imóvel
            </DialogTitle>
            <DialogDescription className="text-[14px] leading-tight text-[#333333]">
              Informe o motivo pelo qual não encontrou um imóvel para esta demanda. Você pode
              continuar buscando ou finalizar a demanda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-4 py-4 md:py-6">
            <div className="space-y-2">
              <Label className="text-[14px] font-bold text-[#1A3A52]">Motivo</Label>
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
                  {STANDARDIZED_LOST_REASONS.map((r) => (
                    <SelectItem
                      key={r}
                      value={r}
                      className="min-h-[44px] text-[14px] cursor-pointer"
                    >
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {error && <p className="text-[13px] font-bold text-destructive mt-1">{error}</p>}
            </div>

            <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
              <Label className="text-[14px] font-bold text-[#1A3A52]">
                Observações{' '}
                {finalizar ? (
                  <span className="text-destructive">*</span>
                ) : (
                  <span className="text-[#999999] font-normal">(Opcional)</span>
                )}
              </Label>
              <Textarea
                value={obs}
                onChange={(e) => setObs(e.target.value.slice(0, 500))}
                placeholder="Detalhes adicionais..."
                className="resize-none min-h-[88px] text-[14px] border-[#E5E5E5] focus-visible:ring-[#1A3A52]"
                rows={3}
              />
              <div className="text-right text-[11px] text-[#999999] font-medium">
                {obs.length}/500
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#E5E5E5] hover:bg-[#F8F9FA] transition-colors">
                <input
                  type="radio"
                  name="finalizar"
                  checked={!finalizar}
                  onChange={() => setFinalizar(false)}
                  className="w-4 h-4 accent-[#F97316]"
                />
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-[#1A3A52]">🔍 Continuar Buscando</div>
                  <div className="text-[12px] text-[#666666]">
                    Sua resposta será registrada e a busca continuará ativa.
                  </div>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-[#E5E5E5] hover:bg-red-50 transition-colors">
                <input
                  type="radio"
                  name="finalizar"
                  checked={finalizar}
                  onChange={() => setFinalizar(true)}
                  className="w-4 h-4 accent-[#EF4444]"
                />
                <div className="flex-1">
                  <div className="text-[14px] font-bold text-[#EF4444]">❌ Finalizar Demanda</div>
                  <div className="text-[12px] text-[#666666]">
                    A demanda será marcada como perdida e movida para o histórico.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <DialogFooter className="shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-0">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-1/2 min-h-[48px] text-[14px] font-bold border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canSubmit || isSubmitting}
              className={`w-full sm:w-1/2 min-h-[48px] text-[14px] font-bold text-white shadow-sm ${
                finalizar ? 'bg-[#EF4444] hover:bg-[#DC2626]' : 'bg-[#F97316] hover:bg-[#EA580C]'
              }`}
            >
              {isSubmitting ? 'Enviando...' : finalizar ? 'Confirmar Perda' : 'Enviar Resposta'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
