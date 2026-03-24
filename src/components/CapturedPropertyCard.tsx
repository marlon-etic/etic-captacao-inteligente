import { Demand, CapturedProperty } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import {
  Eye,
  Handshake,
  BookOpen,
  Edit2,
  MessageCircle,
  ExternalLink,
  Share2,
  Link2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'

export function CapturedPropertyCard({
  demand,
  property,
  onAction,
}: {
  demand?: Demand
  property: CapturedProperty
  onAction?: (
    t: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details' | 'edit' | 'vincular',
    d: Demand | undefined,
    p: CapturedProperty,
  ) => void
}) {
  const { users, currentUser } = useAppStore()
  const { toast } = useToast()

  const capturer = users.find((u) => u.id === property.captador_id)
  const capturerName = capturer?.name || property.captador_name || 'Não informado'
  const solicitanteUser = users.find((u) => u.id === demand?.createdBy)
  const solicitanteName = solicitanteUser?.name || 'Não informado'

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const handleActionClick = (
    e: React.MouseEvent,
    type: 'visita' | 'negocio' | 'details' | 'edit' | 'vincular',
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`🔘 [Click] CapturedPropertyCard Action: ${type}`, { code: property.code })
    }
    if (onAction) {
      onAction(type, demand, property)
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`🔘 [Click] CapturedPropertyCard Action: whatsapp`, {
        phone: solicitanteUser?.phone,
      })
    }
    if (solicitanteUser?.phone) {
      const phone = solicitanteUser.phone.replace(/\D/g, '')
      const msg = encodeURIComponent(
        `Olá ${solicitanteUser.name}, sobre o imóvel ${property.code} para a demanda de ${demand?.clientName}...`,
      )
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    } else {
      toast({
        title: 'Telefone indisponível',
        description: 'O solicitante não possui número cadastrado.',
        variant: 'destructive',
      })
    }
  }

  const publicUrl = getPropertyPublicUrl(property.code)

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`🔘 [Click] CapturedPropertyCard Action: compartilhar`, { url: publicUrl })
    }
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
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

  const isClosed = !!property.fechamentoDate
  const isVisita = !!property.visitaDate && !isClosed

  const status = isClosed ? 'Fechado' : isVisita ? 'Visita' : 'Captado'
  const badgeClass = isClosed
    ? 'bg-[#4CAF50] text-white border-none'
    : isVisita
      ? 'bg-[#FF9800] text-white border-none'
      : 'bg-[#FF9800] text-white border-none'
  const badgeIcon = isClosed ? '🟢' : isVisita ? '🟠' : '🟡'

  const propType = property.propertyType || demand?.type || 'Venda'
  const isAluguel = propType === 'Aluguel'

  const isCaptador = currentUser?.role === 'captador'
  const isSDRCorretorAdmin =
    currentUser?.role === 'sdr' ||
    currentUser?.role === 'corretor' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor'

  const interactiveClass = isCaptador
    ? 'text-[#1A3A52] cursor-pointer hover:underline transition-colors relative z-10'
    : 'text-[#333333]'

  return (
    <Card className="w-full h-full min-h-[160px] rounded-[12px] border-[2px] border-[#2E5F8A] hover:shadow-[0_8px_16px_rgba(26,58,82,0.15)] flex flex-col bg-[#FFFFFF] transition-all duration-200 p-[16px]">
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-[12px] gap-[8px] z-0">
          <Badge className="font-bold text-[10px] text-white px-2 py-1 bg-[#1A3A52]">
            {isAluguel ? '🏠 ALUGUEL' : '🏢 VENDA'}
          </Badge>
          <div
            className={cn(
              'px-2 py-1 rounded-full font-bold text-[12px] flex items-center gap-1 shadow-sm',
              badgeClass,
            )}
          >
            <span>{badgeIcon}</span> {status}
          </div>
        </div>

        <div className="flex flex-col gap-[6px] flex-grow z-0 relative">
          <div className="text-[14px] leading-tight flex items-center gap-1">
            <span
              className={cn(interactiveClass, 'font-bold')}
              onClick={(e) => isCaptador && handleActionClick(e, 'edit')}
            >
              🏷️ Código:
            </span>
            <a
              href={publicUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'font-bold text-[#1A3A52] hover:underline relative z-10',
                !publicUrl && 'pointer-events-none text-gray-400',
              )}
              onClick={(e) => {
                e.stopPropagation()
                if (import.meta.env.DEV) {
                  console.log(`🔘 [Click] CapturedPropertyCard URL clicked`, { url: publicUrl })
                }
                if (!publicUrl) e.preventDefault()
              }}
            >
              {property.code || 'Não informado'}
            </a>
          </div>
          <p
            className={cn('text-[12px] leading-tight', interactiveClass)}
            onClick={(e) => isCaptador && handleActionClick(e, 'edit')}
          >
            📍 Localização: {property.neighborhood}
          </p>
          <p
            className={cn('text-[14px] font-bold mt-[2px]', interactiveClass)}
            onClick={(e) => isCaptador && handleActionClick(e, 'edit')}
          >
            💰 Valor: R$ {formatPrice(property.value)}
          </p>
          <p
            className={cn('text-[12px] mt-[2px]', interactiveClass)}
            onClick={(e) => isCaptador && handleActionClick(e, 'edit')}
          >
            🏠 Perfil: {property.bedrooms || 0} dorm, {property.bathrooms || 0} banh,{' '}
            {property.parkingSpots || 0} vagas
          </p>
          <p className="text-[12px] text-[#999999] mt-[2px]">
            👤 Solicitado por: <span className="text-[#333333] font-medium">{solicitanteName}</span>
          </p>
          <p className="text-[12px] text-[#999999]">
            📅 Data de Captação:{' '}
            <span className="text-[#333333] font-medium">
              {new Date(property.capturedAt || '').toLocaleDateString('pt-BR')}
            </span>
          </p>

          <div
            className={cn(
              'mt-[8px] pt-[8px] border-t border-[#E5E5E5] text-[12px]',
              isCaptador ? interactiveClass : 'text-[#333333]',
            )}
            onClick={(e) => isCaptador && handleActionClick(e, 'edit')}
          >
            📝 Observações: <span className="italic">{property.obs || 'Nenhuma observação'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-[8px] mt-[16px] w-full z-10 relative">
          <div className="flex flex-row gap-[8px] w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    'flex-1 font-bold min-h-[44px] relative z-10',
                    publicUrl
                      ? 'bg-[#1A3A52] enabled:hover:bg-[#153045] text-white'
                      : 'bg-[#E5E5E5] text-[#999999]',
                  )}
                  disabled={!publicUrl}
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (import.meta.env.DEV) {
                      console.log(`🔘 [Click] CapturedPropertyCard Action: ver no site`, {
                        url: publicUrl,
                      })
                    }
                    if (publicUrl) window.open(publicUrl, '_blank')
                  }}
                >
                  <ExternalLink className="w-[16px] h-[16px] mr-[6px]" />
                  Ver no site
                </Button>
              </TooltipTrigger>
              {!publicUrl && (
                <TooltipContent>
                  <p>Imóvel sem código cadastrado</p>
                </TooltipContent>
              )}
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-[44px] h-[44px] p-0 shrink-0 border-[2px] relative z-10',
                    publicUrl
                      ? 'border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5]'
                      : 'border-[#E5E5E5] text-[#999999]',
                  )}
                  disabled={!publicUrl}
                  onClick={handleCopyLink}
                  title="Compartilhar"
                >
                  <Share2 className="w-[16px] h-[16px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-row flex-wrap gap-[8px] w-full">
            {isCaptador && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5] font-bold text-[12px] px-2 relative z-10"
                  onClick={(e) => handleActionClick(e, 'edit')}
                >
                  <Edit2 className="w-[14px] h-[14px] mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5] font-bold text-[12px] px-2 relative z-10"
                  onClick={(e) => handleActionClick(e, 'details')}
                >
                  <BookOpen className="w-[14px] h-[14px] mr-1" />
                  Ver Detalhes
                </Button>
                <Button
                  className="w-full min-h-[44px] bg-[#25D366] enabled:hover:bg-[#128C7E] text-white font-bold text-[12px] px-2 border border-transparent relative z-10"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-[14px] h-[14px] mr-1" />
                  Contatar Solicitante
                </Button>
              </>
            )}

            {isSDRCorretorAdmin && (
              <>
                <Button
                  className="flex-1 min-h-[44px] bg-[#10B981] enabled:hover:bg-[#059669] text-white font-bold text-[12px] px-2 border border-transparent shadow-sm relative z-10"
                  onClick={(e) => handleActionClick(e, 'vincular')}
                >
                  <Link2 className="w-[14px] h-[14px] mr-1" />
                  <span className="hidden sm:inline">VINCULAR</span>
                  <span className="sm:hidden">Vincular</span>
                </Button>
                {!isClosed && !isVisita && (
                  <Button
                    className="flex-1 min-h-[44px] bg-[#FF9800] enabled:hover:bg-[#F57C00] text-white font-bold text-[12px] px-2 border border-transparent shadow-sm relative z-10"
                    onClick={(e) => handleActionClick(e, 'visita')}
                  >
                    <Eye className="w-[14px] h-[14px] mr-1" />
                    <span className="hidden sm:inline">VISITA AGENDADA</span>
                    <span className="sm:hidden">Visita</span>
                  </Button>
                )}
                {isVisita && (
                  <Button
                    className="flex-1 min-h-[44px] bg-[#4CAF50] enabled:hover:bg-[#388E3C] text-white font-bold text-[12px] px-2 border border-transparent shadow-sm relative z-10"
                    onClick={(e) => handleActionClick(e, 'negocio')}
                  >
                    <Handshake className="w-[14px] h-[14px] mr-1" />
                    <span className="hidden sm:inline">NEGÓCIO FECHADO</span>
                    <span className="sm:hidden">Fechado</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5] font-bold text-[12px] px-2 relative z-10"
                  onClick={(e) => handleActionClick(e, 'details')}
                >
                  <BookOpen className="w-[14px] h-[14px] mr-1" />
                  <span className="hidden sm:inline">Ver Detalhes</span>
                  <span className="sm:hidden">Detalhes</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
