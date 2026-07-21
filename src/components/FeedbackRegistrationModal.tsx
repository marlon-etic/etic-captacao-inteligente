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
import { Label } from '@/components/ui/label'
import { Loader2, ThumbsUp, ThumbsDown } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { recordFeedback } from '@/services/sdr-actions'
import { cn } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyLinkId: string
  propertyLabel: string
}

export function FeedbackRegistrationModal({
  open,
  onOpenChange,
  propertyLinkId,
  propertyLabel,
}: Props) {
  const { toast } = useToast()
  const [interestLevel, setInterestLevel] = useState<'interested' | 'not_interested' | ''>('')
  const [feedbackText, setFeedbackText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!interestLevel || !propertyLinkId) return
    setLoading(true)
    try {
      const { error } = await recordFeedback(
        propertyLinkId,
        interestLevel as 'interested' | 'not_interested',
        feedbackText || undefined,
      )
      if (error) throw error
      toast({
        title: 'Feedback Registrado!',
        description: 'O feedback foi registrado com sucesso.',
        className: 'bg-[#10B981] text-white border-none',
      })
      onOpenChange(false)
      setInterestLevel('')
      setFeedbackText('')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar feedback',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Feedback</DialogTitle>
          <DialogDescription className="truncate">{propertyLabel}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nível de Interesse</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInterestLevel('interested')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  interestLevel === 'interested'
                    ? 'border-[#10B981] bg-[#F0FDF4]'
                    : 'border-[#E5E5E5] hover:border-[#10B981]/30',
                )}
              >
                <ThumbsUp
                  className={cn(
                    'w-6 h-6',
                    interestLevel === 'interested' ? 'text-[#10B981]' : 'text-[#999999]',
                  )}
                />
                <span className="text-sm font-bold">Interessado</span>
              </button>
              <button
                onClick={() => setInterestLevel('not_interested')}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  interestLevel === 'not_interested'
                    ? 'border-[#EF4444] bg-[#FEF2F2]'
                    : 'border-[#E5E5E5] hover:border-[#EF4444]/30',
                )}
              >
                <ThumbsDown
                  className={cn(
                    'w-6 h-6',
                    interestLevel === 'not_interested' ? 'text-[#EF4444]' : 'text-[#999999]',
                  )}
                />
                <span className="text-sm font-bold">Não Interessado</span>
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Observações (Opcional)</Label>
            <Textarea
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Detalhes do feedback..."
              className="resize-none"
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !interestLevel}
            className="bg-[#1A3A52] hover:bg-[#1f4866] text-white"
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
