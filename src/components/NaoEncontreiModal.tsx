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
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, obs: string) => void
}

const OPTIONS = ['Fora do perfil', 'Buscando outras opções', 'Fora do mercado', 'Outro']

export function NaoEncontreiModal({ isOpen, onClose, onConfirm }: Props) {
  const [option, setOption] = useState<string>('')
  const [obs, setObs] = useState<string>('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!option) {
      setError('Selecione um motivo')
      return
    }
    if (option === 'Outro' && !obs.trim()) {
      setError('Por favor, informe a observação para o motivo "Outro"')
      return
    }
    setError('')
    onConfirm(option, obs)

    // Do not clear here immediately to avoid layout jump during close animation
    setTimeout(() => {
      setOption('')
      setObs('')
    }, 300)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        if (!val) {
          onClose()
          setTimeout(() => {
            setOption('')
            setObs('')
            setError('')
          }, 300)
        }
      }}
    >
      <DialogContent className="w-[90%] sm:w-full h-auto max-h-[90vh] sm:max-h-[85vh] max-w-full sm:max-w-[450px] p-0 sm:p-6 rounded-[16px] border-0 sm:border-[2px] sm:border-[#EF4444]/20 flex flex-col overflow-hidden bg-white z-[120] shadow-2xl">
        <div className="flex flex-col h-full p-4 sm:p-0">
          <DialogHeader className="space-y-3 shrink-0 text-left">
            <DialogTitle className="text-[#1A3A52] font-black text-[18px] md:text-[20px] leading-tight flex items-center gap-2">
              ❌ Por que não encontrou?
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#333333] leading-tight font-medium">
              Selecione o motivo pelo qual o imóvel não foi encontrado e, se necessário, adicione
              uma observação.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto py-4 md:py-6 space-y-3">
            {OPTIONS.map((opt) => (
              <div
                key={opt}
                onClick={() => {
                  setOption(opt)
                  setError('')
                }}
                className={cn(
                  'flex items-center gap-3 p-4 rounded-[12px] border-[2px] cursor-pointer transition-all duration-200',
                  option === opt
                    ? 'border-[#EF4444] bg-[#FEF2F2]'
                    : 'border-[#E5E5E5] bg-[#F8FAFC] hover:border-[#EF4444]/50 hover:bg-white',
                )}
              >
                {option === opt ? (
                  <CheckCircle2 className="w-5 h-5 text-[#EF4444] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#999999] shrink-0" />
                )}
                <span
                  className={cn(
                    'text-[14px] leading-tight transition-colors',
                    option === opt ? 'text-[#DC2626] font-bold' : 'text-[#333333] font-medium',
                  )}
                >
                  {opt}
                </span>
              </div>
            ))}

            {option === 'Outro' && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[13px] font-bold text-[#1A3A52]">
                  Observação (Obrigatória para "Outro")
                </label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value.slice(0, 500))}
                  placeholder="Descreva o motivo detalhadamente..."
                  className="min-h-[80px] resize-none focus-visible:ring-[#EF4444]"
                />
                <div className="text-right text-[11px] text-[#999999] font-medium">
                  {obs.length}/500
                </div>
              </div>
            )}

            {option !== 'Outro' && option !== '' && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[13px] font-bold text-[#1A3A52]">
                  Observação (Opcional)
                </label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value.slice(0, 500))}
                  placeholder="Detalhes adicionais..."
                  className="min-h-[80px] resize-none focus-visible:ring-[#EF4444]"
                />
                <div className="text-right text-[11px] text-[#999999] font-medium">
                  {obs.length}/500
                </div>
              </div>
            )}

            {error && (
              <p className="text-[13px] text-[#EF4444] font-bold mt-2 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          <DialogFooter className="shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-0">
            <Button
              variant="outline"
              onClick={() => {
                onClose()
                setTimeout(() => {
                  setOption('')
                  setObs('')
                  setError('')
                }, 300)
              }}
              className="w-full sm:w-1/2 min-h-[48px] font-bold text-[14px] border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="w-full sm:w-1/2 min-h-[48px] font-black text-[14px] bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02]"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" /> Confirmar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
