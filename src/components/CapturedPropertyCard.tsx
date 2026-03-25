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
    } else {
      toast({
        title: 'Ação indisponível',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
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
        description: 'Link copiado para clipboard!',
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

  const isClosed = !!property.fechamentoDate
  const isVisita = !!property.visitaDate && !isClosed

  const status = isClosed ? 'Fechado' : isVisita ? 'Visita' : 'Captado'
  const captadoBadgeClass = isClosed
    ? 'bg-[#4CAF50] text-white'
    : isVisita
      ? 'bg-[#FF9800] text-white'
      : 'bg-[#3B82F6] text-white'
  const badgeIcon = isClosed ? '🟢' : isVisita ? '🟠' : '🔵'

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

  const captureDateStr = property.capturedAt
    ? new Date(property.capturedAt).toLocaleDateString('pt-BR')
    : 'Data não disponível'

  return (
    <Card className="w-full h-full min-h-[160px] rounded-[12px] border-[2px] border-[#2E5F8A] hover:shadow-[0_8px_16px_rgba(26,58,82,0.15)] flex flex-col bg-[#FFFFFF] transition-all duration-150 ease-in-out overflow-visible relative mt-2">
      <CardContent className="p-4 pt-4 flex flex-col flex-1 z-0 relative">
        {/* Header: Data and Status */}
        <div className="flex justify-between items-center mb-3 relative z-0">
          <span className="text-[12px] text-[#4B5563] font-sans font-medium">
            {captureDateStr}
          </span>
          <div
            className={cn(
              'px-2 py-1 rounded-full font-bold text-[12px] flex items-center gap-1 shadow-sm border-none',
              captadoBadgeClass,
            )}
          >
            <span>{badgeIcon}</span> {status}
          </div>
        </div>

        {/* Banner */}
        <div className="flex items-center gap-2 mb-3 relative z-0">
          <Badge className="font-bold text-[10px] text-white px-2 py-1 bg-[#1A3A52]">
            {isAluguel ? '🏠 ALUGUEL' : '🏢 VENDA'}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-[6px] flex-grow relative z-0">
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

        {/* Buttons Footer */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-[#E5E5E5] w-full z-10 relative">
          <div className="flex flex-row gap-2 w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    'flex-1 font-bold min-h-[44px] relative z-10 transition-all duration-150 active:shadow-inner hover:bg-opacity-90',
                    publicUrl
                      ? 'bg-[#1A3A52] text-white hover:bg-[#153045]'
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
                    if (publicUrl) {
                      window.open(publicUrl, '_blank')
                    } else {
                      toast({
                        title: 'Erro',
                        description: 'Ação indisponível. URL não encontrada.',
                        variant: 'destructive',
                      })
                    }
                  }}
                  aria-label="Ver no site"
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
                    'w-[44px] h-[44px] p-0 shrink-0 border-[2px] relative z-10 transition-all duration-150 active:shadow-inner',
                    publicUrl
                      ? 'border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5]'
                      : 'border-[#E5E5E5] text-[#999999]',
                  )}
                  disabled={!publicUrl}
                  onClick={handleCopyLink}
                  aria-label="Compartilhar"
                >
                  <Share2 className="w-[16px] h-[16px]" />
                </Button>
              </TooltipTrigger>
              <TooltipContent zIndex={1100}>
                <p>{publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="flex flex-col lg:flex-row flex-wrap gap-2 w-full">
            {isCaptador && (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5] font-bold text-[12px] px-2 relative z-10 transition-all duration-150 active:shadow-inner"
                  onClick={(e) => handleActionClick(e, 'edit')}
                  aria-label="Editar"
                >
                  <Edit2 className="w-[14px] h-[14px] mr-1" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5] font-bold text-[12px] px-2 relative z-10 transition-all duration-150 active:shadow-inner"
                  onClick={(e) => handleActionClick(e, 'details')}
                  aria-label="Ver Detalhes"
                >
                  <BookOpen className="w-[14px] h-[14px] mr-1" />
                  Ver Detalhes
                </Button>
                <Button
                  className="w-full lg:w-auto flex-1 min-h-[44px] bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-[12px] px-2 border border-transparent relative z-10 transition-all duration-150 active:shadow-inner"
                  onClick={handleWhatsApp}
                  aria-label="Contatar Solicitante"
                >
                  <MessageCircle className="w-[14px] h-[14px] mr-1" />
                  Contatar
                </Button>
              </div>
            )}

            {isSDRCorretorAdmin && (
              <div className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  className="flex-1 min-h-[44px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[12px] px-2 shadow-sm relative z-10 transition-all duration-150 active:shadow-inner border-none"
                  onClick={(e) => handleActionClick(e, 'vincular')}
                  aria-label="Vincular"
                >
                  <Link2 className="w-[14px] h-[14px] mr-1 shrink-0" />
                  <span className="truncate">VINCULAR</span>
                </Button>

                {!isClosed && !isVisita && (
                  <Button
                    className="flex-1 min-h-[44px] bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold text-[12px] px-2 shadow-sm relative z-10 transition-all duration-150 active:shadow-inner border-none"
                    onClick={(e) => handleActionClick(e, 'visita')}
                    aria-label="Visita Agendada"
                  >
                    <Eye className="w-[14px] h-[14px] mr-1 shrink-0" />
                    <span className="truncate">VISITA AGENDADA</span>
                  </Button>
                )}
                {isVisita && (
                  <Button
                    className="flex-1 min-h-[44px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[12px] px-2 shadow-sm relative z-10 transition-all duration-150 active:shadow-inner border-none"
                    onClick={(e) => handleActionClick(e, 'negocio')}
                    aria-label="Negócio Fechado"
                  >
                    <Handshake className="w-[14px] h-[14px] mr-1 shrink-0" />
                    <span className="truncate">NEGÓCIO FECHADO</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5] font-bold text-[12px] px-2 relative z-10 transition-all duration-150 active:shadow-inner"
                  onClick={(e) => handleActionClick(e, 'details')}
                  aria-label="Ver Detalhes"
                >
                  <BookOpen className="w-[14px] h-[14px] mr-1 shrink-0" />
                  <span className="truncate">Ver Detalhes</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
