import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, MinusCircle } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useSupabaseDemands } from '@/hooks/use-supabase-demands'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'

export interface VinculacaoImovelData {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  dormitorios?: number
  vagas?: number
  tipo?: 'Venda' | 'Aluguel'
}

interface Props {
  isOpen: boolean
  onClose: () => void
  imovel: VinculacaoImovelData | null
  onSuccess?: () => void
}

export function VinculacaoModal({ isOpen, onClose, imovel, onSuccess }: Props) {
  const { toast } = useToast()
  const { currentUser } = useAppStore()

  // Always fetch both, filter visually
  const { demands: locacaoDemands } = useSupabaseDemands('Aluguel')
  const { demands: vendaDemands } = useSupabaseDemands('Venda')

  const [selectedDemandId, setSelectedDemandId] = useState<string>('')
  const [isLinking, setIsLinking] = useState(false)

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDemandId('')
    }
  }, [isOpen])

  const availableDemands = useMemo(() => {
    const all = [...locacaoDemands, ...vendaDemands]
    return all
      .filter((d) => {
        if (d.status_demanda !== 'aberta') return false

        const isOwner = d.sdr_id === currentUser?.id || d.corretor_id === currentUser?.id
        const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'gestor'

        return isOwner || isAdmin
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }, [locacaoDemands, vendaDemands, currentUser])

  const selectedDemand = useMemo(() => {
    return availableDemands.find((d) => d.id === selectedDemandId) || null
  }, [availableDemands, selectedDemandId])

  const matchData = useMemo(() => {
    if (!selectedDemand || !imovel) return null

    let score = 0
    let maxScore = 4

    // Preço
    const hasMin = selectedDemand.valor_minimo > 0
    const hasMax = selectedDemand.valor_maximo > 0
    let matchPreco = false
    if (hasMax) {
      matchPreco =
        imovel.preco <= selectedDemand.valor_maximo &&
        (!hasMin || imovel.preco >= selectedDemand.valor_minimo)
    } else {
      matchPreco = true // If no max price defined, assume match
    }
    if (matchPreco && hasMax) score++
    if (!hasMax) maxScore--

    // Dormitórios
    const hasDorms = (selectedDemand.dormitorios || 0) > 0
    const matchDorms = (imovel.dormitorios || 0) >= (selectedDemand.dormitorios || 0)
    if (matchDorms && hasDorms) score++
    if (!hasDorms) maxScore--

    // Vagas
    const hasVagas = (selectedDemand.vagas_estacionamento || 0) > 0
    const matchVagas = (imovel.vagas || 0) >= (selectedDemand.vagas_estacionamento || 0)
    if (matchVagas && hasVagas) score++
    if (!hasVagas) maxScore--

    // Localização
    const hasLoc = selectedDemand.bairros && selectedDemand.bairros.length > 0
    const matchLoc =
      hasLoc &&
      selectedDemand.bairros.some((b: string) =>
        imovel.endereco?.toLowerCase().includes(b.toLowerCase()),
      )
    if (matchLoc) score++
    if (!hasLoc) maxScore--

    // Prevent division by zero
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 100

    return {
      percent,
      rows: [
        {
          label: 'Localização',
          clienteVal: hasLoc ? selectedDemand.bairros.join(', ') : 'Indiferente',
          imovelVal: imovel.endereco || 'Não informado',
          match: !hasLoc ? 'na' : matchLoc,
        },
        {
          label: 'Orçamento / Preço',
          clienteVal: hasMax
            ? `Até R$ ${selectedDemand.valor_maximo.toLocaleString('pt-BR')}`
            : 'Indiferente',
          imovelVal: `R$ ${imovel.preco.toLocaleString('pt-BR')}`,
          match: !hasMax ? 'na' : matchPreco,
        },
        {
          label: 'Dormitórios',
          clienteVal: hasDorms ? `${selectedDemand.dormitorios} ou mais` : 'Indiferente',
          imovelVal: imovel.dormitorios ? imovel.dormitorios.toString() : 'Não informado',
          match: !hasDorms ? 'na' : matchDorms,
        },
        {
          label: 'Vagas',
          clienteVal: hasVagas ? `${selectedDemand.vagas_estacionamento} ou mais` : 'Indiferente',
          imovelVal: imovel.vagas ? imovel.vagas.toString() : 'Não informado',
          match: !hasVagas ? 'na' : matchVagas,
        },
      ],
    }
  }, [selectedDemand, imovel])

  const isMatchValid = matchData !== null && matchData.percent >= 60

  const handleVincular = async () => {
    if (!imovel || !selectedDemand || !isMatchValid) return

    // Check if already linked
    if (selectedDemand.imoveis_captados?.some((i: any) => i.id === imovel.id)) {
      toast({
        title: 'Aviso',
        description: 'Este imóvel já está vinculado a este cliente',
        variant: 'destructive',
      })
      return
    }

    setIsLinking(true)
    try {
      const isLocacao = selectedDemand.tipo === 'Aluguel'
      const { error } = await supabase
        .from('imoveis_captados')
        .update({
          demanda_locacao_id: isLocacao ? selectedDemand.id : null,
          demanda_venda_id: !isLocacao ? selectedDemand.id : null,
        })
        .eq('id', imovel.id)

      if (error) throw error

      const table = isLocacao ? 'demandas_locacao' : 'demandas_vendas'
      await supabase.from(table).update({ status_demanda: 'atendida' }).eq('id', selectedDemand.id)

      toast({
        title: 'Vinculado com Sucesso',
        description: `O imóvel ${imovel.codigo_imovel} foi vinculado ao cliente ${selectedDemand.nome_cliente}.`,
        className: 'bg-[#D4EDDA] text-[#155724] border-[#C3E6CB]',
      })

      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast({
        title: 'Erro ao vincular',
        description: 'Erro ao vincular cliente. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[700px] bg-white p-0 gap-0 overflow-hidden rounded-[16px] shadow-2xl flex flex-col max-h-[85vh]">
        <DialogHeader className="p-[24px] border-b border-[#E5E5E5] bg-[#F8FAFC] shrink-0">
          <DialogTitle className="text-[20px] font-black text-[#1A3A52]">
            Vincular Cliente ao Imóvel {imovel?.codigo_imovel}
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#666666] mt-1">
            Selecione uma demanda aberta para comparar as características e confirmar a vinculação.
          </DialogDescription>
        </DialogHeader>

        <div className="p-[24px] flex flex-col gap-[24px] overflow-y-auto flex-1">
          {/* Seletor de Demanda */}
          <div className="space-y-2">
            <label className="text-[14px] font-bold text-[#333333]">
              Selecione o Cliente / Demanda
            </label>
            {availableDemands.length > 0 ? (
              <Select value={selectedDemandId} onValueChange={setSelectedDemandId}>
                <SelectTrigger className="w-full h-[48px] bg-white">
                  <SelectValue placeholder="Escolha uma demanda aberta..." />
                </SelectTrigger>
                <SelectContent>
                  <ScrollArea className="h-[250px]">
                    {availableDemands.map((d) => (
                      <SelectItem key={d.id} value={d.id} className="py-3">
                        <div className="flex flex-col text-left">
                          <span className="font-bold text-[#1A3A52] text-[14px]">
                            {d.nome_cliente}
                          </span>
                          <span className="text-[12px] text-[#666666] mt-0.5">
                            {d.tipo} • {d.bairros?.join(', ') || 'Sem bairro'} • R${' '}
                            {d.valor_maximo?.toLocaleString('pt-BR')}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </ScrollArea>
                </SelectContent>
              </Select>
            ) : (
              <div className="p-4 bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] rounded-[8px] text-[14px] font-medium">
                Nenhuma demanda aberta disponível para vinculação no momento.
              </div>
            )}
          </div>

          {/* Área de Comparação */}
          {selectedDemand && matchData && (
            <div className="flex flex-col animate-fade-in">
              <div className="flex items-center justify-between bg-white border border-[#E5E5E5] rounded-t-[12px] p-4 shadow-sm relative z-10">
                <span className="font-bold text-[#333333] text-[14px]">
                  Compatibilidade com o cliente:
                </span>
                <Badge
                  className={cn(
                    'text-[14px] font-black px-3 py-1 shadow-sm border-none',
                    matchData.percent >= 60
                      ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                      : 'bg-[#EF4444] hover:bg-[#DC2626] text-white',
                  )}
                >
                  {matchData.percent}% Match
                </Badge>
              </div>

              <div className="border border-t-0 border-[#E5E5E5] rounded-b-[12px] overflow-hidden bg-[#F8FAFC]">
                {/* Header Tabela */}
                <div className="grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3 bg-[#1A3A52] text-white text-[11px] font-bold uppercase tracking-wider">
                  <div>Característica</div>
                  <div>Cliente Deseja</div>
                  <div>Imóvel Possui</div>
                </div>

                {/* Linhas */}
                <div className="flex flex-col">
                  {matchData.rows.map((row, i) => {
                    const bgColor =
                      row.match === true
                        ? 'bg-[#D4EDDA] border-[#C3E6CB]'
                        : row.match === false
                          ? 'bg-[#F8D7DA] border-[#F5C6CB]'
                          : 'bg-[#E9ECEF] border-[#DFE2E6]'

                    const textColor =
                      row.match === true
                        ? 'text-[#155724]'
                        : row.match === false
                          ? 'text-[#721C24]'
                          : 'text-[#383D41]'

                    return (
                      <div
                        key={i}
                        className={cn(
                          'grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3 text-[13px] border-b last:border-b-0 items-center transition-colors',
                          bgColor,
                          textColor,
                        )}
                      >
                        <div className="font-bold">{row.label}</div>
                        <div className="font-medium truncate pr-2" title={row.clienteVal}>
                          {row.clienteVal}
                        </div>
                        <div className="font-bold flex items-center justify-between gap-2">
                          <span className="truncate" title={row.imovelVal}>
                            {row.imovelVal}
                          </span>
                          <span className="shrink-0">
                            {row.match === true && (
                              <CheckCircle2 className="w-4 h-4 text-[#155724]" />
                            )}
                            {row.match === false && <XCircle className="w-4 h-4 text-[#721C24]" />}
                            {row.match === 'na' && (
                              <MinusCircle className="w-4 h-4 text-[#6C757D]" />
                            )}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-[20px] border-t border-[#E5E5E5] bg-[#F8FAFC] flex gap-3 justify-end items-center sm:justify-end shrink-0">
          <Button variant="outline" onClick={onClose} className="font-bold min-w-[120px]">
            Cancelar
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-block">
                <Button
                  disabled={!selectedDemand || !isMatchValid || isLinking}
                  onClick={handleVincular}
                  isLoading={isLinking}
                  loadingText="Vinculando..."
                  className={cn(
                    'font-bold transition-all shadow-sm min-w-[160px]',
                    isMatchValid
                      ? 'bg-[#10B981] enabled:hover:bg-[#059669] text-white border-transparent'
                      : 'bg-[#E5E5E5] text-[#999999] border-transparent',
                  )}
                >
                  Vincular Cliente
                </Button>
              </div>
            </TooltipTrigger>
            {selectedDemand && !isMatchValid && (
              <TooltipContent className="bg-gray-900 text-white p-2 text-xs font-medium">
                <p>Compatibilidade insuficiente para vincular (mínimo 60%)</p>
              </TooltipContent>
            )}
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
