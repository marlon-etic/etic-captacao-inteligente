import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Loader2, Handshake, MapPin } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import type { LinkedProperty } from './VisitRegistrationModal'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandId: string
  tipoDemanda: string
  linkedProperties?: LinkedProperty[]
}

function formatBRL(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const value = Number(digits) / 100
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseBRL(formatted: string): number {
  const digits = formatted.replace(/\D/g, '')
  return digits ? Number(digits) / 100 : 0
}

export function NegotiationRegistrationModal({
  open,
  onOpenChange,
  demandId,
  tipoDemanda,
  linkedProperties,
}: Props) {
  const { toast } = useToast()
  const [negStatus, setNegStatus] = useState<'negotiated' | 'failed'>('negotiated')
  const [notes, setNotes] = useState('')
  const [valorFechado, setValorFechado] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<string>('')

  const hasLinkedProperties = linkedProperties && linkedProperties.length > 0
  const isNegotiated = negStatus === 'negotiated'
  const valorError = isNegotiated && !valorFechado

  useEffect(() => {
    if (open && hasLinkedProperties) {
      setSelectedProperty(linkedProperties![0].matchId)
    }
  }, [open, linkedProperties])

  useEffect(() => {
    if (open) {
      setNegStatus('negotiated')
      setNotes('')
      setValorFechado('')
    }
  }, [open])

  const selectedProp = linkedProperties?.find((p) => p.matchId === selectedProperty)

  const handleSubmit = async () => {
    if (!demandId || !selectedProperty) return
    if (isNegotiated && !valorFechado) return
    setLoading(true)
    try {
      const parsedValue = isNegotiated ? parseBRL(valorFechado) : 0
      const { error } = await supabase.functions.invoke('negotiation-registration', {
        body: {
          property_link_id: selectedProperty,
          negotiation_status: negStatus,
          notes: notes || undefined,
          valor_fechado: isNegotiated ? parsedValue : undefined,
        },
      })
      if (error) throw error
      toast({
        title: 'Negociação Registrada!',
        description:
          negStatus === 'negotiated'
            ? `Negócio fechado${parsedValue > 0 ? ` no valor de R$ ${formatBRL(String(parsedValue * 100))}` : ''}!`
            : 'Negociação registrada como falhou.',
        className: 'bg-[#10B981] text-white border-none',
      })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: tipoDemanda,
            data: { id: demandId, _negotiationRegistered: true },
          },
        }),
      )
      onOpenChange(false)
      setNotes('')
      setValorFechado('')
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar negociação',
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
          <DialogTitle>Registrar Negociação</DialogTitle>
          <DialogDescription>
            {selectedProp
              ? `Imóvel: ${selectedProp.label}`
              : 'Selecione o imóvel e o resultado da negociação.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {hasLinkedProperties && (
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
                        ? 'border-[#8B5CF6] bg-purple-50 ring-2 ring-[#8B5CF6]/20'
                        : 'border-[#E5E5E5] hover:border-[#8B5CF6]/30',
                    )}
                  >
                    <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                    <span className="text-sm font-medium text-[#1A3A52] line-clamp-1">
                      {prop.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Resultado da Negociação</Label>
            <Select value={negStatus} onValueChange={(val: any) => setNegStatus(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o resultado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="negotiated">Negócio Fechado (Sucesso)</SelectItem>
                <SelectItem value="failed">Negociação Falhou</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {isNegotiated && (
            <div className="space-y-2 animate-fade-in-up">
              <Label htmlFor="valor-fechado">
                Valor do Aluguel Fechado <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A3A52] font-bold text-sm pointer-events-none">
                  R$
                </span>
                <Input
                  id="valor-fechado"
                  inputMode="numeric"
                  value={valorFechado}
                  onChange={(e) => setValorFechado(formatBRL(e.target.value))}
                  placeholder="0,00"
                  className={cn(
                    'pl-10 font-bold text-[#1A3A52]',
                    valorError && 'border-red-500 focus-visible:ring-red-500',
                  )}
                />
              </div>
              {valorError && (
                <p className="text-xs text-red-500 font-medium">
                  Informe o valor do aluguel fechado.
                </p>
              )}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="neg-notes">Observações (Opcional)</Label>
            <Textarea
              id="neg-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Valores acordados, condições, motivo da falha..."
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
            disabled={loading || (hasLinkedProperties && !selectedProperty) || valorError}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Handshake className="w-4 h-4 mr-2" />
            )}
            Salvar Negociação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
