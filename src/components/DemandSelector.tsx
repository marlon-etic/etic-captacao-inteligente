import { useState, useMemo } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Button } from '@/components/ui/button'
import { MapPin, BedDouble, Car, CheckCircle2, Info, Star, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DemandSelectorProps {
  propertyData: {
    type: string
    neighborhoods: string[]
    value: number
    bedrooms: number
    parkingSpots: number
  }
  onSelect: (demandId: string) => void
}

const formatPrice = (val: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)
}

const getUrgencyData = (demand: any) => {
  const u = (demand.nivel_urgencia || demand.urgencia || demand.timeframe || '').toLowerCase()
  if (u.includes('alta') || u.includes('urgente') || u.includes('15')) {
    return { text: u || 'Alta', classes: 'text-[#EF4444] bg-[#FEF2F2] border-[#EF4444]/30' }
  }
  if (u.includes('média') || u.includes('media') || u.includes('30')) {
    return { text: u || 'Média', classes: 'text-[#F59E0B] bg-[#FFFBEB] border-[#F59E0B]/30' }
  }
  return { text: u || 'Baixa', classes: 'text-[#10B981] bg-[#ECFDF5] border-[#10B981]/30' }
}

export function DemandSelector({ propertyData, onSelect }: DemandSelectorProps) {
  const { demands } = useAppStore()

  // Only show active demands that need properties
  const pendingDemands = useMemo(() => {
    return demands.filter((d) => ['Pendente', 'aberta', 'Aberta'].includes(d.status))
  }, [demands])

  // Extract all unique neighborhoods from active demands to populate the filter
  const allNeighborhoods = useMemo(() => {
    const set = new Set<string>()
    pendingDemands.forEach((d) => {
      if (Array.isArray(d.location)) d.location.forEach((l) => set.add(l))
      else if (typeof d.location === 'string') set.add(d.location)
    })
    propertyData.neighborhoods.forEach((l) => set.add(l)) // Ensure property neighborhoods are included
    return Array.from(set).sort()
  }, [pendingDemands, propertyData.neighborhoods])

  // Initial filter state based on property data
  const [fBairro, setFBairro] = useState<string>(propertyData.neighborhoods[0] || 'Todos')
  const [fBudget, setFBudget] = useState<number>(propertyData.value || 0)
  const [fDorms, setFDorms] = useState<string>(
    propertyData.bedrooms ? String(propertyData.bedrooms) : 'Todos',
  )
  const [fVagas, setFVagas] = useState<string>(
    propertyData.parkingSpots ? String(propertyData.parkingSpots) : 'Todos',
  )
  const [fPrioritaria, setFPrioritaria] = useState<boolean>(false)

  const [expandedId, setExpandedId] = useState<string | null>(null)

  // Dynamic filtering in real-time
  const filteredDemands = useMemo(() => {
    return pendingDemands
      .filter((d) => {
        // Type Match (Sale vs Rent)
        if (d.type && propertyData.type && d.type !== propertyData.type) return false

        // Neighborhood Match
        if (fBairro && fBairro !== 'Todos') {
          const locs = Array.isArray(d.location) ? d.location : [d.location].filter(Boolean)
          if (!locs.some((l) => l?.toLowerCase().includes(fBairro.toLowerCase()))) return false
        }

        // Budget Match: The demand's max budget must be greater than or equal to the filtered minimum budget
        if (fBudget > 0) {
          const maxB = d.maxBudget || d.budget || 0
          if (maxB > 0 && maxB < fBudget) return false
        }

        // Bedrooms Match: Demand should not ask for more bedrooms than the property has
        if (fDorms && fDorms !== 'Todos') {
          if ((d.bedrooms || 0) > parseInt(fDorms)) return false
        }

        // Parking Match: Demand should not ask for more parking spots than the property has
        if (fVagas && fVagas !== 'Todos') {
          if ((d.parkingSpots || 0) > parseInt(fVagas)) return false
        }

        // Priority Match
        if (fPrioritaria && !d.isPrioritized && !(d as any).is_prioritaria) return false

        return true
      })
      .sort((a, b) => {
        // Prioritize priority demands
        const aPrio = a.isPrioritized || (a as any).is_prioritaria ? 1 : 0
        const bPrio = b.isPrioritized || (b as any).is_prioritaria ? 1 : 0
        return bPrio - aPrio
      })
      .slice(0, 30) // Limit to 30 for UI performance
  }, [pendingDemands, fBairro, fBudget, fDorms, fVagas, fPrioritaria, propertyData.type])

  const maxSliderValue = Math.max(5000000, propertyData.value * 1.5 || 1000000)

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      {/* Intelligent Filters Area */}
      <div className="bg-[#F8FAFC] p-4 rounded-xl border border-[#E2E8F0] mb-4 space-y-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-black text-[#1A3A52] uppercase tracking-wide flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" /> Filtros
            Inteligentes
          </h3>
          <button
            onClick={() => setFPrioritaria(!fPrioritaria)}
            className={cn(
              'text-xs font-bold px-2 py-1 rounded-md border flex items-center gap-1 transition-colors',
              fPrioritaria
                ? 'bg-[#FCD34D] text-[#854D0E] border-[#F59E0B]'
                : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F1F5F9]',
            )}
          >
            <Star className={cn('w-3 h-3', fPrioritaria ? 'fill-current' : '')} />
            Prioritárias
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-[#64748B] uppercase">
              Bairro da Demanda
            </Label>
            <Select value={fBairro} onValueChange={setFBairro}>
              <SelectTrigger className="min-h-[44px] bg-white border-[#CBD5E1]">
                <SelectValue placeholder="Bairro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Qualquer Bairro</SelectItem>
                {allNeighborhoods.map((b) => (
                  <SelectItem key={b} value={b}>
                    {b}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <Label className="text-[11px] font-bold text-[#64748B] uppercase">
                Budget do Cliente
              </Label>
              <span className="text-[12px] font-black text-[#10B981]">{formatPrice(fBudget)}+</span>
            </div>
            <Slider
              value={[fBudget]}
              max={maxSliderValue}
              step={10000}
              onValueChange={(v) => setFBudget(v[0])}
              className="py-1"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-[#64748B] uppercase">
              Máx. Dormitórios
            </Label>
            <Select value={fDorms} onValueChange={setFDorms}>
              <SelectTrigger className="min-h-[44px] bg-white border-[#CBD5E1]">
                <SelectValue placeholder="Dormitórios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Qualquer</SelectItem>
                <SelectItem value="1">Até 1</SelectItem>
                <SelectItem value="2">Até 2</SelectItem>
                <SelectItem value="3">Até 3</SelectItem>
                <SelectItem value="4">Até 4</SelectItem>
                <SelectItem value="5">Até 5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] font-bold text-[#64748B] uppercase">Máx. Vagas</Label>
            <Select value={fVagas} onValueChange={setFVagas}>
              <SelectTrigger className="min-h-[44px] bg-white border-[#CBD5E1]">
                <SelectValue placeholder="Vagas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Qualquer</SelectItem>
                <SelectItem value="1">Até 1</SelectItem>
                <SelectItem value="2">Até 2</SelectItem>
                <SelectItem value="3">Até 3</SelectItem>
                <SelectItem value="4">Até 4+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="flex-1">
        {filteredDemands.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center bg-[#F8FAFC] rounded-xl border border-dashed border-[#CBD5E1]">
            <Search className="w-12 h-12 text-[#94A3B8] mb-3 opacity-50" />
            <h4 className="text-[16px] font-bold text-[#334155] mb-1">
              Nenhuma demanda compatível
            </h4>
            <p className="text-[14px] text-[#64748B] max-w-sm">
              Ajuste os filtros acima para encontrar clientes que procuram um imóvel como este.
            </p>
          </div>
        ) : (
          <div className="space-y-3 pb-8">
            <p className="text-[13px] font-bold text-[#64748B] mb-2">
              Mostrando <span className="text-[#1A3A52]">{filteredDemands.length}</span> sugestões
            </p>

            {filteredDemands.map((d) => {
              const isExpanded = expandedId === d.id
              const urgency = getUrgencyData(d)
              const capturedCount = d.capturedProperties?.length || 0
              const isPrioritized = d.isPrioritized || (d as any).is_prioritaria

              return (
                <div
                  key={d.id}
                  onClick={() => setExpandedId(isExpanded ? null : d.id)}
                  className={cn(
                    'flex flex-col rounded-[12px] border-[1.5px] transition-all cursor-pointer overflow-hidden group',
                    isExpanded
                      ? 'border-[#10B981] bg-[#F0FDF4] shadow-[0_4px_12px_rgba(16,185,129,0.1)]'
                      : 'border-[#E2E8F0] bg-white hover:border-[#CBD5E1] hover:shadow-sm',
                  )}
                >
                  {/* Collapsed/Header View */}
                  <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <h4 className="text-[16px] font-bold text-[#1A3A52] leading-tight">
                          {d.clientName || 'Cliente Confidencial'}
                        </h4>
                        {isPrioritized && (
                          <span className="bg-[#FCD34D] text-[#854D0E] border border-[#F59E0B]/30 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                            <Star className="w-3 h-3 fill-current" /> Prioritária
                          </span>
                        )}
                        <span
                          className={cn(
                            'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border',
                            urgency.classes,
                          )}
                        >
                          {urgency.text}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
                        <span className="flex items-center gap-1.5 text-[13px] font-medium text-[#64748B]">
                          <MapPin className="w-4 h-4 text-pink-500" />
                          <span className="line-clamp-1 max-w-[200px]">
                            {(d.location || []).join(', ')}
                          </span>
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1 text-[12px] font-bold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-md">
                            <BedDouble className="w-3.5 h-3.5 text-[#94A3B8]" />{' '}
                            {d.bedrooms || 'Indif.'}
                          </span>
                          <span className="flex items-center gap-1 text-[12px] font-bold text-[#475569] bg-[#F1F5F9] px-2 py-1 rounded-md">
                            <Car className="w-3.5 h-3.5 text-[#94A3B8]" />{' '}
                            {d.parkingSpots || 'Indif.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center shrink-0">
                      <div className="text-left sm:text-right">
                        <p className="text-[18px] font-black text-[#10B981] leading-none">
                          {formatPrice(d.maxBudget || d.budget || 0)}
                        </p>
                        <p className="text-[11px] font-bold text-[#94A3B8] uppercase mt-1">
                          Orçamento Máx.
                        </p>
                      </div>
                      {capturedCount > 0 && (
                        <span className="mt-2 sm:mt-1 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] px-2.5 py-1 rounded-full text-[10px] font-bold inline-block">
                          {capturedCount} Imóvel(ns) Vinculado(s)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Expanded Preview Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-[#10B981]/20 bg-[#F0FDF4] animate-in slide-in-from-top-4 duration-200">
                      {(d.description || (d as any).observacoes) && (
                        <div className="bg-white p-3 rounded-[8px] border border-[#10B981]/20 mb-4 flex gap-2.5 shadow-sm mt-2">
                          <Info className="w-4 h-4 shrink-0 text-[#10B981] mt-0.5" />
                          <p className="text-[13px] text-[#064E3B] font-medium leading-relaxed">
                            {d.description || (d as any).observacoes}
                          </p>
                        </div>
                      )}

                      <Button
                        onClick={(e) => {
                          e.stopPropagation()
                          onSelect(d.id)
                        }}
                        className="w-full min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black text-[15px] shadow-[0_4px_12px_rgba(16,185,129,0.3)] transition-transform hover:scale-[1.01] active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        SELECIONAR ESTA DEMANDA
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
