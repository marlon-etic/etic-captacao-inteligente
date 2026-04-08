import { useState, useMemo, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Home, DollarSign, MapPin, Loader2 } from 'lucide-react'
import { CapturedProperty, Demand } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { calculateMatching, getScoreBadgeColor, getScoreProgressColor } from '@/lib/matching'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { vinculacaoService } from '@/services/vinculacao'

interface ManualLinkModalProps {
  isOpen: boolean
  onClose: () => void
  property: CapturedProperty | null
}

import { supabase } from '@/lib/supabase/client'

export function ManualLinkModal({ isOpen, onClose, property }: ManualLinkModalProps) {
  const { demands, currentUser } = useAppStore()
  const { toast } = useToast()
  const [searchTerm, setSearchTerm] = useState('')
  const [linkingDemandId, setLinkingDemandId] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const compatibleDemands = useMemo(() => {
    if (!property || !currentUser) return []

    return demands
      .map((d) => {
        const clienteMock = {
          bairros:
            d.location && Array.isArray(d.location)
              ? d.location
              : d.location?.split(',').map((s: string) => s.trim()) || [],
          valor_minimo: d.minBudget || 0,
          valor_maximo: d.maxBudget || d.budget || 0,
          dormitorios: d.bedrooms || 0,
          vagas_estacionamento: d.parkingSpots || 0,
          nivel_urgencia: 'Média',
        }

        const imovelMock = {
          endereco: Array.isArray(property.neighborhood)
            ? property.neighborhood[0]
            : property.neighborhood || '',
          preco: property.value || 0,
          dormitorios: property.bedrooms || property.dormitorios || 0,
          vagas: property.parkingSpots || property.vagas || 0,
        }

        const match = calculateMatching(imovelMock, clienteMock)
        return { ...d, score: match.score }
      })
      .filter((d) => {
        if (d.createdBy !== currentUser.id) return false
        if (
          ['Perdida', 'Impossível', 'Negócio', 'Arquivado', 'Perdida_baixa', 'Concluida'].some(
            (s) => d.status.toLowerCase() === s.toLowerCase(),
          )
        )
          return false
        if (property.propertyType && d.type && property.propertyType !== d.type) return false

        return true
      })
      .sort((a, b) => b.score - a.score)
  }, [demands, currentUser, property])

  const filteredDemands = useMemo(() => {
    if (!searchTerm) return compatibleDemands
    return compatibleDemands.filter((d) =>
      d.clientName.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [compatibleDemands, searchTerm])

  const handleLink = async (demand: Demand) => {
    const ts = () => new Date().toISOString()

    if (!vinculacaoService || !vinculacaoService.linkImovelToDemanda) {
      console.log(`[${ts()}] 🔴 [VINCULAR] ERRO: Função linkImovelToDemanda não encontrada`)
    }

    if (!property) {
      console.log(`[${ts()}] 🔴 [VINCULAR] Botão clicado mas sem imóvel`)
      return
    }

    console.log(`[${ts()}] 🔵 [VINCULAR] Clique detectado em demanda_id=${demand.id}`)
    if (demand.score < 50) return // dupla proteção

    setLinkingDemandId(demand.id)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    // Forçar a renderização do estado de loading antes da requisição pesada para evitar travamento da UI
    await new Promise((resolve) => setTimeout(resolve, 50))

    try {
      const isLocacao = demand.type === 'Aluguel' || demand.tipo_demanda === 'Aluguel'

      const executeRequest = async () => {
        console.log(
          `[${ts()}] 🔵 [VINCULAR] Buscando ID real do imóvel com código ${property.code}`,
        )
        // Find the exact property ID in the database using the code
        let fetchImovelQuery = supabase
          .from('imoveis_captados')
          .select('id')
          .eq('codigo_imovel', property.code)
        if (signal) fetchImovelQuery = fetchImovelQuery.abortSignal(signal as any)

        const { data: existingImovel, error: fetchError } = await fetchImovelQuery.single()

        if (fetchError || !existingImovel) {
          console.log(
            `[${ts()}] 🔴 [VINCULAR] Imóvel não encontrado na base: ${fetchError?.message}`,
          )
          return {
            success: false,
            error: 'Imóvel não encontrado na base de dados.',
            errorType: 'not_found',
          }
        }

        const timeoutId = setTimeout(() => {
          console.log(
            `[${ts()}] 🔴 [VINCULAR] Timeout! Requisição demorou mais de 30s. Abortando...`,
          )
          abortControllerRef.current?.abort()
        }, 30000)

        const res = await vinculacaoService.linkImovelToDemanda(
          {
            imovelId: existingImovel.id,
            demandaId: demand.id,
            usuarioId: currentUser.id,
            isLocacao,
          },
          signal,
        )

        clearTimeout(timeoutId)
        return res
      }

      let response: any = null
      for (let attempt = 0; attempt <= 3; attempt++) {
        try {
          response = await executeRequest()

          if (!response.success) {
            const errorType = response.errorType || 'unknown'
            if (['permission', 'not_found', 'validation', 'timeout'].includes(errorType)) {
              break
            }
            if (attempt < 3) throw new Error(response.error || 'SERVER_ERROR')
          }
          break // Sucesso
        } catch (err: any) {
          if (err.name === 'AbortError') {
            response = {
              success: false,
              error: 'Timeout na requisição',
              errorType: 'timeout',
            }
            break
          }
          if (attempt === 3) {
            response = {
              success: false,
              error: 'Erro de conexão ao servidor.',
              errorType: 'network',
            }
            break
          }
          const delay = Math.pow(2, attempt) * 1000
          toast({
            title: 'Conexão',
            description: 'Erro de conexão. Tentando novamente...',
          })
          await new Promise((r) => setTimeout(r, delay))
        }
      }

      if (!response?.success) {
        const errorType = response?.errorType || 'unknown'
        console.log(
          `[${ts()}] 🔴 [VINCULAR] Erro: ${response?.error || 'Desconhecido'} (Tipo: ${errorType})`,
        )

        let finalTitle = 'Erro'
        let finalDesc = response?.error || 'Erro ao vincular. Contate suporte'

        if (errorType === 'permission') {
          finalTitle = 'Permissão Negada'
          finalDesc = '🔴 Você não tem permissão para vincular este imóvel. Contate o administrador'
        } else if (errorType === 'not_found') {
          finalTitle = 'Não Encontrado'
          finalDesc = '🔴 Imóvel ou demanda não encontrado. Recarregue a página'
        } else if (errorType === 'server') {
          finalTitle = 'Erro no Servidor'
          finalDesc = '🔴 Erro no servidor. Tente novamente em alguns segundos'
        } else if (errorType === 'timeout' || errorType === 'network') {
          finalTitle = 'Erro de Rede'
          finalDesc = '🔴 Conexão perdida. Verifique sua internet e tente novamente'
        }

        toast({
          title: finalTitle,
          description: finalDesc,
          variant: 'destructive',
        })
        return
      }

      console.log(`[${ts()}] 🟢 [VINCULAR] Sucesso! Demanda vinculada`)

      toast({
        title: 'Imóvel vinculado com sucesso!',
        description: `Imóvel vinculado a ${demand.clientName} com sucesso!`,
        className: 'bg-[#4CAF50] text-white',
      })
      onClose()
      setSearchTerm('')
    } catch (err: any) {
      console.error(`[${ts()}] 🔴 [VINCULAR] Erro desconhecido:`, err)
      toast({
        title: 'Erro de Sistema',
        description: '🔴 Erro no servidor. Tente novamente em alguns segundos',
        variant: 'destructive',
      })
    } finally {
      setLinkingDemandId(null)
      abortControllerRef.current = null
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          onClose()
          setSearchTerm('')
        }
      }}
    >
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col p-0 overflow-hidden bg-[#FFFFFF]">
        <DialogHeader className="p-6 pb-2 shrink-0">
          <DialogTitle className="text-[20px] text-[#1A3A52]">
            Vincular imóvel {property?.code} a qual cliente?
          </DialogTitle>
          <DialogDescription className="text-[#999999]">
            Selecione um cliente com demanda compatível para vincular este imóvel.
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 py-2 shrink-0 border-b border-[#E5E5E5]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#999999] w-4 h-4" />
            <Input
              placeholder="Buscar cliente por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-[48px]"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 bg-[#F5F5F5]">
          {compatibleDemands.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#333333] font-medium">
                Nenhum cliente seu tem demanda compatível
              </p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[#333333] font-medium">Nenhum cliente encontrado com este nome</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredDemands.map((d) => (
                <div
                  key={d.id}
                  className="bg-[#FFFFFF] p-4 rounded-[8px] border border-[#E5E5E5] shadow-sm flex flex-col gap-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-[16px] text-[#1A3A52]">{d.clientName}</p>
                      <Badge variant="outline" className="mt-1">
                        {d.status}
                      </Badge>
                    </div>
                    <Badge
                      className={cn(
                        'text-[12px] font-black px-2.5 py-1 border-none shadow-sm',
                        getScoreBadgeColor(d.score),
                      )}
                    >
                      {d.score}% Match
                    </Badge>
                  </div>
                  <Progress
                    value={d.score}
                    indicatorClassName={getScoreProgressColor(d.score)}
                    className="h-1.5"
                  />

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[#333333]">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {d.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      {d.minBudget ? `R$ ${d.minBudget.toLocaleString('pt-BR')} - ` : ''}R${' '}
                      {(d.maxBudget || d.budget || 0).toLocaleString('pt-BR')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Home className="w-3.5 h-3.5" /> {d.bedrooms || 0} dorms
                    </span>
                  </div>

                  <Button
                    disabled={linkingDemandId !== null || d.score < 50}
                    className={cn(
                      'w-full font-bold h-[48px] mt-2 transition-colors',
                      d.score >= 50 && linkingDemandId === null
                        ? 'bg-[#4CAF50] hover:bg-[#388E3C] text-white'
                        : 'bg-gray-400 text-white cursor-not-allowed',
                    )}
                    onClick={() => {
                      if (d.score >= 50 && linkingDemandId === null) {
                        handleLink(d)
                      }
                    }}
                    title={
                      d.score < 50 ? 'Match insuficiente para vinculação (Mínimo 50%)' : undefined
                    }
                  >
                    {linkingDemandId === d.id ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Vinculando...
                      </span>
                    ) : (
                      `✅ VINCULAR A ${d.clientName.toUpperCase()}`
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="p-4 shrink-0 border-t border-[#E5E5E5] bg-[#FFFFFF] sm:justify-center">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto h-[48px]">
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
