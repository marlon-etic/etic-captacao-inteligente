import { useState } from 'react'
import {
  MapPin,
  Calendar,
  Bed,
  Car,
  Bath,
  UserCircle,
  Share2,
  ExternalLink,
  Link2,
  X,
} from 'lucide-react'
import { CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import { cn } from '@/lib/utils'
import { VinculacaoModal } from './VinculacaoModal'

export function LoosePropertyCard({
  property,
  onClaim,
  onIgnore,
  onLink,
}: {
  property: CapturedProperty
  onClaim?: (p: CapturedProperty) => void
  onIgnore?: (code: string) => void
  onLink?: (p: CapturedProperty) => void
}) {
  const { toast } = useToast()
  const publicUrl = getPropertyPublicUrl(property.code)
  const [isVinculacaoModalOpen, setIsVinculacaoModalOpen] = useState(false)

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`Botão [compartilhar] clicado em [LoosePropertyCard]`, { url: publicUrl })
    }
    if (!publicUrl) {
      toast({
        title: 'Erro',
        description: 'Ação indisponível. Imóvel sem código válido.',
        variant: 'destructive',
      })
      return
    }
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

  const handleOpenVinculacao = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`Botão [vincular] clicado em [LoosePropertyCard]`, {
        code: property.code,
      })
    }
    setIsVinculacaoModalOpen(true)
  }

  const handleVinculacaoSuccess = () => {
    if (onLink) onLink(property)
    else if (onClaim) onClaim(property)
  }

  const captureDateStr = property.capturedAt
    ? new Date(property.capturedAt).toLocaleDateString('pt-BR')
    : (() => {
        if (import.meta.env.DEV) console.error(`Data ausente em card [${property.code}]`)
        return 'Data pendente'
      })()

  return (
    <>
      <Card className="overflow-visible flex flex-col h-full border-[2px] border-[#2E5F8A] hover:shadow-[0_8px_24px_rgba(26,58,82,0.15)] relative transition-all duration-150 ease-in-out bg-[#FFFFFF] rounded-[16px] z-0 group">
        {/* Imagem do Imóvel no Topo com Data */}
        <div className="relative h-48 w-full bg-[#F5F5F5] pointer-events-none shrink-0 border-b border-[#E5E5E5] rounded-t-[14px] overflow-hidden">
          <img
            src={
              property.photoUrl ||
              `https://img.usecurling.com/p/400/300?q=house&seed=${property.code}`
            }
            alt="Imóvel Disponível"
            className="w-full h-full object-cover"
          />
          {/* Header absoluto sobre a imagem com pointer-events-auto */}
          <div className="absolute top-3 left-3 right-3 flex justify-between items-start pointer-events-auto z-10">
            <Badge className="font-sans font-bold bg-white/90 text-[#333333] border border-[#E5E5E5] shadow-sm backdrop-blur-md px-2.5 py-1">
              📅 {captureDateStr}
            </Badge>
            <Badge className="font-bold shadow-sm bg-[#10B981] text-white border-none px-2.5 py-1 uppercase tracking-wide">
              🔓 DISPONÍVEL
            </Badge>
          </div>
          <div className="absolute bottom-3 left-3 pointer-events-auto z-10">
            <Badge className="font-bold text-[10px] text-white px-2 py-1 bg-[#1A3A52] shadow-sm uppercase tracking-widest">
              {property.propertyType === 'Aluguel' ? '🏠 ALUGUEL' : '🏢 VENDA'}
            </Badge>
          </div>
        </div>

        {/* Conteúdo Central */}
        <CardContent className="p-4 flex-grow flex flex-col gap-[12px] pointer-events-none relative z-0">
          <div className="flex justify-between items-start gap-2">
            <div className="text-[15px] leading-tight flex items-center gap-1 pointer-events-auto">
              <span className="font-bold text-[#333333]">🏷️ Código:</span>
              <a
                href={publicUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  'font-black text-[#1A3A52] hover:underline relative z-10 ml-1 text-[16px]',
                  !publicUrl && 'pointer-events-none text-[#999999]',
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [url] clicado em [LoosePropertyCard]`, {
                      url: publicUrl,
                    })
                  }
                  if (!publicUrl) e.preventDefault()
                }}
              >
                {property.code || 'N/A'}
              </a>
            </div>
            <span className="font-black text-[#10B981] whitespace-nowrap text-[18px] tracking-tight">
              {new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
                maximumFractionDigits: 0,
              }).format(property.value)}
            </span>
          </div>

          <p className="text-[13px] text-[#333333] font-medium flex items-center gap-1.5 mt-1 pointer-events-auto">
            <MapPin className="w-4 h-4 shrink-0 text-[#F44336]" />
            <span className="line-clamp-2">
              {property.bairro_tipo === 'outro' && <span className="mr-1">🔹</span>}
              {Array.isArray(property.neighborhood)
                ? property.neighborhood.join(', ')
                : property.neighborhood}
            </span>
          </p>

          <div className="flex gap-3 text-[13px] text-[#666666] mt-auto font-bold bg-[#F5F5F5] p-2 rounded-[8px] border border-[#E5E5E5] flex-wrap pointer-events-auto">
            {property.bedrooms !== undefined && (
              <span className="flex items-center gap-1.5">
                <Bed className="w-4 h-4 text-[#999999]" /> {property.bedrooms} dorms
              </span>
            )}
            {property.bathrooms !== undefined && (
              <span className="flex items-center gap-1.5">
                <Bath className="w-4 h-4 text-[#999999]" /> {property.bathrooms} banhs
              </span>
            )}
            {property.parkingSpots !== undefined && (
              <span className="flex items-center gap-1.5">
                <Car className="w-4 h-4 text-[#999999]" /> {property.parkingSpots} vagas
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-col gap-1 text-[12px] text-[#333333] pointer-events-auto">
            <p className="flex items-center gap-1.5 font-medium">
              <UserCircle className="w-4 h-4 shrink-0 text-[#3B82F6]" />
              Captador:{' '}
              <span className="font-bold text-[#1A3A52] truncate">
                {property.captador_name || 'N/A'}
              </span>
            </p>
          </div>

          {property.obs && (
            <p className="text-[12px] text-[#666666] mt-1 line-clamp-2 italic leading-tight pointer-events-auto bg-[#F8FAFC] p-2 rounded-md border border-[#E5E5E5]">
              "{property.obs}"
            </p>
          )}
        </CardContent>

        {/* Rodapé com Botões de Ação */}
        <div className="p-4 pt-4 pb-4 mt-auto border-t border-[#E5E5E5] bg-white flex flex-col lg:flex-row gap-[8px] z-10 relative pointer-events-auto rounded-b-[14px]">
          <div className="flex flex-row gap-[8px] w-full lg:w-auto">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    'flex-1 font-bold h-11 min-h-[44px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner hover:opacity-90 shadow-sm',
                    publicUrl
                      ? 'bg-[#1A3A52] text-white hover:bg-[#153045]'
                      : 'bg-[#E5E5E5] text-[#999999] hover:bg-[#E5E5E5] cursor-not-allowed',
                  )}
                  disabled={!publicUrl}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (import.meta.env.DEV) {
                      console.log(`Botão [ver_no_site] clicado em [LoosePropertyCard]`, {
                        url: publicUrl,
                      })
                    }
                    if (publicUrl) window.open(publicUrl, '_blank')
                  }}
                  aria-label={`Ver imóvel ${property.code} no site`}
                >
                  <ExternalLink className="w-[16px] h-[16px] mr-[6px]" />
                  <span className="truncate">Ver no site</span>
                </Button>
              </TooltipTrigger>
              {!publicUrl && (
                <TooltipContent zIndex={1100}>
                  <p>Imóvel sem código cadastrado</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[44px] h-11 min-h-[44px] p-0 shrink-0 border-[2px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner bg-white',
                    publicUrl
                      ? 'border-[#2E5F8A] text-[#1A3A52] hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'border-[#E5E5E5] text-[#999999] hover:bg-transparent cursor-not-allowed',
                  )}
                  disabled={!publicUrl}
                  onClick={handleCopyLink}
                  aria-label={`Compartilhar imóvel ${property.code}`}
                >
                  <Share2 className="w-[16px] h-[16px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent zIndex={1100}>
                <p>{publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col sm:flex-row flex-1 gap-[8px] w-full">
            <Button
              className="flex-1 bg-[#10B981] hover:bg-[#059669] text-white font-bold h-11 min-h-[44px] text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out active:shadow-inner border-none relative z-10 w-full"
              onClick={handleOpenVinculacao}
              aria-label={`Vincular imóvel ${property.code} a um cliente`}
            >
              <Link2 className="w-[16px] h-[16px] mr-1.5 shrink-0" />
              <span className="truncate">VINCULAR CLIENTE</span>
            </Button>

            {onIgnore && (
              <Button
                variant="outline"
                className="w-full sm:flex-1 h-11 min-h-[44px] font-bold border-[#E5E5E5] text-[#333333] hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-150 ease-in-out active:shadow-inner relative z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [ignorar] clicado em [LoosePropertyCard]`, {
                      code: property.code,
                    })
                  }
                  onIgnore(property.code)
                }}
                aria-label={`Ignorar imóvel ${property.code}`}
              >
                <X className="w-[16px] h-[16px] mr-1.5" />
                <span className="truncate">Não interessa</span>
              </Button>
            )}
          </div>
        </div>
      </Card>

      <VinculacaoModal
        isOpen={isVinculacaoModalOpen}
        onClose={() => setIsVinculacaoModalOpen(false)}
        onSuccess={handleVinculacaoSuccess}
        imovel={{
          id: property.id || '',
          codigo_imovel: property.code,
          endereco: Array.isArray(property.neighborhood)
            ? property.neighborhood.join(', ')
            : property.neighborhood,
          preco: property.value,
          dormitorios: property.bedrooms,
          vagas: property.parkingSpots,
          tipo: property.propertyType,
        }}
      />
    </>
  )
}
