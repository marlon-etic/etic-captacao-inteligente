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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Calendar, MapPin, Search, AlertTriangle, Link2, Edit3, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { formatBRL, parseBRL } from '@/lib/currency-utils'
import {
  searchProperties,
  ensureMatchExists,
  type PropertySearchResult,
} from '@/services/negotiation-service'

export interface LinkedProperty {
  matchId: string
  imovelId: string
  label: string
}

type SelectionMode = 'linked' | 'search' | 'manual'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  demandId: string
  tipoDemanda: string
  imovelId?: string
  propertyLinkId?: string
  propertyLabel?: string
  linkedProperties?: LinkedProperty[]
}

export function VisitRegistrationModal({
  open,
  onOpenChange,
  demandId,
  tipoDemanda,
  propertyLinkId,
  propertyLabel,
  linkedProperties,
}: Props) {
  const { toast } = useToast()
  const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0])
  const [visitTime, setVisitTime] = useState('10:00')
  const [notes, setNotes] = useState('')
  const [valorAluguel, setValorAluguel] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<SelectionMode>('linked')
  const [selectedProperty, setSelectedProperty] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<PropertySearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedSearchResult, setSelectedSearchResult] = useState<PropertySearchResult | null>(
    null,
  )
  const [manualRef, setManualRef] = useState('')
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const hasLinkedProperties = linkedProperties && linkedProperties.length > 0

  useEffect(() => {
    if (open && hasLinkedProperties) {
      setMode('linked')
      setSelectedProperty(propertyLinkId || linkedProperties![0].matchId)
    } else if (open && !hasLinkedProperties) {
      setMode('search')
    }
  }, [open, linkedProperties, propertyLinkId])

  useEffect(() => {
    if (open) {
      setNotes('')
      setValorAluguel('')
      setSearchQuery('')
      setSearchResults([])
      setSelectedSearchResult(null)
      setManualRef('')
    }
  }, [open])

  useEffect(() => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
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

    setLoading(true)
    try {
      const visitedAt = new Date(`${visitDate}T${visitTime}:00`).toISOString()
      const parsedValor = parseBRL(valorAluguel)
      const body: Record<string, unknown> = {
        demanda_id: demandId,
        tipo_demanda: tipoDemanda,
        visited_at: visitedAt,
        notes: notes || undefined,
        valor_aluguel: parsedValor > 0 ? parsedValor : undefined,
      }

      if (mode === 'linked' && selectedProperty) {
        body.property_link_id = selectedProperty
      } else if (mode === 'search' && selectedSearchResult) {
        const linkedIds = new Set((linkedProperties || []).map((p) => p.imovelId))
        if (linkedIds.has(selectedSearchResult.id)) {
          const existing = linkedProperties!.find((p) => p.imovelId === selectedSearchResult.id)
          body.property_link_id = existing?.matchId
        } else {
          const newMatchId = await ensureMatchExists(demandId, selectedSearchResult.id, tipoDemanda)
          if (newMatchId) {
            body.property_link_id = newMatchId
          } else {
            throw new Error('Falha ao vincular imóvel à demanda.')
          }
        }
      } else if (mode === 'manual') {
        body.manual_property_reference = manualRef.trim()
      }

      const { error } = await supabase.functions.invoke('visit-registration', { body })
      if (error) throw error

      toast({
        title: 'Visita Registrada!',
        description: `Visita para ${new Date(visitedAt).toLocaleString('pt-BR')}.`,
        className: 'bg-[#10B981] text-white border-none',
      })

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: { tipo: tipoDemanda, data: { id: demandId, _visitRegistered: true } },
        }),
      )

      onOpenChange(false)
      setNotes('')
      setValorAluguel('')
      setManualRef('')
      setSearchQuery('')
      setSelectedSearchResult(null)
    } catch (err: any) {
      toast({
        title: 'Erro ao registrar visita',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const isDisabled =
    loading ||
    (mode === 'linked' && !selectedProperty) ||
    (mode === 'search' && !selectedSearchResult) ||
    (mode === 'manual' && !manualRef.trim())

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[1200]">
        <DialogHeader>
          <DialogTitle>Registrar Visita</DialogTitle>
          <DialogDescription>
            {selectedProp
              ? `Imóvel: ${selectedProp.label}`
              : selectedSearchResult
                ? `Imóvel: ${selectedSearchResult.codigo_imovel || selectedSearchResult.endereco || 'Sem identificação'}`
                : mode === 'manual'
                  ? 'Referência manual informada'
                  : propertyLabel
                    ? `Imóvel: ${propertyLabel}`
                    : 'Selecione o imóvel e registre a visita.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="flex gap-2">
            {hasLinkedProperties && (
              <Button
                type="button"
                variant={mode === 'linked' ? 'default' : 'outline'}
                size="sm"
                className={cn(
                  'flex-1 text-xs font-bold',
                  mode === 'linked' ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white' : '',
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
                mode === 'search' ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white' : '',
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
                mode === 'manual' ? 'bg-[#3B82F6] hover:bg-[#2563EB] text-white' : '',
              )}
              onClick={() => setMode('manual')}
            >
              <Edit3 className="w-3.5 h-3.5 mr-1" /> Manual
            </Button>
          </div>

          {mode === 'linked' && hasLinkedProperties && (
            <div className="space-y-2 animate-fade-in-up">
              <Label>
                {linkedProperties!.length === 1 ? 'Imóvel Vinculado' : 'Selecione o Imóvel'}
              </Label>
              {linkedProperties!.length === 1 ? (
                <div className="p-3 rounded-lg border border-[#3B82F6] bg-blue-50 ring-2 ring-[#3B82F6]/20 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0" />
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
                          ? 'border-[#3B82F6] bg-blue-50 ring-2 ring-[#3B82F6]/20'
                          : 'border-[#E5E5E5] hover:border-[#3B82F6]/30',
                      )}
                    >
                      <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0" />
                      <span className="text-sm font-medium text-[#1A3A52] line-clamp-1">
                        {prop.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

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
                      className="w-full text-left p-2.5 rounded-md hover:bg-blue-50 transition-colors flex items-start gap-2"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#3B82F6] shrink-0 mt-0.5" />
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
                <div className="p-3 rounded-lg border border-[#3B82F6] bg-blue-50 ring-2 ring-[#3B82F6]/20 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#3B82F6] shrink-0" />
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

          {mode === 'manual' && (
            <div className="space-y-2 animate-fade-in-up">
              <Label htmlFor="manual-ref-visit">
                Referência do Imóvel <span className="text-red-500">*</span>
              </Label>
              <Input
                id="manual-ref-visit"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="Digite a referência do imóvel"
              />
              <Alert className="border-amber-200 bg-amber-50">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <AlertDescription className="text-amber-800 text-xs font-medium">
                  Aviso: Como este imóvel foi inserido manualmente, a comunicação automática com
                  captadores não será enviada.
                </AlertDescription>
              </Alert>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="visit-date">Data da Visita</Label>
              <Input
                id="visit-date"
                type="date"
                value={visitDate}
                onChange={(e) => setVisitDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit-time">Hora da Visita</Label>
              <Input
                id="visit-time"
                type="time"
                value={visitTime}
                onChange={(e) => setVisitTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="valor-aluguel">Valor do Aluguel</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#1A3A52] font-bold text-sm pointer-events-none">
                R$
              </span>
              <Input
                id="valor-aluguel"
                inputMode="numeric"
                value={valorAluguel}
                onChange={(e) => setValorAluguel(formatBRL(e.target.value))}
                placeholder="0,00"
                className="pl-10 font-bold text-[#1A3A52]"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="visit-notes">Observações (Opcional)</Label>
            <Textarea
              id="visit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalhes da visita, observações relevantes..."
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
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Calendar className="w-4 h-4 mr-2" />
            )}
            Confirmar Visita
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
