import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle2, XCircle, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'

export interface VinculacaoImovelData {
  id: string
  codigo_imovel: string
  endereco: string
  preco: number
  dormitorios?: number
  vagas?: number
  tipo?: 'Venda' | 'Aluguel' | 'Ambos' | string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  imovel: VinculacaoImovelData | null
  onSuccess?: () => void
}

export function VinculacaoModal({ isOpen, onClose, imovel, onSuccess }: Props) {
  const { toast } = useToast()

  const [activeDemands, setActiveDemands] = useState<any[]>([])
  const [loadingDemands, setLoadingDemands] = useState(false)
  const [selectedDemandId, setSelectedDemandId] = useState<string>('')
  const [isLinking, setIsLinking] = useState(false)

  // Fetch all open demands when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedDemandId('')

      const fetchDemands = async () => {
        if (!imovel) return
        setLoadingDemands(true)
        try {
          let locacao: any[] = []
          let vendas: any[] = []

          if (!imovel.tipo || imovel.tipo === 'Ambos' || imovel.tipo === 'Aluguel') {
            const { data } = await supabase
              .from('demandas_locacao')
              .select(
                'id, nome_cliente, bairros, valor_maximo, valor_minimo, dormitorios, vagas_estacionamento, status_demanda, imoveis_captados(*)',
              )
              .eq('status_demanda', 'aberta')
              .not('sdr_id', 'is', null)

            if (data) locacao = data.map((d) => ({ ...d, tipo: 'Aluguel' }))
          }

          if (!imovel.tipo || imovel.tipo === 'Ambos' || imovel.tipo === 'Venda') {
            const { data } = await supabase
              .from('demandas_vendas')
              .select(
                'id, nome_cliente, bairros, valor_maximo, valor_minimo, dormitorios, vagas_estacionamento, status_demanda, imoveis_captados(*)',
              )
              .eq('status_demanda', 'aberta')
              .not('corretor_id', 'is', null)

            if (data) vendas = data.map((d) => ({ ...d, tipo: 'Venda' }))
          }

          setActiveDemands([...locacao, ...vendas])
        } catch (err) {
          console.error('Error fetching open demands:', err)
        } finally {
          setLoadingDemands(false)
        }
      }

      fetchDemands()
    } else {
      setActiveDemands([])
    }
  }, [isOpen, imovel])

  // Calcular scoring para cada demanda aberta
  const scoredDemands = useMemo(() => {
    if (!imovel) return []

    return activeDemands
      .map((d) => {
        // 1. Valor (±20%) - Peso: 25%
        let valorMatch = 0
        const imovelPreco = imovel.preco || 0
        const demandMax = d.valor_maximo || 0
        const demandMin = d.valor_minimo || 0

        if (demandMax > 0) {
          const margin = demandMax * 0.2 // 20% de margem
          if (imovelPreco <= demandMax + margin && imovelPreco >= demandMin - margin) {
            valorMatch = 1
          }
        } else {
          valorMatch = 1 // Se não tem máximo definido, conta como match
        }

        // 2. Bairro (Match Exato/Parcial string) - Peso: 25%
        let bairroMatch = 0
        if (d.bairros && d.bairros.length > 0) {
          if (
            d.bairros.some((b: string) => imovel.endereco?.toLowerCase().includes(b.toLowerCase()))
          ) {
            bairroMatch = 1
          }
        } else {
          bairroMatch = 1 // Indiferente
        }

        // 3. Dormitórios (±1) - Peso: 25%
        let dormMatch = 0
        const demandDorms = d.dormitorios || 0
        const imovelDorms = imovel.dormitorios || 0
        if (demandDorms > 0) {
          if (imovelDorms >= demandDorms - 1 && imovelDorms <= demandDorms + 1) {
            dormMatch = 1
          }
        } else {
          dormMatch = 1
        }

        // 4. Vagas (±1) - Peso: 25%
        let vagasMatch = 0
        const demandVagas = d.vagas_estacionamento || 0
        const imovelVagas = imovel.vagas || 0
        if (demandVagas > 0) {
          if (imovelVagas >= demandVagas - 1 && imovelVagas <= demandVagas + 1) {
            vagasMatch = 1
          }
        } else {
          vagasMatch = 1
        }

        // Scoring total: (valor * 0.25) + (bairro * 0.25) + (dorm * 0.25) + (vagas * 0.25)
        const totalScore =
          valorMatch * 0.25 + bairroMatch * 0.25 + dormMatch * 0.25 + vagasMatch * 0.25
        const percent = Math.round(totalScore * 100)

        return {
          ...d,
          score: percent,
          details: { valorMatch, bairroMatch, dormMatch, vagasMatch },
        }
      })
      .sort((a, b) => b.score - a.score)
  }, [activeDemands, imovel])

  const selectedDemand = useMemo(() => {
    return scoredDemands.find((d) => d.id === selectedDemandId) || null
  }, [scoredDemands, selectedDemandId])

  const handleVincular = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    if (!imovel || !selectedDemand) return

    // Evitar duplicidade de vínculo
    if (selectedDemand.imoveis_captados?.some((i: any) => i.id === imovel.id)) {
      toast({
        title: 'Aviso',
        description: 'Este imóvel já está vinculado a este cliente.',
        variant: 'destructive',
      })
      return
    }

    setIsLinking(true)
    try {
      const isLocacao =
        selectedDemand.tipo === 'Aluguel' || selectedDemand.tipo_demanda === 'Aluguel'

      // Atualizar imóvel com o ID da demanda correspondente
      const { error } = await supabase
        .from('imoveis_captados')
        .update({
          demanda_locacao_id: isLocacao ? selectedDemand.id : null,
          demanda_venda_id: !isLocacao ? selectedDemand.id : null,
        })
        .eq('id', imovel.id)

      if (error) throw error

      // Atualizar status da demanda para atendida
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
        description: 'Erro ao vincular demanda. Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsLinking(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[850px] bg-white p-0 gap-0 overflow-hidden rounded-[16px] shadow-2xl flex flex-col max-h-[90vh] z-[1100]">
        <DialogHeader className="p-[24px] border-b border-[#E5E5E5] bg-[#F8FAFC] shrink-0 relative z-10">
          <DialogTitle className="text-[20px] font-black text-[#1A3A52]">
            Vincular Imóvel {imovel?.codigo_imovel} a uma Demanda
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#666666] mt-1">
            Selecione uma demanda abaixo. O sistema calcula o{' '}
            <strong className="text-[#333333]">Match Score</strong> com base em Valor, Bairro,
            Dormitórios e Vagas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-hidden relative z-0 bg-[#F8FAFC]">
          {/* Lista de Demandas c/ Score */}
          <div className="w-full md:w-1/2 border-r border-[#E5E5E5] flex flex-col bg-white">
            <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E5E5] font-bold text-[13px] text-[#333333] flex justify-between items-center">
              <span>Demandas Ativas ({scoredDemands.length})</span>
            </div>
            <ScrollArea className="flex-1 h-[450px]">
              {loadingDemands ? (
                <div className="p-8 text-center text-[#999999] text-[14px] flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-[#1A3A52]/20 border-t-[#1A3A52] rounded-full animate-spin mb-3"></div>
                  Buscando demandas abertas...
                </div>
              ) : scoredDemands.length > 0 ? (
                <div className="flex flex-col p-3 gap-2">
                  {scoredDemands.map((d) => {
                    const isGreen = d.score >= 50
                    const isSelected = selectedDemandId === d.id
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDemandId(d.id)}
                        className={cn(
                          'p-3 rounded-[10px] cursor-pointer transition-all duration-200 border',
                          isGreen
                            ? 'bg-green-100 border-green-200 hover:bg-green-200'
                            : 'bg-red-100 border-red-200 hover:bg-red-200',
                          isSelected && 'ring-2 ring-[#1A3A52] shadow-md scale-[1.02]',
                        )}
                      >
                        <div className="flex justify-between items-start mb-1.5">
                          <div className="flex items-center gap-2 pr-2">
                            <span className="font-bold text-[14px] text-[#1A3A52] line-clamp-1">
                              {d.nome_cliente || 'Cliente Padrão'}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] px-1.5 py-0 uppercase bg-white/50 text-[#1A3A52] border-[#1A3A52]/20"
                            >
                              {d.tipo === 'Aluguel' ? 'Locação' : 'Venda'}
                            </Badge>
                          </div>
                          <Badge
                            className={cn(
                              'text-[11px] font-black px-2 py-0.5 shadow-sm border-none shrink-0',
                              isGreen ? 'bg-[#10B981] text-white' : 'bg-[#EF4444] text-white',
                            )}
                          >
                            {d.score}% Match
                          </Badge>
                        </div>
                        <div className="text-[12px] text-[#666666] leading-relaxed space-y-0.5">
                          <p className="flex items-center gap-1">
                            <span className="w-4">📍</span>{' '}
                            <span className="truncate text-black font-medium">
                              {d.bairros?.join(', ') || 'Indiferente'}
                            </span>
                          </p>
                          <p className="flex items-center gap-1">
                            <span className="w-4">💰</span>{' '}
                            <span className="text-black font-medium">
                              Até R$ {d.valor_maximo?.toLocaleString('pt-BR')}
                            </span>
                          </p>
                          <p className="flex items-center gap-1">
                            <span className="w-4">🛏️</span>{' '}
                            <span className="text-black font-medium">
                              {d.dormitorios || 'Indif.'} dorms
                            </span>{' '}
                            • 🚗{' '}
                            <span className="text-black font-medium">
                              {d.vagas_estacionamento || 'Indif.'} vagas
                            </span>
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-8 text-center text-[#999999] text-[14px] flex flex-col items-center">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  <span className="font-bold mb-1">0 SUGESTÕES ENCONTRADAS</span>
                  <span>Nenhuma demanda em aberto corresponde.</span>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Área de Comparação / Preview */}
          <div className="w-full md:w-1/2 flex flex-col bg-[#F8FAFC]">
            {selectedDemand ? (
              <div className="p-5 flex flex-col h-full overflow-y-auto animate-fade-in">
                <div className="flex items-center justify-between bg-white border border-[#E5E5E5] rounded-[12px] p-4 shadow-sm mb-5">
                  <div>
                    <span className="block text-[11px] font-bold text-[#999999] uppercase mb-1">
                      Análise de Compatibilidade
                    </span>
                    <span className="font-black text-[18px] text-[#1A3A52] line-clamp-1">
                      {selectedDemand.nome_cliente}
                    </span>
                  </div>
                  <Badge
                    className={cn(
                      'text-[18px] font-black px-3 py-1 shadow-sm border-none shrink-0',
                      selectedDemand.score >= 50
                        ? 'bg-[#10B981] text-white'
                        : 'bg-[#EF4444] text-white',
                    )}
                  >
                    {selectedDemand.score}%
                  </Badge>
                </div>

                <div className="border border-[#E5E5E5] rounded-[12px] overflow-hidden bg-white shadow-sm flex-1">
                  <div className="grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3 bg-[#1A3A52] text-white text-[11px] font-bold uppercase tracking-wider">
                    <div>Critério</div>
                    <div>Demanda</div>
                    <div>Imóvel</div>
                  </div>

                  <div className="flex flex-col">
                    {/* Orçamento */}
                    <div
                      className={cn(
                        'grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3.5 text-[13px] border-b items-center transition-colors',
                        selectedDemand.details.valorMatch
                          ? 'bg-[#D4EDDA] text-[#155724]'
                          : 'bg-[#F8D7DA] text-[#721C24]',
                      )}
                    >
                      <div className="font-bold">Orçamento</div>
                      <div className="font-medium">
                        Até R$ {selectedDemand.valor_maximo?.toLocaleString('pt-BR')}
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        R$ {imovel?.preco?.toLocaleString('pt-BR')}
                        {selectedDemand.details.valorMatch ? (
                          <CheckCircle2 className="w-4 h-4 text-[#155724]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#721C24]" />
                        )}
                      </div>
                    </div>

                    {/* Localização */}
                    <div
                      className={cn(
                        'grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3.5 text-[13px] border-b items-center transition-colors',
                        selectedDemand.details.bairroMatch
                          ? 'bg-[#D4EDDA] text-[#155724]'
                          : 'bg-[#F8D7DA] text-[#721C24]',
                      )}
                    >
                      <div className="font-bold">Localização</div>
                      <div
                        className="truncate font-medium"
                        title={selectedDemand.bairros?.join(', ')}
                      >
                        {selectedDemand.bairros?.join(', ') || 'Indiferente'}
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        <span className="truncate pr-2" title={imovel?.endereco}>
                          {imovel?.endereco || 'Não informado'}
                        </span>
                        {selectedDemand.details.bairroMatch ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#155724]" />
                        ) : (
                          <XCircle className="w-4 h-4 shrink-0 text-[#721C24]" />
                        )}
                      </div>
                    </div>

                    {/* Dormitórios */}
                    <div
                      className={cn(
                        'grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3.5 text-[13px] border-b items-center transition-colors',
                        selectedDemand.details.dormMatch
                          ? 'bg-[#D4EDDA] text-[#155724]'
                          : 'bg-[#F8D7DA] text-[#721C24]',
                      )}
                    >
                      <div className="font-bold">Dormitórios</div>
                      <div className="font-medium">
                        {selectedDemand.dormitorios || 'Indiferente'}
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        {imovel?.dormitorios || '0'}
                        {selectedDemand.details.dormMatch ? (
                          <CheckCircle2 className="w-4 h-4 text-[#155724]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#721C24]" />
                        )}
                      </div>
                    </div>

                    {/* Vagas */}
                    <div
                      className={cn(
                        'grid grid-cols-[1.5fr_2fr_2fr] gap-3 p-3.5 text-[13px] items-center transition-colors',
                        selectedDemand.details.vagasMatch
                          ? 'bg-[#D4EDDA] text-[#155724]'
                          : 'bg-[#F8D7DA] text-[#721C24]',
                      )}
                    >
                      <div className="font-bold">Vagas</div>
                      <div className="font-medium">
                        {selectedDemand.vagas_estacionamento || 'Indiferente'}
                      </div>
                      <div className="flex items-center justify-between font-bold">
                        {imovel?.vagas || '0'}
                        {selectedDemand.details.vagasMatch ? (
                          <CheckCircle2 className="w-4 h-4 text-[#155724]" />
                        ) : (
                          <XCircle className="w-4 h-4 text-[#721C24]" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-[#999999] p-8 text-center bg-[#F8FAFC]">
                <div className="w-16 h-16 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center mb-4 shadow-sm">
                  <Search className="w-8 h-8 opacity-40" />
                </div>
                <h4 className="text-[16px] font-bold text-[#1A3A52] mb-1">Análise Detalhada</h4>
                <p className="text-[13px] font-medium max-w-[250px]">
                  Clique em qualquer demanda na lista ao lado para ver os detalhes do match e
                  confirmar a vinculação.
                </p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="p-[20px] border-t border-[#E5E5E5] bg-[#F8FAFC] flex gap-3 justify-end items-center shrink-0 relative z-10">
          <Button
            variant="outline"
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onClose()
            }}
            className="font-bold min-w-[120px]"
          >
            Cancelar
          </Button>
          <Button
            disabled={!selectedDemand || isLinking}
            onClick={handleVincular}
            isLoading={isLinking}
            loadingText="Vinculando..."
            className={cn(
              'font-bold transition-all shadow-sm min-w-[160px]',
              selectedDemand
                ? 'bg-[#1A3A52] hover:bg-[#112839] text-white'
                : 'bg-[#E5E5E5] text-[#999999]',
            )}
          >
            Confirmar Vínculo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
