import { useState } from 'react'
import { useUltimosImoveis, UltimoImovel } from '@/hooks/use-ultimos-imoveis'
import { useMatchCount } from '@/hooks/use-match-count'
import { useNavigate } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Building,
  MapPin,
  Bed,
  Car,
  Calendar,
  DollarSign,
  User,
  Link as LinkIcon,
  Share2,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useToast } from '@/hooks/use-toast'
import { VinculacaoModal, VinculacaoImovelData } from './VinculacaoModal'
import { ImovelDetailsSheet } from './ImovelDetailsSheet'
import { SyncIndicator } from './SyncIndicator'
import { Zap } from 'lucide-react'

function MatchBadge({ type, id }: { type: 'imovel' | 'demanda'; id: string }) {
  const { count } = useMatchCount(type, id)
  const navigate = useNavigate()

  if (count === 0) return null

  return (
    <div
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        navigate('/app/match-inteligentes')
      }}
      className="absolute -top-3 -right-3 bg-blue-500 text-white px-2.5 py-0.5 rounded-full text-[10px] font-black cursor-pointer hover:bg-blue-600 transition-colors flex items-center gap-1 shadow-md z-20 animate-fade-in"
    >
      <Zap className="w-3 h-3 fill-current" /> {count} Match{count !== 1 ? 'es' : ''}
    </div>
  )
}

