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
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Loader2, ThumbsUp, ThumbsDown, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { recordFeedback } from '@/services/sdr-actions'
import { cn } from '@/lib/utils'
import type { LinkedProperty } from './VisitRegistrationModal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  propertyLinkId?: string
  propertyLabel?: string
  linkedProperties?: LinkedProperty[]
  demandId?: string
  tipoDemanda?: string
}

export function FeedbackRegistrationModal({
  open,
  onOpenChange,
  propertyLinkId,
  propertyLabel,
  linkedProperties,
  demandId,
  tipoDemanda,
}: Props) {
  const { toast } = useToast()
  const [interestLevel, setInterestLevel] = useState<'interested' | 'not_interested' | ''>('')
  const [feedbackText, setFeedbackText] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('')

  const hasLinkedProperties = linkedProperties && linkedProperties.length > 0
  const showSelector = hasLinkedProperties && !propertyLinkId

  useEffect(() => {
    if (open && hasLinkedProperties && !propertyLinkId) {
      setSelectedProperty(linkedProperties![0].matchId)
    } else if (open && propertyLinkId) {
      setSelectedProperty(propertyLinkId)
    }
  }, [open, linkedProperties, propertyLinkId])

  const selectedProp = linkedProperties?.find((p) => p.matchId === selectedProperty)
  const currentPropertyLabel = selectedProp?.label || propertyLabel || 'Imóvel'
  const effectivePropertyLinkId = showSelector ? selectedProperty : propertyLinkId

  const handleSubmit = async () => {
    if (!interestLevel) return

    const effectivePropertyLinkId = showSelector ? selectedProperty : propertyLinkId
    if (!effectivePropertyLinkId) {
      toast({
        title: 'Erro',
        description: 'Nenhum imóvel vinculado encontrado para registrar o feedback.',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const { error } = await recordFeedback(
        effectivePropertyLinkId,
        interestLevel as 'interested' | 'not_interested',
        feedbackText || undefined,
      )
      if (error) throw error

      toast({
        title: 'Feedback Registrado!',
        description: 'O captador foi notificado sobre o feedback do cliente.',
        className: 'bg-[#10B981] text-white border-none',
      })

      if (demandId && tipoDemanda) {
        window.dispatchEvent(
          new CustomEvent('demanda-updated', {
            detail: {
              tipo: tipoDemanda,
              data: { id: demandId, _feedbackRegistered: true },
            },
          }),
        )
      }

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
      <DialogContent className="sm:max-w-md z-[1200]">
        <DialogHeader>
          <DialogTitle>Registrar Feedback</DialogTitle>
          <DialogDescription className="truncate">{currentPropertyLabel}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {showSelector && (
            <div className="space-y-2">
              <Label>Selecione o Imóvel</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {linkedProperties!.map((prop) => (
                  <button
                    key={prop.matchId}
                    onClick={() => setSelectedProperty(prop.matchId)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all flex items-center gap-2',
                      selectedProperty === prop.matchId
                        ? 'border-[#10B981] bg-[#F0FDF4] ring-2 ring-[#10B981]/20'
                        : 'border-[#E5E5E5] hover:border-[#10B981]/30',
                    )}
                  >
                    <MapPin className="w-4 h-4 text-[#10B981] shrink-0" />
                    <span className="text-sm font-medium text-[#1A3A52] line-clamp-1">
                      {prop.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {!showSelector && !propertyLinkId && (
            <div className="text-center text-sm text-gray-500 py-4 border border-dashed border-gray-200 rounded-lg">
              Nenhum imóvel vinculado a esta demanda ainda.
            </div>
          )}
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
            disabled={loading || !interestLevel || !effectivePropertyLinkId}
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
