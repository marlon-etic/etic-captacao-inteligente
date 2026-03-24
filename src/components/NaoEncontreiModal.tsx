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
import { CheckCircle2, Circle, X } from 'lucide-react'

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
      <DialogContent className="w-[90%] sm:w-full h-auto max-h-[90vh] sm:max-h-[85vh] max-w-full sm:max-w-[400px] p-0 rounded-[16px] border-0 sm:border-[2px] sm:border-[#E5E5E5] flex flex-col overflow-hidden bg-white shadow-2xl animate-in fade-in duration-300">
        <div className="flex flex-col h-full">
          <DialogHeader className="p-4 sm:p-6 border-b border-[#E5E5E5] shrink-0 text-left bg-[#F8FAFC]">
            <DialogTitle className="text-[#1A3A52] font-black text-[18px] md:text-[20px] leading-tight flex items-center gap-2">
              Por que não encontrou?
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#666666] leading-tight font-medium mt-1">
              Selecione o motivo para alertar o solicitante e atualizar a demanda.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 bg-white">
            <div className="flex flex-col gap-3">
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
                      ? 'border-[#EF4444] bg-[#FEF2F2] shadow-sm'
                      : 'border-[#E5E5E5] bg-[#FFFFFF] hover:border-[#EF4444]/50',
                  )}
                >
                  {option === opt ? (
                    <CheckCircle2 className="w-5 h-5 text-[#EF4444] shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-[#999999] shrink-0" />
                  )}
                  <span
                    className={cn(
                      'text-[15px] leading-tight transition-colors',
                      option === opt ? 'text-[#DC2626] font-bold' : 'text-[#333333] font-medium',
                    )}
                  >
                    {opt}
                  </span>
                </div>
              ))}
            </div>

            {option === 'Outro' && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[14px] font-bold text-[#333333]">
                  Observação <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value.slice(0, 500))}
                  placeholder="Descreva o motivo detalhadamente..."
                  className="min-h-[80px] resize-none focus-visible:ring-[#EF4444] text-[16px]"
                />
                <div className="text-right text-[12px] text-[#999999] font-medium">
                  {obs.length}/500
                </div>
              </div>
            )}

            {option !== 'Outro' && option !== '' && (
              <div className="mt-4 space-y-2 animate-in fade-in slide-in-from-top-2">
                <label className="text-[14px] font-bold text-[#333333]">
                  Observação <span className="text-[#999999] font-medium">(Opcional)</span>
                </label>
                <Textarea
                  value={obs}
                  onChange={(e) => setObs(e.target.value.slice(0, 500))}
                  placeholder="Detalhes adicionais..."
                  className="min-h-[80px] resize-none focus-visible:ring-[#EF4444] text-[16px]"
                />
                <div className="text-right text-[12px] text-[#999999] font-medium">
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

          <DialogFooter className="p-4 sm:p-6 border-t border-[#E5E5E5] shrink-0 flex flex-col sm:flex-row gap-3 bg-[#F8FAFC]">
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
              className="w-full sm:w-1/2 min-h-[48px] font-bold text-[16px] bg-[#6B7280] border-none text-white hover:bg-[#4B5563]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="w-full sm:w-1/2 min-h-[48px] font-bold text-[16px] bg-[#10B981] text-white hover:bg-[#059669] shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.02]"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
