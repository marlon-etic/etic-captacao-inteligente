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
    e.stopPropagation()
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast({
        title: 'Sucesso',
        description: 'Link copiado para clipboard!',
        duration: 3000,
      })
    } catch (err) {
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
          className: 'bg-[#F59E0B] text-white border-none',
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

  return (
    <div
      className={cn(
        'bg-white rounded-lg p-4 shadow-[0_2px_4px_rgba(26,58,82,0.1)] border flex flex-col gap-3 transition-colors',
        isFechado
          ? 'border-[#10B981]/50 bg-[#ECFDF5]'
          : isVisitado
            ? 'border-[#F59E0B]/50 bg-[#FFFBEB]'
            : 'border-[#E5E5E5]',
      )}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="flex items-center gap-2">
          <span className="font-black text-[#1A3A52] text-[16px] truncate">{p.code}</span>
          <Badge
            className={cn(
              'text-[10px] font-bold px-2 py-0.5 border-none shadow-sm uppercase tracking-wider',
              isFechado ? 'bg-[#10B981]' : isVisitado ? 'bg-[#F59E0B]' : 'bg-[#3B82F6]',
            )}
          >
            {isFechado ? 'FECHADO' : isVisitado ? 'VISITADO' : 'CAPTURADO'}
          </Badge>
        </div>
        <span className="text-[14px] font-bold text-[#10B981] shrink-0 whitespace-nowrap bg-white px-2 py-0.5 rounded border border-[#10B981]/20">
          R$ {formatPrice(p.preco)}
        </span>
      </div>

      <div className="flex flex-col gap-1.5 text-[13px]">
        <span className="text-[#666666] line-clamp-2 flex items-start gap-1.5">
          <MapPin className="w-4 h-4 text-[#F44336] shrink-0 mt-0.5" />
          {p.endereco || 'Endereço não informado'}
        </span>
        <span className="text-[#666666] flex items-center gap-1.5 mt-1">
          <Building2 className="w-4 h-4 text-[#3B82F6] shrink-0" />
          Captador: <strong className="text-[#333333]">{p.captador_nome}</strong>
        </span>
      </div>

      <div className="flex gap-2 mt-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="flex-1 font-bold text-[12px] text-[#333333] border-[#E5E5E5] enabled:hover:bg-[#F5F5F5] h-[44px]"
              disabled={!publicUrl}
              onClick={(e) => {
                e.stopPropagation()
                if (publicUrl) window.open(publicUrl, '_blank')
              }}
            >
              <ExternalLink className="w-4 h-4" /> Ver no site
            </Button>
          </TooltipTrigger>
          {!publicUrl && <TooltipContent>Imóvel sem código cadastrado</TooltipContent>}
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="w-[44px] h-[44px] shrink-0 text-[#333333] border-[#E5E5E5] enabled:hover:bg-[#F5F5F5]"
              disabled={!publicUrl}
              onClick={handleCopyLink}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}
          </TooltipContent>
        </Tooltip>
      </div>

      {isOwnerOrAdmin && (
        <div className="flex flex-col sm:flex-row gap-2 mt-2 pt-3 border-t border-[#E5E5E5]">
          {!isFechado && !isVisitado && (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 font-bold border-[#F59E0B] text-[#B45309] enabled:hover:bg-[#FFFBEB] h-[44px]"
              onClick={() => updateEtapa('visitado')}
              isLoading={isUpdating}
              loadingText="Salvando..."
            >
              <Eye className="w-4 h-4" /> Marcar como Visitado
            </Button>
          )}

          {!isFechado && (
            <Button
              size="sm"
              className="flex-1 font-bold bg-[#10B981] enabled:hover:bg-[#059669] text-white h-[44px] shadow-sm border border-transparent"
              onClick={() => updateEtapa('fechado')}
              isLoading={isUpdating}
              loadingText="Salvando..."
            >
              <CheckCircle2 className="w-4 h-4" /> Marcar como Fechado
            </Button>
          )}

          {(isFechado || isVisitado) && (
            <Button
              size="sm"
              variant="outline"
              className="font-bold text-[#666666] enabled:hover:text-[#1A3A52] shrink-0 h-[44px]"
              onClick={() => updateEtapa(isFechado ? 'visitado' : 'capturado')}
              isLoading={isUpdating}
              loadingText="Desfazendo..."
            >
              <RotateCcw className="w-4 h-4" /> Desfazer
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