export function UltimosImoveisTab() {
  const [periodo, setPeriodo] = useState<'24h' | '7d' | '30d' | 'todos'>('30d')
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'meus'>('todos')
  const [imovelParaVincular, setImovelParaVincular] = useState<VinculacaoImovelData | null>(null)
  const [selectedImovel, setSelectedImovel] = useState<UltimoImovel | null>(null)

  const { imoveis, loading, syncing, refresh } = useUltimosImoveis(periodo, tipoFiltro)
  const { toast } = useToast()

  const handleCopyLink = async (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`🔘 [Click] UltimosImoveisTab Action: compartilhar`, { url })
    }
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Sucesso',
        description: 'Link copiado para clipboard!',
        duration: 3000,
      })
    } catch (err) {
      if (import.meta.env.DEV) console.error('Erro ao copiar link', err)
      toast({
        title: 'Erro',
        description: 'Não foi possível copiar o link',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in pb-8">
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-white p-4 rounded-[12px] shadow-sm border border-[#E5E5E5]">
        <div className="flex items-center gap-2">
          <Building className="w-5 h-5 text-[#1A3A52]" />
          <h2 className="font-bold text-[18px] text-[#1A3A52]">Últimos Imóveis Cadastrados</h2>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={periodo} onValueChange={(v: any) => setPeriodo(v)}>
            <SelectTrigger className="w-full sm:w-[150px] min-h-[44px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Últimas 24h</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="todos">Todos</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tipoFiltro} onValueChange={(v: any) => setTipoFiltro(v)}>
            <SelectTrigger className="w-full sm:w-[180px] min-h-[44px]">
              <SelectValue placeholder="Filtro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os imóveis</SelectItem>
              <SelectItem value="meus">Minhas Demandas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-[200px] rounded-[12px]" />
          ))}
        </div>
      ) : imoveis.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-[12px] border border-dashed border-[#E5E5E5] flex flex-col items-center justify-center">
          <Building className="w-12 h-12 text-[#999999] opacity-30 mb-3" />
          <p className="font-bold text-[16px] text-[#333333]">
            Nenhum imóvel encontrado neste período.
          </p>
          <p className="text-[14px] text-[#666666]">Altere os filtros para ver mais resultados.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
          {imoveis.map((imovel) => {
            const publicUrl = imovel.codigo_imovel ? getPropertyPublicUrl(imovel.codigo_imovel) : ''

            return (
              <Card
                key={imovel.id}
                onClick={(e) => {
                  if (import.meta.env.DEV) {
                    console.log(`🔘 [Click] UltimosImoveisTab Card Action: details`, {
                      id: imovel.id,
                    })
                  }
                  setSelectedImovel(imovel)
                }}
                className={cn(
                  'overflow-hidden transition-all hover:shadow-lg border-l-[6px] cursor-pointer hover:-translate-y-1 relative z-0',
                  imovel.is_minha_demanda
                    ? 'border-l-[#10B981]'
                    : !imovel.has_demanda
                      ? 'border-l-[#3B82F6]'
                      : 'border-l-[#F59E0B]',
                )}
              >
                <CardContent className="p-4 space-y-3 pointer-events-none relative z-0">
                  <div className="flex justify-between items-start pointer-events-auto relative">
                    <MatchBadge type="imovel" id={imovel.id} />
                    <Badge
                      variant="outline"
                      className="font-mono bg-[#F5F5F5] text-[#333333] border-[#E5E5E5]"
                    >
                      {imovel.codigo_imovel}
                    </Badge>
                    <span className="text-[12px] font-medium text-[#666666] flex items-center gap-1 bg-[#F9FAFB] px-2 py-1 rounded-md">
                      <Calendar className="w-3.5 h-3.5" />
                      {formatDistanceToNow(new Date(imovel.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>

                  <div className="space-y-2 pointer-events-auto">
                    <div className="font-black text-[18px] text-[#1A3A52] flex flex-col gap-1">
                      {(imovel.tipo === 'Venda' || imovel.tipo === 'Ambos') && imovel.preco > 0 && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-[#10B981]" />
                          Venda: R$ {imovel.preco.toLocaleString('pt-BR')}
                        </div>
                      )}
                      {(imovel.tipo === 'Aluguel' ||
                        imovel.tipo === 'Locação' ||
                        imovel.tipo === 'Ambos') &&
                        (imovel.valor > 0 || (imovel.preco > 0 && imovel.preco <= 100000)) && (
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-4 h-4 text-[#3B82F6]" />
                            Aluguel: R$ {(imovel.valor || imovel.preco).toLocaleString('pt-BR')}
                          </div>
                        )}
                    </div>
                    <div className="text-[14px] text-[#333333] flex items-start gap-1.5 font-medium pt-1">
                      <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-[#666666]" />
                      <span className="line-clamp-2 leading-tight">
                        {imovel.endereco || 'Endereço não informado'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 text-[13px] text-[#666666] font-bold pointer-events-auto">
                    <div className="flex items-center gap-1 bg-[#F5F5F5] px-2 py-1 rounded-md">
                      <Bed className="w-4 h-4" /> {imovel.dormitorios}
                    </div>
                    <div className="flex items-center gap-1 bg-[#F5F5F5] px-2 py-1 rounded-md">
                      <Car className="w-4 h-4" /> {imovel.vagas}
                    </div>
                    <div className="flex items-center gap-1 ml-auto bg-[#E8F0F8] text-[#1A3A52] px-2 py-1 rounded-md max-w-[120px]">
                      <User className="w-3.5 h-3.5 shrink-0" />{' '}
                      <span className="truncate">{imovel.captador_nome}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-[#E5E5E5] flex flex-col gap-3 pointer-events-auto relative z-10">
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[12px] font-black px-2.5 py-1 rounded-[6px] uppercase tracking-wide',
                          imovel.is_minha_demanda
                            ? 'bg-[#10B981]/10 text-[#059669]'
                            : !imovel.has_demanda
                              ? 'bg-[#3B82F6]/10 text-[#1D4ED8]'
                              : 'bg-[#F59E0B]/10 text-[#B45309]',
                        )}
                      >
                        {imovel.is_minha_demanda
                          ? 'Sua Demanda'
                          : !imovel.has_demanda
                            ? 'Disponível (Genérico)'
                            : 'Demanda de Outro'}
                      </span>

                      {!imovel.has_demanda && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 text-[12px] gap-1.5 text-[#1D4ED8] hover:text-[#1e3a8a] hover:bg-[#3B82F6]/10 font-bold px-2 relative z-10"
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            if (import.meta.env.DEV) {
                              console.log(`🔘 [Click] UltimosImoveisTab Action: vincular`, {
                                id: imovel.id,
                              })
                            }
                            setImovelParaVincular({
                              id: imovel.id,
                              codigo_imovel: imovel.codigo_imovel,
                              endereco: imovel.endereco,
                              preco: imovel.preco,
                              dormitorios: imovel.dormitorios,
                              vagas: imovel.vagas,
                              tipo: (imovel.demanda_tipo as 'Venda' | 'Aluguel') || undefined,
                            })
                          }}
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Vincular
                        </Button>
                      )}
                    </div>

                    <div className="flex gap-2 relative z-10">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 font-bold text-[12px] text-[#333333] border-[#E5E5E5] hover:bg-[#F5F5F5] h-9 relative z-10"
                            disabled={!publicUrl}
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              if (import.meta.env.DEV) {
                                console.log(`🔘 [Click] UltimosImoveisTab Action: ver no site`, {
                                  url: publicUrl,
                                })
                              }
                              if (publicUrl) window.open(publicUrl, '_blank')
                            }}
                          >
                            <ExternalLink className="w-3.5 h-3.5 mr-1.5" /> Ver no site
                          </Button>
                        </TooltipTrigger>
                        {!publicUrl && (
                          <TooltipContent>Imóvel sem código cadastrado</TooltipContent>
                        )}
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="icon"
                            variant="outline"
                            className="w-9 h-9 shrink-0 text-[#333333] border-[#E5E5E5] hover:bg-[#F5F5F5] relative z-10"
                            disabled={!publicUrl}
                            onClick={(e) => handleCopyLink(e, publicUrl)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <ImovelDetailsSheet
        imovel={selectedImovel}
        onClose={() => setSelectedImovel(null)}
        onVincular={(imv) => {
          setImovelParaVincular({
            id: imv.id,
            codigo_imovel: imv.codigo_imovel,
            endereco: imv.endereco,
            preco: imv.preco,
            dormitorios: imv.dormitorios,
            vagas: imv.vagas,
            tipo: (imv.demanda_tipo as 'Venda' | 'Aluguel') || undefined,
          })
        }}
      />

      <VinculacaoModal
        isOpen={!!imovelParaVincular}
        onClose={() => setImovelParaVincular(null)}
        imovel={imovelParaVincular}
        onSuccess={() => {
          refresh()
          setSelectedImovel(null)
        }}
      />

      <SyncIndicator isSyncing={syncing} />
    </div>
  )
}
