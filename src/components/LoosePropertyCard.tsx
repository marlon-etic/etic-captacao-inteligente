import { MapPin, Calendar, Bed, Car, Bath, UserCircle } from 'lucide-react'
import { CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import { cn } from '@/lib/utils'

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

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      toast({
        title: 'Link copiado!',
        description: 'A URL do imóvel foi copiada para a área de transferência.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao copiar link',
        description: 'Não foi possível copiar a URL.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Card className="overflow-hidden flex flex-col h-full border-[2px] border-[#2E5F8A] hover:shadow-[0_8px_24px_rgba(26,58,82,0.15)] relative transition-all bg-[#FFFFFF] rounded-[12px]">
      <div className="relative h-48 w-full bg-[#F5F5F5]">
        <img
          src={
            property.photoUrl ||
            `https://img.usecurling.com/p/400/300?q=house&seed=${property.code}`
          }
          alt="Imóvel Disponível"
          className="w-full h-full object-cover"
        />
        <div className="absolute top-2 right-2">
          <Badge
            variant="outline"
            className="font-bold shadow-sm bg-[#FFFFFF] text-[#1A3A52] border-[#2E5F8A]"
          >
            🔓 Disponível
          </Badge>
        </div>
      </div>
      <CardContent className="p-[16px] flex-grow flex flex-col gap-2">
        <div className="flex justify-between items-start gap-2">
          <h4 className="font-bold text-[18px] line-clamp-1 flex-1 text-[#1A3A52]">
            {property.propertyType === 'Aluguel' ? '🏠 Locação' : '🏢 Venda'}
          </h4>
          <span className="font-bold text-[#4CAF50] whitespace-nowrap text-[16px]">
            {new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              maximumFractionDigits: 0,
            }).format(property.value)}
          </span>
        </div>

        <p className="text-[14px] text-[#333333] font-medium flex items-center gap-1.5 mt-1">
          <span>🏷️ Código:</span>
          <a
            href={publicUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'font-bold text-[#1A3A52] hover:underline',
              !publicUrl && 'pointer-events-none text-gray-400',
            )}
            onClick={(e) => {
              if (!publicUrl) e.preventDefault()
              e.stopPropagation()
            }}
          >
            {property.code || 'N/A'}
          </a>
        </p>

        <p className="text-[14px] text-[#333333] font-medium flex items-center gap-1.5 mt-1">
          <MapPin className="w-4 h-4 shrink-0 text-[#1A3A52]" />
          <span className="truncate">
            {property.bairro_tipo === 'outro' && <span className="mr-1">🔹</span>}
            {property.neighborhood}
          </span>
        </p>

        <div className="flex gap-3 text-[12px] text-[#333333] mt-1 font-medium">
          {property.bedrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bed className="w-4 h-4 text-[#1A3A52]" /> {property.bedrooms} dorms
            </span>
          )}
          {property.bathrooms !== undefined && (
            <span className="flex items-center gap-1">
              <Bath className="w-4 h-4 text-[#1A3A52]" /> {property.bathrooms} banhs
            </span>
          )}
          {property.parkingSpots !== undefined && (
            <span className="flex items-center gap-1">
              <Car className="w-4 h-4 text-[#1A3A52]" /> {property.parkingSpots} vagas
            </span>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-1.5 text-[12px] text-[#333333] bg-[#F5F5F5] p-3 rounded-[8px] border border-[#E5E5E5]">
          <p className="flex items-center gap-1.5 font-medium">
            <Calendar className="w-4 h-4 shrink-0 text-[#1A3A52]" />
            Captação: {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
          </p>
          <p className="flex items-center gap-1.5 font-medium">
            <UserCircle className="w-4 h-4 shrink-0 text-[#1A3A52]" />
            Captador:{' '}
            <span className="font-bold text-[#1A3A52]">{property.captador_name || 'N/A'}</span>
          </p>
        </div>

        {property.obs && (
          <p className="text-[12px] text-[#999999] mt-2 line-clamp-2 italic leading-tight">
            "{property.obs}"
          </p>
        )}
      </CardContent>

      <div className="p-[16px] pt-0 mt-auto flex flex-col gap-2">
        <div className="flex flex-row gap-[8px] w-full mb-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  'flex-1 font-bold min-h-[44px]',
                  publicUrl
                    ? 'bg-[#1A3A52] hover:bg-[#153045] text-white'
                    : 'bg-[#E5E5E5] text-[#999999] hover:bg-[#E5E5E5] cursor-not-allowed',
                )}
                onClick={(e) => {
                  e.stopPropagation()
                  if (publicUrl) window.open(publicUrl, '_blank')
                }}
              >
                🔗 Ver Imóvel
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                {publicUrl
                  ? 'Visualizar imóvel em www.eticimoveis.com.br'
                  : 'Código do imóvel não informado'}
              </p>
            </TooltipContent>
          </Tooltip>

          <Button
            variant="outline"
            className={cn(
              'w-[44px] h-[44px] p-0 shrink-0 border-[2px]',
              publicUrl
                ? 'border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5]'
                : 'border-[#E5E5E5] text-[#999999] hover:bg-transparent cursor-not-allowed',
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (publicUrl) handleCopyLink(e)
            }}
            title="Copiar Link"
          >
            📋
          </Button>
        </div>

        {onLink ? (
          <Button
            size="sm"
            className="w-full bg-[#1A3A52] hover:bg-[#2E5F8A] text-white shadow-[0_2px_4px_rgba(26,58,82,0.1)] font-bold min-h-[44px]"
            onClick={() => onLink(property)}
          >
            🔗 VINCULAR A UM CLIENTE
          </Button>
        ) : onClaim ? (
          <Button
            size="sm"
            className="w-full bg-[#1A3A52] hover:bg-[#2E5F8A] text-white shadow-sm font-semibold min-h-[44px]"
            onClick={() => onClaim(property)}
          >
            🔗 Vincular a um Cliente
          </Button>
        ) : null}

        {onIgnore && (
          <Button
            size="sm"
            variant="outline"
            className="w-full min-h-[44px] font-bold border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5]"
            onClick={() => onIgnore(property.code)}
          >
            ❌ Não me interessa
          </Button>
        )}
      </div>
    </Card>
  )
}
