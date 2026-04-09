import React, { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { toast } from 'sonner'
import { vinculacaoService } from '@/services/vinculacao'
import { Loader2, Building2, MapPin, DollarSign, Home, Car } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VinculacaoModalProps {
  isOpen: boolean
  onClose: () => void
  imovelId: string
  imovelData?: any
  onSuccess?: () => void
}

export function VinculacaoModal({
  isOpen,
  onClose,
  imovelId,
  imovelData,
  onSuccess,
}: VinculacaoModalProps) {
  const { user } = useAuth()
  const [demandas, setDemandas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)

  const [filterTipo, setFilterTipo] = useState<string>('Todos')
  const [filterBairro, setFilterBairro] = useState<string>('')
  const [filterDorms, setFilterDorms] = useState<string>('Todos')
  const [filterVagas, setFilterVagas] = useState<string>('Todos')

  useEffect(() => {
    if (isOpen) {
      fetchDemandas()
    } else {
      setDemandas([])
      setLinkingId(null)
      setSaving(false)
      setFilterTipo('Todos')
      setFilterBairro('')
      setFilterDorms('Todos')
      setFilterVagas('Todos')
    }
  }, [isOpen])

  const fetchDemandas = async () => {
    try {
      setLoading(true)
      const [locacaoRes, vendasRes] = await Promise.all([
        supabase.from('demandas_locacao').select('*').eq('status_demanda', 'aberta'),
        supabase.from('demandas_vendas').select('*').eq('status_demanda', 'aberta'),
      ])

      const locacaoData = (locacaoRes.data || []).map((d) => ({
        ...d,
        isLocacao: true,
        tipo: d.tipo_imovel || 'Não informado',
      }))
      const vendasData = (vendasRes.data || []).map((d) => ({
        ...d,
        isLocacao: false,
        tipo: d.tipo_imovel || 'Não informado',
      }))

      const allDemandas = [...locacaoData, ...vendasData]
      setDemandas(allDemandas)
    } catch (err: any) {
      console.error('Erro ao buscar demandas:', err)
      toast.error('Erro ao carregar demandas disponíveis')
    } finally {
      setLoading(false)
    }
  }

  const calculateMatching = (demanda: any, imovel: any) => {
    if (!imovel) return 0
    let score = 0

    if (demanda.bairros && imovel.bairro) {
      const matchBairro = demanda.bairros.some(
        (b: string) => b.toLowerCase() === imovel.bairro?.toLowerCase(),
      )
      if (matchBairro) score += 40
    }

    if (imovel.valor && demanda.valor_maximo) {
      if (imovel.valor <= demanda.valor_maximo) score += 30
      else if (imovel.valor <= demanda.valor_maximo * 1.1) score += 15
    }

    if (imovel.dormitorios && demanda.dormitorios) {
      if (imovel.dormitorios >= demanda.dormitorios) score += 30
    }

    return score
  }

  const safeImovelData = useMemo(() => imovelData || {}, [imovelData])

  const scoredDemandas = useMemo(() => {
    return [...demandas].sort(
      (a, b) => calculateMatching(b, safeImovelData) - calculateMatching(a, safeImovelData),
    )
  }, [demandas, safeImovelData])

  const filteredDemands = useMemo(() => {
    return scoredDemandas.filter((d) => {
      // Tipo - com validação segura
      if (filterTipo !== 'Todos') {
        if (!d.tipo || d.tipo !== filterTipo) return false
      }

      // Bairro
      if (
        filterBairro &&
        !d.bairros?.some((b: string) => b.toLowerCase().includes(filterBairro.toLowerCase()))
      ) {
        return false
      }

      // Dormitórios - converte "Todos" para null para pular validação
      if (filterDorms !== 'Todos') {
        const domsValue = parseInt(filterDorms)
        if (isNaN(domsValue) || !d.dormitorios || d.dormitorios > domsValue) {
          return false
        }
      }

      // Vagas - mesma lógica
      if (filterVagas !== 'Todos') {
        const vagasValue = parseInt(filterVagas)
        if (isNaN(vagasValue) || !d.vagas_estacionamento || d.vagas_estacionamento > vagasValue) {
          return false
        }
      }

      return true
    })
  }, [scoredDemandas, filterTipo, filterBairro, filterDorms, filterVagas])

  const handleSalvarSemVincular = async () => {
    try {
      if (!imovelId) throw new Error('ID do imóvel não fornecido.')
      if (!user?.id) throw new Error('Usuário não autenticado.')

      setSaving(true)

      const updateData = {
        status_captacao: 'capturado',
        etapa_funil: 'capturado',
        demanda_locacao_id: null,
        demanda_venda_id: null,
        user_captador_id: user.id,
        captador_id: user.id,
      }

      const { error } = await supabase
        .from('imoveis_captados')
        .update(updateData)
        .eq('id', imovelId)

      if (error) throw error

      toast.success('Imóvel salvo com sucesso!')

      try {
        if (onSuccess) {
          const result = onSuccess()
          if (result instanceof Promise) await result
        }
      } catch (onSuccessErr) {
        console.warn('Erro isolado no onSuccess (ignorado para não travar fluxo):', onSuccessErr)
      }

      setTimeout(() => {
        try {
          onClose()
        } catch (e) {
          console.warn('Erro isolado no onClose:', e)
        }
        setSaving(false)
      }, 2000)
    } catch (err: any) {
      console.error('Erro ao salvar imóvel:', err)
      toast.error(err?.message || 'Erro ao salvar imóvel')
    } finally {
      setSaving(false)
    }
  }

  const handleVincularDemanda = async (demanda: any) => {
    try {
      if (!imovelId) throw new Error('ID do imóvel não fornecido.')
      if (!demanda?.id) throw new Error('ID da demanda inválido.')
      if (!user?.id) throw new Error('Usuário não autenticado.')

      setLinkingId(demanda.id)

      const response = await vinculacaoService.linkImovelToDemanda({
        imovelId,
        demandaId: demanda.id,
        usuarioId: user.id,
        isLocacao: demanda.isLocacao,
      })

      if (!response.success) {
        throw new Error(response.error || 'Erro interno ao vincular')
      }

      toast.success('Imóvel vinculado com sucesso!')

      try {
        if (onSuccess) {
          const result = onSuccess()
          if (result instanceof Promise) await result
        }
      } catch (onSuccessErr) {
        console.warn('Erro isolado no onSuccess (ignorado para não travar fluxo):', onSuccessErr)
      }

      setTimeout(() => {
        try {
          onClose()
        } catch (e) {
          console.warn('Erro isolado no onClose:', e)
        }
        setLinkingId(null)
      }, 2000)
    } catch (err: any) {
      console.error('Erro ao vincular:', err)
      toast.error(err?.message || 'Erro ao vincular demanda')
      setLinkingId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] md:max-h-[85vh] h-[85vh] md:h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-4 border-b shrink-0 bg-background relative z-10">
          <DialogTitle className="text-xl">Vincular Imóvel a Demanda</DialogTitle>
          <DialogDescription className="mt-1">
            Selecione uma demanda na lista abaixo ou salve o imóvel como avulso.
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 py-3 border-b bg-muted/10 grid grid-cols-1 sm:grid-cols-4 gap-3 shrink-0">
          <div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="h-9 text-sm bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Tipos</SelectItem>
                <SelectItem value="Casa">Casa</SelectItem>
                <SelectItem value="Apartamento">Apartamento</SelectItem>
                <SelectItem value="Terreno">Terreno</SelectItem>
                <SelectItem value="Galpão">Galpão</SelectItem>
                <SelectItem value="Comercial">Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Input
              placeholder="Filtrar por bairro..."
              value={filterBairro}
              onChange={(e) => setFilterBairro(e.target.value)}
              className="h-9 text-sm bg-background"
            />
          </div>
          <div>
            <Select value={filterDorms} onValueChange={setFilterDorms}>
              <SelectTrigger className="h-9 text-sm bg-background">
                <SelectValue placeholder="Dormitórios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Dorms: Todos</SelectItem>
                <SelectItem value="1">Até 1 dorm.</SelectItem>
                <SelectItem value="2">Até 2 dorms.</SelectItem>
                <SelectItem value="3">Até 3 dorms.</SelectItem>
                <SelectItem value="4">Até 4+ dorms.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Select value={filterVagas} onValueChange={setFilterVagas}>
              <SelectTrigger className="h-9 text-sm bg-background">
                <SelectValue placeholder="Vagas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Vagas: Todas</SelectItem>
                <SelectItem value="1">Até 1 vaga</SelectItem>
                <SelectItem value="2">Até 2 vagas</SelectItem>
                <SelectItem value="3">Até 3+ vagas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-muted/30">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-sm animate-pulse">Buscando demandas...</p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
              <Building2 className="w-16 h-16 mb-4 opacity-20" />
              <p className="font-medium text-lg text-foreground mb-1">Nenhuma demanda encontrada</p>
              <p className="text-sm max-w-md">
                Não encontramos demandas que correspondam aos filtros selecionados.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDemands.map((demanda) => {
                const isLinking = linkingId === demanda.id
                const matchScore = calculateMatching(demanda, safeImovelData)

                return (
                  <div
                    key={demanda.id}
                    className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-card hover:bg-accent/50 hover:shadow-sm transition-all duration-200"
                  >
                    <div className="space-y-2 flex-1 w-full">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-xs px-2.5 py-0.5 rounded-full font-semibold border',
                            demanda.isLocacao
                              ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800'
                              : 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
                          )}
                        >
                          {demanda.isLocacao ? 'Locação' : 'Venda'}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full font-medium border bg-muted text-muted-foreground">
                          {demanda.tipo}
                        </span>
                        <h4 className="font-semibold text-base line-clamp-1 ml-1">
                          {demanda.nome_cliente ||
                            demanda.cliente_nome ||
                            'Cliente não identificado'}
                        </h4>
                        {matchScore > 0 && (
                          <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold ml-auto sm:ml-0">
                            {matchScore}% Match
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground mt-1">
                        {demanda.bairros && demanda.bairros.length > 0 && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="w-4 h-4 text-primary/60" />
                            <span
                              className="line-clamp-1 max-w-[200px]"
                              title={demanda.bairros.join(', ')}
                            >
                              {demanda.bairros.join(', ')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-primary/60" />
                          <span className="font-medium text-foreground/80">
                            Até R$ {(demanda.valor_maximo || 0).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        {demanda.dormitorios > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Home className="w-4 h-4 text-primary/60" />
                            <span>{demanda.dormitorios} dorm.</span>
                          </div>
                        )}
                        {demanda.vagas_estacionamento > 0 && (
                          <div className="flex items-center gap-1.5">
                            <Car className="w-4 h-4 text-primary/60" />
                            <span>{demanda.vagas_estacionamento} vagas</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      onClick={() => handleVincularDemanda(demanda)}
                      disabled={saving || linkingId !== null}
                      className={cn(
                        'w-full sm:w-auto shrink-0 transition-all shadow-sm',
                        isLinking && 'bg-primary/80',
                      )}
                    >
                      {isLinking ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Vinculando...
                        </>
                      ) : (
                        'VINCULAR'
                      )}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-card shrink-0 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10 relative">
          <p className="text-xs text-muted-foreground text-center sm:text-left">
            Ao salvar sem vincular, o imóvel ficará disponível no banco geral.
          </p>
          <div className="flex w-full sm:w-auto items-center justify-end gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving || linkingId !== null}
              className="flex-1 sm:flex-none"
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              onClick={handleSalvarSemVincular}
              disabled={saving || linkingId !== null}
              className="flex-1 sm:flex-none font-semibold"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Sem Vincular'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
