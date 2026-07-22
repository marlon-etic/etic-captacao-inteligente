import { useState, useEffect, useRef } from 'react'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Handshake, MapPin, Search, AlertTriangle, Link2, Edit3, X } from 'lucide-react'
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
import { formatBRL, parseBRL } from '@/lib/currency-utils'
import type { LinkedProperty } from './VisitRegistrationModal'
import {
  searchProperties,
  ensureMatchExists,
  type PropertySearchResult,
} from '@/services/negotiation-service'

type SelectionMode = 'linked' | 'search' | 'manual'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandId: string
  tipoDemanda: string
  linkedProperties?: LinkedProperty[]
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
  const [mode, setMode] = useState<SelectionMode>('linked')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PropertySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedSearchResult, setSelectedSearchResult] = useState<PropertySearchResult | null>(
    null,
  )
  const [manualRef, setManualRef] = useState('')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasLinkedProperties = linkedProperties && linkedProperties.length > 0
  const isNegotiated = negStatus === 'negotiated'
  const valorError = isNegotiated && !valorFechado

  useEffect(() => {
    if (open && hasLinkedProperties) {
      setMode('linked')
      setSelectedProperty(linkedProperties![0].matchId)
    } else if (open && !hasLinkedProperties) {
      setMode('search')
    }
  }, [open, linkedProperties])

  useEffect(() => {
    if (open) {
      setNegStatus('negotiated')
      setNotes('')
      setValorFechado('')
      setSearchQuery('')
      setSearchResults([])
      setSelectedSearchResult(null)
      setManualRef('')
    }
  }, [open])

  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    if (mode !== 'search' || searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }
    setSearching(true)
    searchTimeoutRef.current = setTimeout(async () => {
      const results = await searchProperties(searchQuery.trim())
      setSearchResults(results)
      setSearching(false)
    }, 400)
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    }
  }, [searchQuery, mode])

  const selectedProp = linkedProperties?.find((p) => p.matchId === selectedProperty)

  const handleSubmit = async () => {
    if (!demandId) return
    if (mode === 'linked' && !selectedProperty) return
    if (mode === 'search' && !selectedSearchResult) return
    if (mode === 'manual' && !manualRef.trim()) return
    if (isNegotiated && !valorFechado) return

    setLoading(true)
    try {
      const parsedValue = isNegotiated ? parseBRL(valorFechado) : 0
      let propertyLinkId: string | null = null
      let manualReference: string | null = null

      if (mode === 'linked') {
        propertyLinkId = selectedProperty
      } else if (mode === 'search' && selectedSearchResult) {
        const linkedIds = new Set((linkedProperties || []).map((p) => p.imovelId))
        if (linkedIds.has(selectedSearchResult.id)) {
          const existing = linkedProperties!.find((p) => p.imovelId === selectedSearchResult.id)
          propertyLinkId = existing?.matchId || null
        } else {
          const newMatchId = await ensureMatchExists(demandId, selectedSearchResult.id, tipoDemanda)
          if (newMatchId) {
            propertyLinkId = newMatchId
          } else {
            throw new Error('Falha ao vincular imóvel à demanda.')
          }
        }
      } else if (mode === 'manual') {
        manualReference = manualRef.trim()
      }

      const body: Record<string, unknown> = {
        negotiation_status: negStatus,
        notes: notes || undefined,
        valor_fechado: isNegotiated ? parsedValue : undefined,
      }

      if (propertyLinkId) {
        body.property_link_id = propertyLinkId
      }
      if (manualReference) {
        body.manual_property_reference = manualReference
      }

      const { error } = await supabase.functions.invoke('negotiation-registration', { body })
      if (error) throw error

      toast({
        title: 'Negociação Registrada!',
        description:
          negStatus === 'negotiated'
            ? `Negócio fechado${parsedValue > 0 ? ` no valor de R$ ${parsedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''}!`
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
      setManualRef('')
      setSearchQuery('')
      setSelectedSearchResult(null)
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

  const isDisabled =
    loading ||
    valorError ||
    (mode === 'linked' && !selectedProperty) ||
    (mode === 'search' && !selectedSearchResult) ||
    (mode === 'manual' && !manualRef.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[1200]">
        <DialogHeader>
          <DialogTitle>Registrar Negociação</DialogTitle>
          <DialogDescription>
            {selectedProp
              ? `Imóvel: ${selectedProp.label}`
              : selectedSearchResult
                ? `Imóvel: ${selectedSearchResult.codigo_imovel || selectedSearchResult.endereco || 'Sem identificação'}`
                : mode === 'manual'
                  ? 'Referência manual informada'
                  : 'Selecione o imóvel e o resultado da negociação.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Mode tabs */}
          <div className="flex gap-2">
            {hasLinkedProperties && (
              <Button
                type="button"
                variant={mode === 'linked' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex-1 text-xs font-bold',
                  mode === 'linked' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white' : '',
                )}
                onClick={() => setMode('linked')}
              >
                <Link2 className="w-3.5 h-3.5 mr-1" /> Vinculados
              </Button>
            )}
            <Button
              type="button"
              variant={mode === 'search' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 text-xs font-bold',
                mode === 'search' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white' : '',
              )}
              onClick={() => setMode('search')}
            >
              <Search className="w-3.5 h-3.5 mr-1" /> Buscar
            </Button>
            <Button
              type="button"
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'flex-1 text-xs font-bold',
                mode === 'manual' ? 'bg-[#8B5CF6] hover:bg-[#7C3AED] text-white' : '',
              )}
              onClick={() => setMode('manual')}
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Manual
            </Button>
          </div>

          {/* Linked properties selection */}
          {mode === 'linked' && hasLinkedProperties && (
            <div className="space-y-2 animate-fade-in-up">
              <Label>
                {linkedProperties!.length === 1 ? 'Imóvel Vinculado' : 'Selecione o Imóvel'}
              </Label>
              {linkedProperties!.length === 1 ? (
                <div className="p-3 rounded-lg border border-[#8B5CF6] bg-purple-50 ring-2 ring-[#8B5CF6]/20 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <span className="text-sm font-medium text-[#1A3A52] line-clamp-1">
                    {linkedProperties![0].label}
                  </span>
                </div>
              ) : (
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
              )}
            </div>
          )}

          {/* Database search */}
          {mode === 'search' && (
            <div className="space-y-2 animate-fade-in-up">
              <Label>Buscar Imóvel na Base</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setSelectedSearchResult(null)
                  }}
                  placeholder="Digite código ou endereço..."
                  className="pl-9"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                )}
              </div>
              {searchResults.length > 0 && !selectedSearchResult && (
                <div className="space-y-1 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-1">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => setSelectedSearchResult(result)}
                      className="w-full text-left p-2.5 rounded-md hover:bg-purple-50 transition-colors flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0 mt-0.5" />
                      <div className="flex flex-col min-w-0">
                        {result.codigo_imovel && (
                          <span className="text-xs font-bold text-[#1A3A52]">
                            {result.codigo_imovel}
                          </span>
                        )}
                        <span className="text-xs text-gray-600 line-clamp-1">
                          {result.endereco || result.localizacao_texto || 'Sem endereço'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedSearchResult && (
                <div className="p-3 rounded-lg border border-[#8B5CF6] bg-purple-50 ring-2 ring-[#8B5CF6]/20 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                  <div className="flex flex-col min-w-0 flex-1">
                    {selectedSearchResult.codigo_imovel && (
                      <span className="text-sm font-bold text-[#1A3A52]">
                        {selectedSearchResult.codigo_imovel}
                      </span>
                    )}
                    <span className="text-xs text-gray-600 line-clamp-1">
                      {selectedSearchResult.endereco ||
                        selectedSearchResult.localizacao_texto ||
                        'Sem endereço'}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedSearchResult(null)}
                    className="text-gray-400 hover:text-gray-600 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              {searchQuery.trim().length >= 2 &&
                !searching &&
                searchResults.length === 0 &&
                !selectedSearchResult && (
                  <p className="text-xs text-gray-400 text-center py-2">
                    Nenhum imóvel encontrado.
                  </p>
                )}
            </div>
          )}

          {/* Manual reference */}
          {mode === 'manual' && (
            <div className="space-y-2 animate-fade-in-up">
              <Label htmlFor="manual-ref-neg">
                Referência do Imóvel <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manual-ref-neg"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="Digite a referência do imóvel"
              />
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-xs font-medium">
                  Atenção: Como não há um captador vinculado a esta referência manual, a comunicação
                  automática não será enviada.
                </AlertDescription>
              </Alert>
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
            disabled={isDisabled}
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
