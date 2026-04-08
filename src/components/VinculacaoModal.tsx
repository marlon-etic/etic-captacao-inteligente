import { useState, useMemo, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, MapPin, CheckCircle2, Home, Loader2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase/client'
import { calculateMatching } from '@/lib/matching'
import { vinculacaoService } from '@/services/vinculacao'
import { useAuth } from '@/hooks/use-auth'

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
  const { user } = useAuth()

  const [activeDemands, setActiveDemands] = useState<any[]>([])
  const [loadingDemands, setLoadingDemands] = useState(false)
  const [selectedDemandId, setSelectedDemandId] = useState<string>('')
  const [isLinking, setIsLinking] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Filtros
  const [filterTipo, setFilterTipo] = useState<string>('Todos')
  const [filterBairro, setFilterBairro] = useState<string>('')
  const [filterDorms, setFilterDorms] = useState<string>('Todos')
  const [filterVagas, setFilterVagas] = useState<string>('Todos')

  useEffect(() => {
    if (isOpen && imovel) {
      setSelectedDemandId('')
      setFilterTipo(
        imovel.tipo === 'Venda' ? 'Venda' : imovel.tipo === 'Aluguel' ? 'Aluguel' : 'Todos',
      )

      const fetchDemands = async () => {
        setLoadingDemands(true)
        try {
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
              'id, nome_cliente, bairros, valor_maximo, valor_minimo, dormitorios, vagas_estacionamento, status_demanda, observacoes, imoveis_captados(id)',
            )

          const locacao = (dataLocacao || [])
            .filter(
              (d) =>
                !d.status_demanda || !excludedStatuses.includes(d.status_demanda.toLowerCase()),
            )
            .map((d) => ({ ...d, tipo: 'Aluguel' }))

          const { data: dataVendas } = await supabase
            .from('demandas_vendas')
            .select(
              'id, nome_cliente, bairros, valor_maximo, valor_minimo, dormitorios, vagas_estacionamento, status_demanda, necessidades_especificas, imoveis_captados(id)',
            )

          const vendas = (dataVendas || [])
            .filter(
              (d) =>
                !d.status_demanda || !excludedStatuses.includes(d.status_demanda.toLowerCase()),
            )
            .map((d) => ({ ...d, tipo: 'Venda' }))

          setActiveDemands([...locacao, ...vendas])
        } catch (err) {
          console.error(err)
        } finally {
          setLoadingDemands(false)
        }
      }
      fetchDemands()
    } else {
      setActiveDemands([])
      setFilterBairro('')
    }
  }, [isOpen, imovel])

  const scoredDemands = useMemo(() => {
    if (!imovel) return []
    return activeDemands
      .map((d) => ({ ...d, score: calculateMatching(imovel, d).score }))
      .sort((a, b) => b.score - a.score)
  }, [activeDemands, imovel])

  const filteredDemands = useMemo(() => {
    return scoredDemands.filter((d) => {
      if (filterTipo !== 'Todos' && d.tipo !== filterTipo) return false
      if (
        filterBairro &&
        !d.bairros?.some((b: string) => b.toLowerCase().includes(filterBairro.toLowerCase()))
      )
        return false
      if (filterDorms !== 'Todos' && d.dormitorios > parseInt(filterDorms)) return false
      if (filterVagas !== 'Todos' && d.vagas_estacionamento > parseInt(filterVagas)) return false
      return true
    })
  }, [scoredDemands, filterTipo, filterBairro, filterDorms, filterVagas])

  const selectedDemand = useMemo(
    () => filteredDemands.find((d) => d.id === selectedDemandId) || null,
    [filteredDemands, selectedDemandId],
  )

  const handleVincularDemanda = async () => {
    if (!imovel) return

    if (!selectedDemand) {
      toast({
        title: '❌ Selecione uma demanda primeiro',
        variant: 'destructive',
      })
      return
    }

    if (isLinking || isSaving) return

    setIsLinking(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const isLocacao = selectedDemand.tipo === 'Aluguel'

      const response = await vinculacaoService.linkImovelToDemanda(
        {
          imovelId: imovel.id,
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

      toast({
        title: '✓ Imóvel vinculado com sucesso!',
        description: `O imóvel foi vinculado a ${selectedDemand.nome_cliente}.`,
        className: 'bg-[#10B981] text-white border-none font-bold',
      })

      setTimeout(() => {
        onSuccess?.()
        onClose()
        setIsLinking(false)
      }, 2000)
    } catch (err: any) {
      clearTimeout(timeoutId)
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
    if (!imovel || isSaving || isLinking) return

    setIsSaving(true)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000)

    try {
      const tipo = imovel.tipo || (imovel as any).demanda_tipo

      if (!tipo) {
        throw new Error('tipo não definido')
      }

      console.log('Salvando imóvel sem vinculação. Tipo:', tipo)

      const query = supabase
        .from('imoveis_captados')
        .update({
          demanda_locacao_id: null,
          demanda_venda_id: null,
          tipo: tipo,
        })
        .eq('id', imovel.id)

      if (controller.signal) {
        query.abortSignal(controller.signal)
      }

      const { error } = await query

      clearTimeout(timeoutId)

      if (error) {
        throw new Error('Erro ao salvar. Tente novamente')
      }

      toast({
        title: '✓ Imóvel salvo sem vinculação!',
        className: 'bg-[#10B981] text-white border-none font-bold',
      })

      setTimeout(() => {
        onSuccess?.()
        onClose()
        setIsSaving(false)
      }, 2000)
    } catch (err: any) {
      clearTimeout(timeoutId)
      console.error('Erro ao salvar sem vincular:', err)

      if (err.name === 'AbortError') {
        toast({
          title: '❌ Requisição expirou. Tente novamente',
          variant: 'destructive',
        })
      } else if (err.message === 'tipo não definido') {
        toast({
          title: '❌ Erro: Tipo de imóvel não definido. Verifique os dados e tente novamente',
          variant: 'destructive',
        })
      } else {
        toast({
          title: '❌ Erro ao salvar. Tente novamente',
          description: err.message || 'Requisição expirou. Tente novamente',
          variant: 'destructive',
        })
      }
      setIsSaving(false)
    }
  }

  const formatPrice = (val: number) => {
    if (!val) return '0'
    if (val >= 1000 && val < 1000000) return `${(val / 1000).toLocaleString('pt-BR')} mil`
    if (val >= 1000000) return `${(val / 1000000).toLocaleString('pt-BR')} mi`
    return val.toLocaleString('pt-BR')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1000px] w-[95vw] h-[85vh] bg-white p-0 gap-0 overflow-hidden rounded-[12px] shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-white shrink-0 relative z-10">
          <div className="flex items-center gap-2 text-slate-800">
            <Search className="w-5 h-5 text-slate-500" />
            <h2 className="text-[18px] font-bold">Encontrar Demanda Compatível</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Filters */}
        <div className="flex items-end gap-4 p-4 border-b border-gray-100 bg-white shrink-0 relative z-10">
          <div className="flex flex-col gap-1.5 flex-1 max-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Tipo</label>
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] outline-none focus:border-slate-400"
            >
              <option value="Todos">Todos</option>
              <option value="Aluguel">Aluguel</option>
              <option value="Venda">Venda</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Bairro</label>
            <input
              type="text"
              placeholder="Ex: Vila Prudente"
              value={filterBairro}
              onChange={(e) => setFilterBairro(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] outline-none focus:border-slate-400"
            />
          </div>

          <div className="flex flex-col gap-1.5 flex-1 max-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase">
              Dormitórios (Máx)
            </label>
            <select
              value={filterDorms}
              onChange={(e) => setFilterDorms(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] outline-none focus:border-slate-400"
            >
              <option value="Todos">Indiferente</option>
              <option value="1">Até 1</option>
              <option value="2">Até 2</option>
              <option value="3">Até 3</option>
              <option value="4">Até 4+</option>
            </select>
          </div>

          <div className="flex flex-col gap-1.5 flex-1 max-w-[200px]">
            <label className="text-[11px] font-bold text-slate-500 uppercase">Vagas (Máx)</label>
            <select
              value={filterVagas}
              onChange={(e) => setFilterVagas(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-gray-200 bg-white text-[14px] outline-none focus:border-slate-400"
            >
              <option value="Todos">Indiferente</option>
              <option value="1">Até 1</option>
              <option value="2">Até 2</option>
              <option value="3">Até 3+</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden bg-[#F8FAFC]">
          {/* Lista de Sugestões */}
          <div className="w-[45%] flex flex-col border-r border-gray-200 bg-white z-0">
            <div className="p-4 border-b border-gray-100 shrink-0 sticky top-0 bg-white z-10">
              <span className="text-[12px] font-bold text-slate-500 uppercase tracking-wider">
                {filteredDemands.length} Sugestões Encontradas
              </span>
            </div>

            <ScrollArea className="flex-1 p-4">
              {loadingDemands ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p>Buscando demandas ativas...</p>
                </div>
              ) : filteredDemands.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <p>Nenhuma demanda compatível encontrada.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {filteredDemands.map((d) => {
                    const isSelected = selectedDemandId === d.id
                    return (
                      <div
                        key={d.id}
                        onClick={() => setSelectedDemandId(d.id)}
                        className={cn(
                          'p-4 rounded-[12px] border-2 cursor-pointer transition-all hover:border-slate-300 relative overflow-hidden',
                          isSelected
                            ? 'border-[#10B981] bg-[#ECFDF5] shadow-sm'
                            : 'border-gray-100 bg-white',
                        )}
                      >
                        {isSelected && (
                          <div className="absolute top-0 left-0 w-1 h-full bg-[#10B981]" />
                        )}
                        <h3 className="font-bold text-[16px] text-slate-900 mb-1">
                          {d.nome_cliente || 'Cliente Padrão'}
                        </h3>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-[11px] font-black text-[#10B981] uppercase">
                            {d.score}% Match
                          </span>
                        </div>

                        <div className="w-full h-px bg-gray-100 mb-3" />

                        <div className="flex flex-col gap-2 text-[13px] text-slate-600 font-medium">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" />
                            <span className="truncate">
                              {d.bairros?.join(', ') || 'Indiferente'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#10B981]">
                              {d.valor_minimo > 0 ? `R$ ${formatPrice(d.valor_minimo)} - ` : ''}
                              Até R$ {formatPrice(d.valor_maximo)}
                            </span>
                            <span className="text-slate-400">{d.tipo}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Salvar Sem Vincular Botão */}
            <div className="p-4 border-t border-gray-100 shrink-0 bg-white">
              <Button
                variant="outline"
                className="w-full h-12 font-bold text-slate-600 border-slate-300 hover:bg-slate-50"
                onClick={handleSalvarSemVincular}
                disabled={isSaving || isLinking}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Sem Vincular'
                )}
              </Button>
            </div>
          </div>

          {/* Área de Preview */}
          <div className="w-[55%] flex flex-col bg-white z-0">
            {selectedDemand ? (
              <ScrollArea className="flex-1">
                <div className="p-8 flex flex-col gap-6 animate-fade-in-up">
                  <h3 className="text-[18px] font-bold text-slate-900">Preview da Demanda</h3>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Cliente
                      </span>
                      <span className="text-[16px] font-bold text-slate-900">
                        {selectedDemand.nome_cliente || 'Não informado'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Tipo
                      </span>
                      <div className="flex items-center gap-2 text-[15px] font-medium text-slate-700">
                        <Home className="w-4 h-4" />
                        {selectedDemand.tipo}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Bairros
                      </span>
                      <span className="text-[15px] font-medium text-slate-700">
                        {selectedDemand.bairros?.join(', ') || 'Indiferente'}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Orçamento
                      </span>
                      <span className="text-[18px] font-black text-[#10B981]">
                        {selectedDemand.valor_minimo > 0
                          ? `R$ ${formatPrice(selectedDemand.valor_minimo)} - `
                          : ''}
                        R$ {formatPrice(selectedDemand.valor_maximo)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 flex flex-col gap-1 border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Dormitórios
                        </span>
                        <span className="text-[18px] font-bold text-slate-900">
                          {selectedDemand.dormitorios || 'Indif.'}
                        </span>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 flex flex-col gap-1 border border-slate-100">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Vagas
                        </span>
                        <span className="text-[18px] font-bold text-slate-900">
                          {selectedDemand.vagas_estacionamento || 'Indif.'}
                        </span>
                      </div>
                    </div>

                    {(selectedDemand.observacoes || selectedDemand.necessidades_especificas) && (
                      <div className="p-5 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] text-[14px] leading-relaxed shadow-sm">
                        {selectedDemand.observacoes || selectedDemand.necessidades_especificas}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pb-8">
                    <Button
                      onClick={handleVincularDemanda}
                      disabled={isLinking || isSaving}
                      className="w-full h-14 bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[16px] rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      {isLinking ? (
                        <>
                          <Loader2 className="w-6 h-6 animate-spin" />
                          VINCULANDO...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-6 h-6" />
                          VINCULAR A ESTA DEMANDA
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </ScrollArea>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 text-center">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                  <Search className="w-8 h-8 opacity-30" />
                </div>
                <p className="text-[16px] font-medium max-w-[280px]">
                  Selecione uma demanda na lista para visualizar os detalhes e realizar a
                  vinculação.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
