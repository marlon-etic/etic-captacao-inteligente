import { useState, useMemo, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { calculateMatching, getScoreBadgeColor } from '@/lib/matching'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { vinculacaoService } from '@/services/vinculacaoService'

export interface VinculacaoModalProps {
  isOpen: boolean
  onClose: () => void
  imovelData: any
  onSuccess?: () => void
}

export function VinculacaoModal({ isOpen, onClose, imovelData, onSuccess }: VinculacaoModalProps) {
  const { user } = useAuth()
  const { toast } = useToast()

  const [selectedDemand, setSelectedDemand] = useState<any>(null)
  const [isLinking, setIsLinking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [demands, setDemands] = useState<any[]>([])
  const [loadingDemands, setLoadingDemands] = useState(false)

  const [showLowScoreWarning, setShowLowScoreWarning] = useState(false)
  const [confirmLowScore, setConfirmLowScore] = useState(false)

  const imovelNormalizado = useMemo(() => {
    if (!imovelData) return {}
    return { ...imovelData }
  }, [imovelData])

  useEffect(() => {
    if (isOpen && imovelData) {
      fetchDemands()
    } else {
      setSelectedDemand(null)
      setShowLowScoreWarning(false)
      setConfirmLowScore(false)
    }
  }, [isOpen, imovelData])

  const fetchDemands = async () => {
    setLoadingDemands(true)
    try {
      const [locacaoRes, vendasRes] = await Promise.all([
        supabase
          .from('demandas_locacao')
          .select('*')
          .in('status_demanda', ['aberta', 'atendida'])
          .order('created_at', { ascending: false })
          .limit(50),
        supabase
          .from('demandas_vendas')
          .select('*')
          .in('status_demanda', ['aberta', 'atendida'])
          .order('created_at', { ascending: false })
          .limit(50),
      ])

      const combined = [
        ...(locacaoRes.data || []).map((d) => ({
          ...d,
          _table: 'demandas_locacao',
          tipo: d.tipo || 'Locação',
          tipo_imovel: d.tipo_imovel || ['Apartamento'],
        })),
        ...(vendasRes.data || []).map((d) => ({
          ...d,
          _table: 'demandas_vendas',
          tipo: d.tipo || 'Venda',
          tipo_imovel: d.tipo_imovel || ['Apartamento'],
        })),
      ]
      setDemands(combined)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingDemands(false)
    }
  }

  const scoredDemands = useMemo(() => {
    if (!demands.length) return []

    return demands
      .map((demand) => {
        const imovelTipo = imovelNormalizado.tipo || 'Venda'
        const demandaTipo = demand.tipo || 'Venda'

        const tiposCompativeis = imovelTipo === 'Ambos' || imovelTipo === demandaTipo

        if (!tiposCompativeis) {
          return {
            ...demand,
            matchScore: 0,
            matchDetails: {
              localizacaoScore: 0,
              valorScore: 0,
              dormitoriosScore: 0,
              vagasScore: 0,
            },
          }
        }

        const match = calculateMatching(imovelNormalizado as any, demand as any)
        return {
          ...demand,
          matchScore: match.score,
          matchDetails: match.details,
        }
      })
      .filter((d) => d.matchScore > 0)
      .sort((a, b) => b.matchScore - a.matchScore)
  }, [demands, imovelNormalizado])

  const handleVincularDemanda = async (forceLink = false) => {
    if (!imovelNormalizado || !imovelNormalizado.id) return

    if (!selectedDemand) {
      toast({
        title: '❌ Selecione uma demanda primeiro',
        variant: 'destructive',
      })
      return
    }

    // ✅ VALIDAR SCORE ANTES DE VINCULAR
    const matchResult = calculateMatching(imovelNormalizado as any, selectedDemand as any)
    const scorePercentual = matchResult.score

    console.log('[VINCULAR] Score de matching:', {
      score: scorePercentual,
      demanda: selectedDemand.nome_cliente || selectedDemand.cliente_nome,
      imovel: imovelNormalizado.id,
    })

    // ✅ BLOQUEAR VINCULAÇÃO SE SCORE < 50% E NÃO CONFIRMADO
    if (scorePercentual < 50 && !confirmLowScore && !forceLink) {
      setShowLowScoreWarning(true)
      console.log('[VINCULAR] Score baixo - mostrando aviso:', scorePercentual)
      return
    }

    // ✅ RESETAR AVISO APÓS CONFIRMAÇÃO
    setShowLowScoreWarning(false)
    setConfirmLowScore(false)

    if (isLinking || isSaving) return

    setIsLinking(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const isLocacao = selectedDemand._table === 'demandas_locacao'

      console.log('[VINCULAR] Iniciando vinculação:', {
        imovelId: imovelNormalizado.id,
        demandaId: selectedDemand.id,
        isLocacao,
        score: scorePercentual,
      })

      const response = await vinculacaoService.linkImovelToDemanda(
        {
          imovelId: imovelNormalizado.id,
          demandaId: selectedDemand.id,
          usuarioId: user?.id || '',
          isLocacao,
        },
        controller.signal,
      )

      clearTimeout(timeoutId)

      if (!response.success) {
        toast({
          title: '❌ Erro ao vincular',
          description: response.error || 'Você não tem permissão para vincular este imóvel.',
          variant: 'destructive',
        })
        setIsLinking(false)
        return
      }

      console.log('[VINCULAR] Sucesso ao vincular imóvel com score:', scorePercentual)

      toast({
        title: '✓ Imóvel vinculado com sucesso!',
        description: `Match: ${scorePercentual}% | ${selectedDemand.nome_cliente || selectedDemand.cliente_nome}`,
        className: 'bg-[#10B981] text-white border-none font-bold',
      })

      setTimeout(() => {
        onSuccess?.()
        onClose()
        setIsLinking(false)
      }, 2000)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('[VINCULAR] Exceção capturada:', err)

      if (err.name === 'AbortError') {
        toast({
          title: '❌ Requisição expirou. Tente novamente',
          variant: 'destructive',
        })
      } else {
        toast({
          title: '❌ Erro ao vincular. Tente novamente',
          description: err.message || 'Erro inesperado ao vincular.',
          variant: 'destructive',
        })
      }
      setIsLinking(false)
    }
  }

  const handleSalvarSemVincular = async () => {
    setIsSaving(true)
    setTimeout(() => {
      toast({
        title: '✓ Imóvel salvo sem vinculação!',
        className: 'bg-[#10B981] text-white border-none font-bold',
      })
      onSuccess?.()
      onClose()
      setIsSaving(false)
    }, 500)
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-[700px] max-h-[90vh] overflow-y-auto bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Vincular a uma Demanda
            </DialogTitle>
            <DialogDescription>
              Selecione uma demanda compatível para este imóvel.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-4">
            {loadingDemands ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : scoredDemands.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                Nenhuma demanda compatível encontrada.
              </div>
            ) : (
              <div className="grid gap-3 max-h-[400px] overflow-y-auto pr-2">
                {scoredDemands.map((demand) => (
                  <div
                    key={demand.id}
                    onClick={() => setSelectedDemand(demand)}
                    className={cn(
                      'p-4 border rounded-xl cursor-pointer transition-all',
                      selectedDemand?.id === demand.id
                        ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-slate-800">
                        {demand.nome_cliente || demand.cliente_nome || 'Cliente sem nome'}
                      </h4>
                      <span
                        className={cn(
                          'px-2 py-1 text-xs font-bold rounded-full',
                          getScoreBadgeColor(demand.matchScore),
                        )}
                      >
                        {demand.matchScore}% Match
                      </span>
                    </div>
                    <div className="text-sm text-slate-600">
                      <p>Orçamento: R$ {demand.valor_maximo}</p>
                      <p>Bairros: {demand.bairros?.join(', ') || 'Qualquer'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleSalvarSemVincular}
              disabled={isLinking || isSaving}
              className="flex-1 h-12 font-bold text-slate-600"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SALVAR SEM VINCULAR'}
            </Button>

            <Button
              onClick={() => handleVincularDemanda(false)}
              disabled={isLinking || isSaving || !selectedDemand}
              className="w-full sm:w-auto h-12 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[15px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all flex-1"
            >
              {isLinking ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  VINCULANDO...
                </>
              ) : selectedDemand ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  VINCULAR (
                  {calculateMatching(imovelNormalizado as any, selectedDemand as any).score}%)
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  VINCULAR DEMANDA
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ✅ AVISO DE SCORE BAIXO */}
      {showLowScoreWarning && selectedDemand && (
        <Dialog open={showLowScoreWarning} onOpenChange={setShowLowScoreWarning}>
          <DialogContent className="max-w-[400px] bg-white rounded-[12px] shadow-2xl z-[60]">
            {(() => {
              const scorePercentual = calculateMatching(
                imovelNormalizado as any,
                selectedDemand as any,
              ).score
              const isVeryLow = scorePercentual < 40

              return (
                <div className="flex flex-col gap-4">
                  {/* Header */}
                  <div
                    className={cn(
                      'p-4 rounded-lg flex items-center gap-3',
                      isVeryLow
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-yellow-50 border border-yellow-200',
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-full flex items-center justify-center text-xl',
                        isVeryLow ? 'bg-red-100' : 'bg-yellow-100',
                      )}
                    >
                      {isVeryLow ? '⚠️' : '⚡'}
                    </div>
                    <div>
                      <h3
                        className={cn(
                          'font-bold text-[16px]',
                          isVeryLow ? 'text-red-900' : 'text-yellow-900',
                        )}
                      >
                        {isVeryLow ? 'Match Muito Baixo' : 'Match Baixo'}
                      </h3>
                      <p
                        className={cn(
                          'text-[14px]',
                          isVeryLow ? 'text-red-700' : 'text-yellow-700',
                        )}
                      >
                        {scorePercentual}% de compatibilidade
                      </p>
                    </div>
                  </div>

                  {/* Mensagem */}
                  <div className="flex flex-col gap-2">
                    <p className="text-[14px] text-slate-700 font-medium">
                      {isVeryLow
                        ? 'Este imóvel tem muito pouca compatibilidade com a demanda. Tem certeza que deseja vincular?'
                        : 'Este imóvel tem compatibilidade baixa com a demanda. Deseja continuar?'}
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg text-[12px] text-slate-600">
                      <p>
                        <strong>Demanda:</strong>{' '}
                        {selectedDemand.nome_cliente || selectedDemand.cliente_nome}
                      </p>
                      <p>
                        <strong>Score:</strong> {scorePercentual}%
                      </p>
                      <p>
                        <strong>Recomendação:</strong>{' '}
                        {scorePercentual >= 50 ? '✅ Viável' : '⚠️ Risco'}
                      </p>
                    </div>
                  </div>

                  {/* Botões */}
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1 h-10 font-bold text-slate-600 border-slate-300 hover:bg-slate-50"
                      onClick={() => {
                        setShowLowScoreWarning(false)
                        setConfirmLowScore(false)
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={() => {
                        if (isVeryLow && !confirmLowScore) {
                          // Para scores < 40%, pedir confirmação dupla
                          setConfirmLowScore(true)
                        } else {
                          // Para scores 40-49%, vincular direto
                          handleVincularDemanda(true)
                        }
                      }}
                      className={cn(
                        'flex-1 h-10 text-white font-bold rounded-xl',
                        isVeryLow && confirmLowScore
                          ? 'bg-red-600 hover:bg-red-700'
                          : 'bg-orange-500 hover:bg-orange-600',
                      )}
                    >
                      {isVeryLow && confirmLowScore
                        ? 'Sim, Vincular Mesmo Assim'
                        : isVeryLow
                          ? 'Confirmar Mesmo Assim'
                          : 'Vincular'}
                    </Button>
                  </div>

                  {/* Confirmação Dupla para Scores < 40% */}
                  {isVeryLow && confirmLowScore && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg animate-in fade-in zoom-in duration-200">
                      <p className="text-[12px] text-red-900 font-bold mb-2">
                        ⚠️ Tem certeza? Esta é uma ação de risco.
                      </p>
                      <Button
                        onClick={() => {
                          handleVincularDemanda(true)
                        }}
                        className="w-full h-10 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg"
                      >
                        Sim, Vincular Definitivamente
                      </Button>
                    </div>
                  )}
                </div>
              )
            })()}
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
