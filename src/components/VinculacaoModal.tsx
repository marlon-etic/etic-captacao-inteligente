import { useState, useMemo, useEffect, useRef } from 'react'
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
import { CheckCircle2, XCircle, Search, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { calculateMatching, getScoreBadgeColor, getScoreProgressColor } from '@/lib/matching'
import { vinculacaoService } from '@/services/vinculacao'
import { useAuth } from '@/hooks/use-auth'
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
  const [isSuccess, setIsSuccess] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

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

          const excludedStatuses = [
            'impossivel',
            'perdida_baixa',
            'perdida',
            'concluida',
            'localmente_perdida',
          ]

          const { data: dataLocacao } = await supabase
            .from('demandas_locacao')
            .select(
              'id, nome_cliente, bairros, valor_maximo, valor_minimo, dormitorios, vagas_estacionamento, status_demanda, imoveis_captados(*)',
            )

          if (dataLocacao) {
            locacao = dataLocacao
              .filter(
                (d) =>
                  !d.status_demanda || !excludedStatuses.includes(d.status_demanda.toLowerCase()),
              )
              .map((d) => ({ ...d, tipo: 'Aluguel' }))
          }

          const { data: dataVendas } = await supabase
            .from('demandas_vendas')
            .select(
              'id, nome_cliente, bairros, valor_maximo, valor_minimo, dormitorios, vagas_estacionamento, status_demanda, imoveis_captados(*)',
            )

          if (dataVendas) {
            vendas = dataVendas
              .filter(
                (d) =>
                  !d.status_demanda || !excludedStatuses.includes(d.status_demanda.toLowerCase()),
              )
              .map((d) => ({ ...d, tipo: 'Venda' }))
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
      setIsSuccess(false)
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
      .sort((a, b) => b.score - a.score)
  }, [activeDemands, imovel])

  const { user } = useAuth()
  const selectedDemand = useMemo(() => {
    return scoredDemands.find((d) => d.id === selectedDemandId) || null
  }, [scoredDemands, selectedDemandId])

  const handleVincularDemanda = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!vinculacaoService || !vinculacaoService.linkImovelToDemanda) {
      console.log(`🔴 [VINCULAR] ERRO: Função linkImovelToDemanda não encontrada`)
    }

    if (!imovel || !selectedDemand || isLinking || isSuccess) {
      if (!imovel || !selectedDemand) {
        console.log(`🔴 [VINCULAR] Botão clicado mas sem imóvel ou demanda selecionada`)
      }
      return
    }

    // Dupla proteção: early return se o score for < 50
    if (selectedDemand.score < 50) return

    console.log(`🔵 [VINCULAR] Clique detectado em demanda_id=${selectedDemand.id}`)

    // Evitar duplicidade de vínculo
    if (
      selectedDemand.imoveis_captados?.some(
        (i: any) => i.id === imovel.id || i.codigo_imovel === imovel.codigo_imovel,
      )
    ) {
      toast({
        title: 'Aviso',
        description: 'Este imóvel já está vinculado a este cliente.',
        variant: 'destructive',
      })
      return
    }

    setIsLinking(true)

    // Dar tempo para a interface renderizar o estado "Vinculando..." antes de disparar a requisição
    setTimeout(() => {
      executarVinculacao()
    }, 50)
  }

  const executarVinculacao = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    try {
      const isLocacao =
        selectedDemand?.tipo === 'Aluguel' || selectedDemand?.tipo_demanda === 'Aluguel'

      const timeoutPromise = new Promise<any>((resolve) => {
        setTimeout(() => {
          resolve({
            errorType: 'timeout',
            error: 'Timeout! Requisição demorou mais de 30s. Tente novamente',
          })
        }, 30000)
      })

      // Directly update Supabase to guarantee successful mapping
      const updateData: any = {
        tipo: isLocacao ? 'Aluguel' : 'Venda',
      }
      if (isLocacao) {
        updateData.demanda_locacao_id = selectedDemand!.id
      } else {
        updateData.demanda_venda_id = selectedDemand!.id
      }

      if (user?.id) {
        updateData.user_captador_id = user.id
        updateData.captador_id = user.id
      }

      const requestPromise = supabase
        .from('imoveis_captados')
        .update(updateData)
        .eq('id', imovel!.id)
        .then(({ error }) => {
          if (error) {
            return {
              errorType: error.code === '42501' ? 'permission' : 'server',
              error: error.message,
            }
          }
          return { success: true }
        })

      const response = await Promise.race([requestPromise, timeoutPromise])

      if (signal.aborted) return

      if (response?.error || !response?.success) {
        let finalTitle = '❌ Erro ao vincular'
        let finalDesc = response?.error || 'Tente novamente.'

        if (response?.errorType === 'timeout') {
          finalTitle = '❌ Timeout'
          finalDesc = 'Requisição expirou. Tente novamente'
        } else if (response?.errorType === 'permission' || response?.error?.includes('RLS')) {
          finalTitle = '❌ Permissão Negada'
          finalDesc = 'Você não tem permissão para vincular este imóvel'
        }

        toast({
          title: finalTitle,
          description: finalDesc,
          variant: 'destructive',
        })
        return
      }

      toast({
        title: '✓ Imóvel vinculado com sucesso!',
        description: `O imóvel ${imovel?.codigo_imovel} foi vinculado ao cliente ${selectedDemand?.nome_cliente}.`,
        className: 'bg-[#10B981] text-white border-none font-bold',
      })

      setIsSuccess(true)
      onSuccess?.()

      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (err: any) {
      if (signal.aborted) return
      toast({
        title: '❌ Erro de Sistema',
        description: 'Erro inesperado ao vincular.',
        variant: 'destructive',
      })
    } finally {
      setIsLinking(false)
      abortControllerRef.current = null
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
          onClose()
        }
      }}
    >
      <DialogContent className="sm:max-w-[850px] w-[95vw] md:w-full bg-white p-0 gap-0 overflow-hidden rounded-[16px] shadow-2xl flex flex-col max-h-[90dvh] z-[1100] transition-opacity duration-300">
        {/* Explicit X button strictly positioned at top-right over everything */}
        <button
          onClick={() => {
            if (abortControllerRef.current) abortControllerRef.current.abort()
            onClose()
          }}
          className="absolute right-4 top-4 z-[1200] p-2 bg-white hover:bg-slate-100 rounded-full transition-colors text-slate-500 hover:text-slate-900 shadow-sm border border-slate-200"
          aria-label="Fechar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <DialogHeader className="p-[24px] border-b border-[#E5E5E5] bg-[#F8FAFC] shrink-0 relative z-20 pr-16">
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
                  Buscando demandas ativas...
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
          {selectedDemand && selectedDemand.score < 50 && (
            <span className="text-[12px] font-bold text-[#EF4444] mr-auto hidden sm:inline-block">
              Match insuficiente para vinculação (Mínimo 50%)
            </span>
          )}
          <Button
            variant="outline"
            disabled={isLinking || isSuccess}
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
            disabled={!selectedDemand || selectedDemand.score < 50 || isLinking || isSuccess}
            onClick={handleVincularDemanda}
            title={
              selectedDemand && selectedDemand.score < 50
                ? 'Match insuficiente para vinculação (Mínimo 50%)'
                : undefined
            }
            className={cn(
              'font-bold transition-all shadow-sm min-w-[160px] pointer-events-auto disabled:opacity-50 disabled:cursor-not-allowed',
              isSuccess
                ? 'bg-[#10B981] hover:bg-[#059669] text-white'
                : selectedDemand && selectedDemand.score >= 50
                  ? 'bg-[#1A3A52] hover:bg-[#112839] text-white'
                  : 'bg-gray-400 text-white cursor-not-allowed',
            )}
          >
            {isLinking ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Vinculando...
              </span>
            ) : isSuccess ? (
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Sucesso!
              </span>
            ) : (
              'VINCULAR A ESTA DEMANDA'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
