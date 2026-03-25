import { CapturedProperty, Demand } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye, CheckCircle2, RotateCcw, Building2, MapPin, Share2, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SupabaseCapturedProperty } from '@/hooks/use-supabase-demands'
import useAppStore from '@/stores/useAppStore'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'

interface Props {
  property: SupabaseCapturedProperty | CapturedProperty
  demand?: any
  isOwnerOrAdmin?: boolean
}

export function ImovelCapturadoCard({ property, demand, isOwnerOrAdmin = true }: Props) {
  const { currentUser } = useAppStore()
  const [isUpdating, setIsUpdating] = useState(false)

  // Normaliza o objeto de propriedade caso venha mapeado ou cru
  const p: any = {
    ...property,
    id: property.id,
    code:
      (property as CapturedProperty).code || (property as SupabaseCapturedProperty).codigo_imovel,
    endereco:
      (property as CapturedProperty).neighborhood ||
      (property as SupabaseCapturedProperty).endereco,
    preco: (property as CapturedProperty).value || (property as SupabaseCapturedProperty).preco,
    etapa_funil:
      (property as CapturedProperty).etapa_funil ||
      (property as SupabaseCapturedProperty).etapa_funil ||
      'capturado',
    captador_nome:
      (property as CapturedProperty).captador_name ||
      (property as SupabaseCapturedProperty).captador_nome ||
      'Captador',
  }

  const isVisitado = p.etapa_funil === 'visitado'
  const isFechado = p.etapa_funil === 'fechado'

  const publicUrl = getPropertyPublicUrl(p.code)

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`Botão [compartilhar] clicado em [ImovelCapturadoCard]`, { url: publicUrl })
    }
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast({
        title: 'Sucesso',
        description: 'Link copiado!',
        duration: 3000,
        className: 'bg-[#10B981] text-white border-none',
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

  const updateEtapa = async (novaEtapa: string) => {
    if (!p.id || isUpdating) return
    setIsUpdating(true)
    try {
      const { error } = await supabase
        .from('imoveis_captados')
        .update({ etapa_funil: novaEtapa })
        .eq('id', p.id)

      if (error) throw error

      if (novaEtapa === 'fechado') {
        toast({
          title: '🎉 Imóvel Fechado!',
          description: 'A demanda foi marcada como ganha e os pontos foram atribuídos ao captador.',
          className: 'bg-[#10B981] text-white border-none',
        })
      } else if (novaEtapa === 'visitado') {
        toast({
          title: '👁️ Visita Marcada',
          description: 'O status do imóvel foi atualizado para Visitado.',
          className: 'bg-[#FF9800] text-white border-none',
        })
      } else {
        toast({
          title: '⏪ Etapa Revertida',
          description: 'O status do imóvel voltou para Capturado.',
        })
      }
    } catch (err: any) {
      toast({
        title: 'Erro ao atualizar etapa',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const captureDateStr =
    p.created_at || p.capturedAt
      ? new Date(p.created_at || p.capturedAt).toLocaleDateString('pt-BR')
      : (() => {
          if (import.meta.env.DEV) console.error(`Data ausente em card [${p.code}]`)
          return 'Data pendente'
        })()

  return (
    <div
      className={cn(
        'bg-white rounded-[12px] shadow-[0_2px_4px_rgba(26,58,82,0.05)] border-[2px] flex flex-col transition-all duration-200 overflow-visible relative z-0',
        isFechado
          ? 'border-[#10B981]/50 bg-[#ECFDF5]'
          : isVisitado
            ? 'border-[#F59E0B]/50 bg-[#FFFBEB]'
            : 'border-[#E5E5E5]',
      )}
    >
      <div
        className={cn(
          'px-4 pt-4 pb-3 border-b flex justify-between items-start pointer-events-none rounded-t-[10px]',
          isFechado
            ? 'border-[#10B981]/20 bg-[#10B981]/5'
            : isVisitado
              ? 'border-[#F59E0B]/20 bg-[#F59E0B]/5'
              : 'border-[#E5E5E5] bg-[#F5F5F5]/50',
        )}
      >
        <div className="flex flex-col gap-2 pointer-events-auto">
          <span className="text-[12px] text-[#6B7280] font-sans font-bold bg-white px-2.5 py-1.5 rounded-[6px] border border-[#E5E5E5] shadow-sm flex items-center gap-1.5 w-fit">
            📅 {captureDateStr}
          </span>
          <div className="flex items-center gap-2">
            <span
              className="font-black text-[#1A3A52] text-[15px] truncate hover:underline cursor-pointer transition-colors"
              title={p.code}
            >
              <a
                href={publicUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => {
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [url] clicado em [ImovelCapturadoCard]`, { url: publicUrl })
                  }
                  if (!publicUrl) e.preventDefault()
                }}
                className={cn(!publicUrl && 'pointer-events-none text-[#999999]')}
              >
                {p.code}
              </a>
            </span>
            <Badge
              className={cn(
                'text-[10px] font-bold px-2 py-0.5 border-none shadow-sm uppercase tracking-wider',
                isFechado
                  ? 'bg-[#10B981] text-white'
                  : isVisitado
                    ? 'bg-[#FF9800] text-white'
                    : 'bg-[#3B82F6] text-white',
              )}
            >
              {isFechado ? 'FECHADO' : isVisitado ? 'VISITADO' : 'CAPTURADO'}
            </Badge>
          </div>
        </div>
        <span className="text-[15px] font-black text-[#10B981] shrink-0 whitespace-nowrap bg-white px-2 py-0.5 rounded-md border border-[#10B981]/20 shadow-sm pointer-events-auto mt-auto">
          R$ {formatPrice(p.preco)}
        </span>
      </div>

      <div className="p-4 flex flex-col gap-2 pointer-events-none bg-white flex-1 relative z-0">
        <span className="text-[#333333] text-[13px] font-medium flex items-start gap-1.5 pointer-events-auto">
          <MapPin className="w-4 h-4 text-[#F44336] shrink-0 mt-0.5" />
          <span className="line-clamp-2">{p.endereco || 'Endereço não informado'}</span>
        </span>
        <span className="text-[#666666] text-[12px] flex items-center gap-1.5 mt-1 bg-[#F8FAFC] p-2 rounded-md border border-[#E5E5E5] pointer-events-auto">
          <Building2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
          Captador: <strong className="text-[#333333]">{p.captador_nome}</strong>
        </span>
      </div>

      <div className="px-4 pt-4 pb-4 border-t border-[#E5E5E5] flex flex-col lg:flex-row flex-wrap gap-2 bg-white mt-auto relative z-10 pointer-events-auto rounded-b-[10px]">
        <div className="flex gap-2 w-full lg:w-auto lg:flex-1 order-last lg:order-none">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  'flex-1 font-bold text-[13px] h-11 min-h-[44px] transition-all duration-150 ease-in-out active:shadow-inner relative z-10',
                  publicUrl
                    ? 'bg-[#1A3A52] text-white hover:bg-[#153045] shadow-sm'
                    : 'bg-[#E5E5E5] text-[#999999]',
                )}
                disabled={!publicUrl}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [ver_no_site] clicado em [ImovelCapturadoCard]`, {
                      url: publicUrl,
                    })
                  }
                  if (publicUrl) window.open(publicUrl, '_blank')
                }}
                aria-label={`Ver imóvel ${p.code} no site`}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />{' '}
                <span className="truncate">Ver no site</span>
              </Button>
            </TooltipTrigger>
            {!publicUrl && (
              <TooltipContent zIndex={1100}>Imóvel sem código cadastrado</TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-[44px] shrink-0 h-11 min-h-[44px] p-0 border-[2px] transition-all duration-150 ease-in-out active:shadow-inner relative z-10',
                  publicUrl
                    ? 'border-[#2E5F8A] text-[#1A3A52] hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'border-[#E5E5E5] text-[#999999]',
                )}
                disabled={!publicUrl}
                onClick={handleCopyLink}
                aria-label={`Compartilhar imóvel ${p.code}`}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent zIndex={1100}>
              {publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}
            </TooltipContent>
          </Tooltip>
        </div>

        {isOwnerOrAdmin && (
          <>
            {!isFechado && !isVisitado && (
              <Button
                variant="outline"
                className="flex-1 w-full lg:w-auto font-bold text-[13px] border-[#F59E0B] text-[#B45309] hover:bg-[#FFFBEB] h-11 min-h-[44px] transition-all duration-150 ease-in-out active:shadow-inner relative z-10 shadow-sm"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [visitado] clicado em [ImovelCapturadoCard]`, {
                      id: p.id,
                    })
                  }
                  updateEtapa('visitado')
                }}
                isLoading={isUpdating}
                loadingText="Salvando..."
                aria-label={`Marcar imóvel ${p.code} como Visitado`}
              >
                <Eye className="w-4 h-4 mr-1.5" /> <span className="truncate">Visitado</span>
              </Button>
            )}

            {!isFechado && (
              <Button
                className="flex-1 w-full lg:w-auto font-bold text-[13px] bg-[#10B981] hover:bg-[#059669] text-white h-11 min-h-[44px] shadow-sm border border-transparent transition-all duration-150 ease-in-out active:shadow-inner relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [fechado] clicado em [ImovelCapturadoCard]`, { id: p.id })
                  }
                  updateEtapa('fechado')
                }}
                isLoading={isUpdating}
                loadingText="Salvando..."
                aria-label={`Marcar imóvel ${p.code} como Fechado`}
              >
                <CheckCircle2 className="w-4 h-4 mr-1.5" />{' '}
                <span className="truncate">Fechado</span>
              </Button>
            )}

            {(isFechado || isVisitado) && (
              <Button
                variant="outline"
                className="flex-1 w-full lg:w-auto font-bold text-[13px] border-[#E5E5E5] text-[#666666] hover:text-[#1A3A52] hover:bg-gray-100 dark:hover:bg-gray-800 h-11 min-h-[44px] transition-all duration-150 ease-in-out active:shadow-inner relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [desfazer] clicado em [ImovelCapturadoCard]`, { id: p.id })
                  }
                  updateEtapa(isFechado ? 'visitado' : 'capturado')
                }}
                isLoading={isUpdating}
                loadingText="Desfazendo..."
                aria-label={`Desfazer etapa do imóvel ${p.code}`}
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> <span className="truncate">Desfazer</span>
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  )
}
