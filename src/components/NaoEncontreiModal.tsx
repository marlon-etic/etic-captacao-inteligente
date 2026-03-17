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
import { cn } from '@/lib/utils'
import { CheckCircle2, Circle } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (reason: string, continueSearch: boolean) => void
}

const OPTIONS = [
  'Continuar buscando por mais 48h',
  'Desistir — cliente já alugou/comprou',
  'Desistir — imóvel fora do mercado',
  'Desistir — outro motivo',
]

export function NaoEncontreiModal({ isOpen, onClose, onConfirm }: Props) {
  const [option, setOption] = useState<string>('')
  const [error, setError] = useState('')

  const handleConfirm = () => {
    if (!option) {
      setError('Selecione uma opção')
      return
    }
    setError('')
    const continueSearch = option === 'Continuar buscando por mais 48h'
    onConfirm(option, continueSearch)
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(val) => {
        if (!val) onClose()
        if (!val) {
          setOption('')
          setError('')
        }
      }}
    >
      <DialogContent className="w-full h-[100dvh] max-h-[100dvh] sm:h-auto sm:max-h-[85vh] max-w-full sm:max-w-[450px] p-0 sm:p-6 rounded-none sm:rounded-xl border-0 sm:border-[2px] sm:border-[#1A3A52]/20 flex flex-col overflow-hidden bg-white">
        <div className="flex flex-col h-full p-4 sm:p-0">
          <DialogHeader className="space-y-3 shrink-0 text-left">
            <DialogTitle className="text-[#1A3A52] font-bold text-[18px] md:text-[20px] leading-tight">
              ❌ Não Encontrei Imóvel
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[#333333] leading-tight">
              Por favor, informe o motivo ou escolha estender a busca.
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
                  'flex items-center gap-3 p-4 rounded-xl border-[2px] cursor-pointer transition-all duration-200',
                  option === opt
                    ? 'border-[#1A3A52] bg-[#1A3A52]/5'
                    : 'border-[#E5E5E5] bg-[#F5F5F5] hover:border-[#1A3A52]/50',
                )}
              >
                {option === opt ? (
                  <CheckCircle2 className="w-5 h-5 text-[#1A3A52] shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-[#999999] shrink-0" />
                )}
                <span className="text-[14px] font-medium text-[#333333] leading-tight">{opt}</span>
              </div>
            ))}
            {error && <p className="text-[13px] text-destructive font-bold mt-2">{error}</p>}
          </div>

          <DialogFooter className="shrink-0 flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="w-full sm:w-1/2 min-h-[48px] font-bold text-[14px] border-[#E5E5E5]"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="w-full sm:w-1/2 min-h-[48px] font-bold text-[14px] bg-[#1A3A52] text-white hover:bg-[#2E5F8A]"
            >
              Confirmar
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
