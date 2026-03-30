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
import { calculateMatching, getScoreBadgeColor, getScoreProgressColor } from '@/lib/matching'
import { Progress } from '@/components/ui/progress'

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

  const scoredDemands = useMemo(() => {
    if (!imovel) return []

    return activeDemands
      .map((d) => {
        const match = calculateMatching(imovel, d)
        return {
          ...d,
          score: match.score,
          details: match.details,
        }
      })
      .filter((d) => d.score >= 60)
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
      <DialogContent className="sm:max-w-[850px] w-[95vw] md:w-full bg-white p-0 gap-0 overflow-hidden rounded-[16px] shadow-2xl flex flex-col max-h-[90dvh] z-[1100]">
        <DialogHeader className="p-[24px] border-b border-[#E5E5E5] bg-[#F8FAFC] shrink-0 relative z-20">
          <DialogTitle className="text-[20px] font-black text-[#1A3A52]">
            Vincular Imóvel {imovel?.codigo_imovel} a uma Demanda
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#666666] mt-1">
            Selecione uma demanda abaixo. O sistema calcula o{' '}
            <strong className="text-[#333333]">Match Score</strong> com base em Valor, Bairro,
            Dormitórios e Vagas.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0 relative z-0 bg-[#F8FAFC]">
          {/* Lista de Demandas c/ Score */}
          <div className="w-full md:w-1/2 border-b md:border-b-0 md:border-r border-[#E5E5E5] flex flex-col bg-white min-h-[300px] md:min-h-0 relative z-10">
            <div className="p-3 bg-[#F8FAFC] border-b border-[#E5E5E5] font-bold text-[13px] text-[#333333] flex justify-between items-center shrink-0 sticky top-0 z-20">
              <span>Demandas Ativas ({scoredDemands.length})</span>
            </div>
            <ScrollArea className="flex-1 min-h-[300px] md:min-h-0">
              {loadingDemands ? (
                <div className="p-8 text-center text-[#999999] text-[14px] flex flex-col items-center">
                  <div className="w-8 h-8 border-4 border-[#1A3A52]/20 border-t-[#1A3A52] rounded-full animate-spin mb-3"></div>
                  Buscando demandas abertas...
                </div>
              ) : scoredDemands.length > 0 ? (
                <div className="flex flex-col p-3 gap-2">
                  {scoredDemands.map((d) => {
                    const isSelected = selectedDemandId === d.id
                    const badgeColor = getScoreBadgeColor(d.score)
                    const progressColor = getScoreProgressColor(d.score)

                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDemandId(d.id)}
                        className={cn(
                          'p-4 rounded-[12px] cursor-pointer transition-all duration-200 border-2 flex flex-col gap-2 bg-white hover:border-[#E5E5E5] shadow-sm',
                          isSelected && '!border-[#1A3A52] shadow-md bg-[#F8FAFC]',
                        )}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col pr-2">
                            <span className="font-bold text-[15px] text-[#1A3A52] line-clamp-1 leading-tight">
                              {d.nome_cliente || 'Cliente Padrão'}
                            </span>
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-0.5">
                              {d.tipo === 'Aluguel' ? 'Locação' : 'Venda'}{' '}
                              {d.nivel_urgencia ? `• ${d.nivel_urgencia}` : ''}
                            </span>
                          </div>
                          <Badge
                            className={cn(
                              'text-[12px] font-black px-2.5 py-1 shadow-sm border-none shrink-0',
                              badgeColor,
                            )}
                          >
                            {d.score}% Match
                          </Badge>
                        </div>
                        <Progress
                          value={d.score}
                          indicatorClassName={progressColor}
                          className="h-1.5 mt-1"
                        />
                        <div className="flex flex-col gap-1 text-[13px] text-slate-700 mt-1">
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-center">💰</span>
                            <span className="font-medium text-slate-900">
                              {d.valor_minimo > 0
                                ? `R$ ${d.valor_minimo.toLocaleString('pt-BR')} - `
                                : ''}
                              R$ {d.valor_maximo?.toLocaleString('pt-BR') || 'Indiferente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 text-center">📍</span>
                            <span
                              className="font-medium text-slate-900 truncate"
                              title={d.bairros?.join(', ')}
                            >
                              {d.bairros?.join(', ') || 'Indiferente'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 mt-0.5">
                            <div className="flex items-center gap-1">
                              <span className="w-4 text-center">🛏️</span>
                              <span className="font-medium text-slate-900">
                                {d.dormitorios || 'Indif.'} dorm
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span className="w-4 text-center">🚗</span>
                              <span className="font-medium text-slate-900">
                                {d.vagas_estacionamento || 'Indif.'} vagas
                              </span>
                            </div>
                          </div>
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
          <div className="w-full md:w-1/2 flex flex-col bg-[#F8FAFC] min-h-[400px] md:min-h-0 relative z-0">
            {selectedDemand ? (
              <div className="p-5 flex flex-col h-full overflow-y-auto animate-fade-in min-h-0">
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
                      getScoreBadgeColor(selectedDemand.score),
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
                        selectedDemand.details.valorScore > 0
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
                        {selectedDemand.details.valorScore > 0 ? (
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
                        selectedDemand.details.localizacaoScore > 0
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
                        {selectedDemand.details.localizacaoScore > 0 ? (
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
                        selectedDemand.details.dormitoriosScore > 0
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
                        {selectedDemand.details.dormitoriosScore > 0 ? (
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
                        selectedDemand.details.vagasScore > 0
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
                        {selectedDemand.details.vagasScore > 0 ? (
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

        <DialogFooter className="p-[20px] border-t border-[#E5E5E5] bg-[#F8FAFC] flex gap-3 justify-end items-center shrink-0 mt-auto sticky bottom-0 z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pointer-events-auto">
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
              'font-bold transition-all shadow-sm min-w-[160px] pointer-events-auto',
              selectedDemand
                ? 'bg-[#1A3A52] hover:bg-[#112839] text-white'
                : 'bg-[#E5E5E5] text-[#999999]',
            )}
          >
            CONFIRMAR E VINCULAR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
