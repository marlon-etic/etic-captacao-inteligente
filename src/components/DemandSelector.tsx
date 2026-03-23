import { useState, useMemo, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Search,
  MapPin,
  DollarSign,
  BedDouble,
  Car,
  CheckCircle2,
  Building2,
  Home,
} from 'lucide-react'
import { useSupabaseDemands, SupabaseDemand } from '@/hooks/use-supabase-demands'
import { cn } from '@/lib/utils'
import { Slider } from '@/components/ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Props {
  propertyData?: {
    neighborhood?: string
    price?: number
    bedrooms?: number
    parking?: number
    type?: 'Venda' | 'Aluguel'
  }
  onSelectDemand: (demandId: string) => void
}

export function DemandSelector({ propertyData, onSelectDemand }: Props) {
  // Always fetch both, or fetch based on property type if available
  const { demands: aluguelDemands } = useSupabaseDemands('Aluguel')
  const { demands: vendasDemands } = useSupabaseDemands('Venda')

  const allDemands = useMemo(
    () => [...aluguelDemands, ...vendasDemands],
    [aluguelDemands, vendasDemands],
  )

  const [bairro, setBairro] = useState(propertyData?.neighborhood || '')
  const [budget, setBudget] = useState<number[]>([
    0,
    Math.max(propertyData?.price ? propertyData.price * 2 : 10000000, 1000000),
  ])
  const [dormitorios, setDormitorios] = useState(propertyData?.bedrooms?.toString() || 'Todos')
  const [vagas, setVagas] = useState(propertyData?.parking?.toString() || 'Todos')
  const [tipo, setTipo] = useState(propertyData?.type || 'Todos')

  const [selectedDemand, setSelectedDemand] = useState<SupabaseDemand | null>(null)

  useEffect(() => {
    if (propertyData?.price) {
      setBudget([0, propertyData.price * 1.5])
    }
  }, [propertyData])

  const filteredDemands = useMemo(() => {
    return allDemands.filter((d) => {
      if (d.status_demanda !== 'aberta') return false

      if (tipo !== 'Todos' && d.tipo !== tipo) return false

      if (bairro && bairro.trim() !== '') {
        const searchBairro = bairro.toLowerCase()
        const hasMatch = d.bairros.some((b) => b.toLowerCase().includes(searchBairro))
        if (!hasMatch) return false
      }

      if (propertyData?.price) {
        // If property has price, demand must afford it
        if (d.valor_maximo > 0 && propertyData.price > d.valor_maximo) return false
      } else {
        // If filtering by slider
        if (d.valor_maximo > 0 && d.valor_maximo < budget[0]) return false
      }

      if (dormitorios !== 'Todos') {
        const dormNum = parseInt(dormitorios)
        if (d.dormitorios && d.dormitorios > dormNum) return false // Demand wants more rooms than property has
      }

      if (vagas !== 'Todos') {
        const vagasNum = parseInt(vagas)
        if (d.vagas_estacionamento && d.vagas_estacionamento > vagasNum) return false
      }

      return true
    })
  }, [allDemands, bairro, budget, dormitorios, vagas, tipo, propertyData])

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', { notation: 'compact', compactDisplay: 'short' }).format(
      val,
    )
  }

  const handleSelect = (d: SupabaseDemand) => {
    setSelectedDemand(d)
  }

  const confirmSelection = () => {
    if (selectedDemand) {
      onSelectDemand(selectedDemand.id)
    }
  }

  return (
    <div className="flex flex-col bg-[#F8FAFC] rounded-[16px] border border-[#E5E5E5] overflow-hidden">
      {/* Filtros Inteligentes */}
      <div className="p-4 bg-white border-b border-[#E5E5E5] flex flex-col gap-4">
        <h4 className="font-black text-[#1A3A52] text-[14px] flex items-center gap-2">
          <Search className="w-4 h-4" /> Encontrar Demanda Compatível
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-[#666666]">Tipo</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger className="h-[40px] text-[13px]">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos</SelectItem>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-[#666666]">Bairro</Label>
            <Input
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
              placeholder="Ex: Jardins"
              className="h-[40px] text-[13px]"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-[#666666]">
              Dormitórios (Máx. Exigido)
            </Label>
            <Select value={dormitorios} onValueChange={setDormitorios}>
              <SelectTrigger className="h-[40px] text-[13px]">
                <SelectValue placeholder="Dorms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Indiferente</SelectItem>
                <SelectItem value="1">Até 1</SelectItem>
                <SelectItem value="2">Até 2</SelectItem>
                <SelectItem value="3">Até 3</SelectItem>
                <SelectItem value="4">Até 4+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-[11px] font-bold text-[#666666]">Vagas (Máx. Exigido)</Label>
            <Select value={vagas} onValueChange={setVagas}>
              <SelectTrigger className="h-[40px] text-[13px]">
                <SelectValue placeholder="Vagas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Indiferente</SelectItem>
                <SelectItem value="1">Até 1</SelectItem>
                <SelectItem value="2">Até 2</SelectItem>
                <SelectItem value="3">Até 3+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Lista de Demandas Sugeridas */}
      <div className="flex-1 flex flex-col md:flex-row h-[400px]">
        {/* Lista Scrollável */}
        <ScrollArea className="flex-1 border-r border-[#E5E5E5] bg-[#F5F5F5]">
          <div className="p-3 flex flex-col gap-2">
            <div className="text-[11px] font-bold text-[#999999] uppercase tracking-wider mb-1 px-1">
              {filteredDemands.length} Sugestões Encontradas
            </div>

            {filteredDemands.length === 0 ? (
              <div className="text-center py-8 text-[#999999] text-[13px] font-medium">
                Nenhuma demanda aberta compatível.
              </div>
            ) : (
              filteredDemands.slice(0, 10).map((d) => {
                const isSelected = selectedDemand?.id === d.id
                const capturedCount = d.imoveis_captados?.length || 0

                return (
                  <div
                    key={d.id}
                    onClick={() => handleSelect(d)}
                    className={cn(
                      'p-3 rounded-[12px] border cursor-pointer transition-all duration-200 text-left',
                      isSelected
                        ? 'bg-white border-[#10B981] shadow-[0_0_0_2px_rgba(16,185,129,0.2)]'
                        : 'bg-white border-[#E5E5E5] hover:border-[#1A3A52]/30',
                    )}
                  >
                    <div className="flex justify-between items-start gap-2 mb-1.5">
                      <span className="font-bold text-[#1A3A52] text-[14px] line-clamp-1">
                        {d.nome_cliente}
                      </span>
                      {capturedCount > 0 && (
                        <Badge className="bg-[#4CAF50]/10 text-[#2E7D32] border-none text-[10px] px-1.5 h-5 shrink-0">
                          {capturedCount} captações
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-[12px] text-[#666666] mb-1">
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="truncate">{d.bairros?.join(', ')}</span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-[13px] font-black text-[#10B981]">
                        Até {formatPrice(d.valor_maximo)}
                      </span>
                      <span className="text-[11px] font-bold text-[#999999]">{d.tipo}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>

        {/* Preview Expandido */}
        <div className="w-full md:w-[320px] bg-white p-4 flex flex-col shrink-0">
          {selectedDemand ? (
            <div className="flex flex-col h-full animate-fade-in">
              <h5 className="font-black text-[#1A3A52] text-[16px] mb-4 border-b border-[#F5F5F5] pb-2">
                Preview da Demanda
              </h5>

              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                <div>
                  <span className="text-[11px] text-[#999999] font-bold uppercase block mb-0.5">
                    Cliente
                  </span>
                  <span className="text-[14px] text-[#1A3A52] font-bold">
                    {selectedDemand.nome_cliente}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#999999] font-bold uppercase block mb-0.5">
                    Tipo
                  </span>
                  <span className="text-[14px] text-[#333333] font-medium flex items-center gap-1">
                    {selectedDemand.tipo === 'Venda' ? (
                      <Building2 className="w-4 h-4" />
                    ) : (
                      <Home className="w-4 h-4" />
                    )}
                    {selectedDemand.tipo}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#999999] font-bold uppercase block mb-0.5">
                    Bairros
                  </span>
                  <span className="text-[14px] text-[#333333] font-medium leading-snug block">
                    {selectedDemand.bairros?.join(', ')}
                  </span>
                </div>

                <div>
                  <span className="text-[11px] text-[#999999] font-bold uppercase block mb-0.5">
                    Orçamento
                  </span>
                  <span className="text-[16px] text-[#10B981] font-black">
                    R$ {formatPrice(selectedDemand.valor_minimo)} - R${' '}
                    {formatPrice(selectedDemand.valor_maximo)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-[#F5F5F5] p-2 rounded-lg">
                    <span className="text-[10px] text-[#999999] font-bold uppercase block">
                      Dormitórios
                    </span>
                    <span className="text-[14px] text-[#333333] font-bold">
                      {selectedDemand.dormitorios || 'Indif.'}
                    </span>
                  </div>
                  <div className="bg-[#F5F5F5] p-2 rounded-lg">
                    <span className="text-[10px] text-[#999999] font-bold uppercase block">
                      Vagas
                    </span>
                    <span className="text-[14px] text-[#333333] font-bold">
                      {selectedDemand.vagas_estacionamento || 'Indif.'}
                    </span>
                  </div>
                </div>

                {selectedDemand.observacoes && (
                  <div className="bg-[#E8F5E9] p-3 rounded-lg text-[12px] text-[#065F46] font-medium border border-[#A7F3D0]">
                    {selectedDemand.observacoes}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-[#E5E5E5] shrink-0">
                <Button
                  onClick={confirmSelection}
                  className="w-full h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" /> VINCULAR A ESTA DEMANDA
                </Button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center text-[#999999] p-6">
              <Search className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-[14px] font-medium">
                Selecione uma demanda na lista ao lado para ver os detalhes e vincular.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
