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
  property: CapturedProperty | any
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
    type: 'visita' | 'proposta' | 'negocio' | 'lost' | 'history' | 'details' | 'edit' | 'vincular',
  ) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`Botão [${type}] clicado em [CapturedPropertyCard]`, { code: property.code })
    }
    if (onAction) {
      onAction(type, demand, property)
    } else {
      if (import.meta.env.DEV) console.warn(`Clique bloqueado em [${type}]`)
      toast({
        title: 'Ação indisponível',
        description: 'Tente novamente.',
        variant: 'destructive',
      })
    }
  }

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (import.meta.env.DEV) {
      console.log(`Botão [whatsapp] clicado em [CapturedPropertyCard]`, {
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
      console.log(`Botão [compartilhar] clicado em [CapturedPropertyCard]`, { url: publicUrl })
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

  const isClosed = property.etapa_funil === 'fechado' || !!property.data_fechamento
  const isVisita = (property.etapa_funil === 'visitado' || !!property.data_visita) && !isClosed

  const status = isClosed ? 'Fechado' : isVisita ? 'Visita' : 'Captado'
  const captadoBadgeClass = isClosed
    ? 'bg-[#4CAF50] text-white'
    : isVisita
      ? 'bg-[#FF9800] text-white'
      : 'bg-[#3B82F6] text-white'
  const badgeIcon = isClosed ? '🟢' : isVisita ? '🟠' : '🔵'

  const propType = property.tipo || property.propertyType || demand?.type || 'Venda'
  const isAluguel = propType === 'Aluguel' || propType?.toLowerCase() === 'aluguel'

  const isCaptador = currentUser?.role === 'captador'
  const isSDRCorretorAdmin =
    currentUser?.role === 'sdr' ||
    currentUser?.role === 'corretor' ||
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor'

  const captureDateStr = property.capturedAt
    ? new Date(property.capturedAt).toLocaleDateString('pt-BR')
    : property.created_at
      ? new Date(property.created_at).toLocaleDateString('pt-BR')
      : (() => {
          if (import.meta.env.DEV) console.error(`Data ausente em card [${property.code}]`)
          return 'Data pendente'
        })()

  return (
    <Card className="w-full h-full min-h-[160px] rounded-[16px] border-[2px] border-[#2E5F8A] hover:shadow-[0_8px_24px_rgba(26,58,82,0.12)] flex flex-col bg-[#FFFFFF] transition-all duration-150 ease-in-out overflow-visible relative group">
      {/* Header: Data and Status */}
      <div className="px-4 pt-3 pb-3 border-b border-[#E5E5E5] bg-[#F8FAFC] shrink-0 relative z-10 pointer-events-none rounded-t-[14px]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 pointer-events-auto">
            <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">
              Captado em:
            </span>
            <span className="text-[13px] font-black text-[#1E293B] flex items-center gap-1.5 bg-white px-2 py-1 rounded-md border border-[#E2E8F0] shadow-sm">
              📅 {captureDateStr}
            </span>
          </div>
          <div
            className={cn(
              'px-2 py-1 rounded-[6px] font-bold text-[11px] flex items-center gap-1 shadow-sm border-none tracking-wide pointer-events-auto uppercase',
              captadoBadgeClass,
            )}
          >
            <span>{badgeIcon}</span> {status}
          </div>
        </div>

        {/* Banner */}
        <div className="flex items-center gap-2 pointer-events-auto flex-wrap">
          {(propType === 'Venda' || propType === 'Ambos') && (
            <Badge className="font-bold text-[10px] text-white bg-[#10B981] hover:bg-[#059669] px-2 py-0.5 shadow-sm tracking-widest">
              🏢 VENDA
            </Badge>
          )}
          {(propType === 'Aluguel' ||
            propType === 'Locação' ||
            propType === 'Ambos' ||
            isAluguel) && (
            <Badge className="font-bold text-[10px] text-white bg-[#3B82F6] hover:bg-[#2563EB] px-2 py-0.5 shadow-sm tracking-widest">
              🏠 ALUGUEL
            </Badge>
          )}
          {(property.tipo_imovel || property.propertyType) && (
            <Badge className="font-bold text-[10px] bg-[#E0E7FF] text-[#1E40AF] px-2 py-0.5 shadow-sm uppercase tracking-widest hover:bg-[#C7D2FE]">
              {property.tipo_imovel || property.propertyType}
            </Badge>
          )}
        </div>
      </div>

      {/* Content */}
      <CardContent className="p-4 flex flex-col flex-1 z-0 relative gap-[12px] pointer-events-none">
        <div className="text-[15px] leading-tight flex items-center gap-1 pointer-events-auto">
          <span className="font-bold text-[#333333]">🏷️ Código:</span>
          <a
            href={publicUrl || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'font-black text-[#1A3A52] hover:underline relative z-10 ml-1 text-[16px] truncate',
              !publicUrl && 'pointer-events-none text-[#999999]',
            )}
            onClick={(e) => {
              e.stopPropagation()
              if (import.meta.env.DEV) {
                console.log(`Botão [url] clicado em [CapturedPropertyCard]`, { url: publicUrl })
              }
              if (!publicUrl) e.preventDefault()
            }}
            title={property.code || 'Não informado'}
          >
            {property.code || 'Não informado'}
          </a>
        </div>
        <p className="text-[13px] leading-tight text-[#333333] font-medium mt-1">
          📍 Localização: {property.neighborhood}
        </p>
        <div className="flex flex-col gap-1 mt-2">
          {(propType === 'Venda' || propType === 'Ambos') && property.value > 0 && (
            <p className="text-[16px] font-black text-[#10B981] tracking-tight">
              💰 Venda: R$ {formatPrice(property.value)}
            </p>
          )}
          {(propType === 'Aluguel' ||
            propType === 'Locação' ||
            propType === 'Ambos' ||
            isAluguel) &&
            (property.rentValue > 0 || (property.value > 0 && property.value <= 100000)) && (
              <p className="text-[16px] font-black text-[#3B82F6] tracking-tight">
                💰 Aluguel: R$ {formatPrice(property.rentValue || property.value)}
              </p>
            )}
        </div>
        <p className="text-[13px] text-[#666666] font-medium bg-[#F5F5F5] p-2 rounded-[8px] border border-[#E5E5E5] mt-1">
          🏠 Perfil: {property.dormitorios ?? property.bedrooms ?? 0} dorm,{' '}
          {property.banheiros ?? property.bathrooms ?? 0} banh,{' '}
          {property.vagas ?? property.parkingSpots ?? 0} vagas
        </p>
        {demand && (
          <p className="text-[12px] text-[#666666] mt-1">
            👤 Solicitado por: <span className="text-[#333333] font-bold">{solicitanteName}</span>
          </p>
        )}
        <div className="mt-[8px] pt-[8px] border-t border-[#E5E5E5] text-[13px] text-[#666666] max-h-[80px] overflow-y-auto custom-scrollbar">
          📝 Observações:{' '}
          <span className="italic whitespace-pre-wrap">{property.obs || 'Nenhuma observação'}</span>
        </div>
      </CardContent>

      {/* Buttons Footer */}
      <div className="px-4 pt-4 pb-4 mt-auto border-t border-[#E5E5E5] bg-white flex flex-col lg:flex-row flex-wrap gap-2 z-10 relative pointer-events-auto rounded-b-[14px]">
        {isCaptador && (
          <>
            <Button
              variant="outline"
              className="flex-1 h-11 min-h-[44px] border-[#2E5F8A]/30 text-[#1A3A52] bg-white hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-[13px] px-2 relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto whitespace-nowrap"
              onClick={(e) => handleActionClick(e, 'edit')}
              aria-label={`Editar imóvel ${property.code}`}
            >
              <Edit2 className="w-[14px] h-[14px] mr-1.5 shrink-0" />
              <span className="truncate">Editar</span>
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-11 min-h-[44px] border-[#2E5F8A]/30 text-[#1A3A52] bg-white hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-[13px] px-2 relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto whitespace-nowrap"
              onClick={(e) => handleActionClick(e, 'details')}
              aria-label={`Ver detalhes do imóvel ${property.code}`}
            >
              <BookOpen className="w-[14px] h-[14px] mr-1.5 shrink-0" />
              <span className="truncate">Detalhes</span>
            </Button>
            {demand && (
              <Button
                className="flex-1 h-11 min-h-[44px] bg-[#25D366] hover:bg-[#128C7E] text-white font-bold text-[13px] px-2 border border-transparent relative z-10 transition-all duration-150 ease-in-out active:shadow-inner shadow-sm w-full lg:w-auto whitespace-nowrap"
                onClick={handleWhatsApp}
                aria-label="Contatar Solicitante via WhatsApp"
              >
                <MessageCircle className="w-[14px] h-[14px] mr-1.5" />
                Contatar
              </Button>
            )}
          </>
        )}

        {isSDRCorretorAdmin && (
          <>
            {!demand && (
              <Button
                className="flex-1 h-11 min-h-[44px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[13px] px-2 shadow-sm relative z-10 transition-all duration-150 ease-in-out active:shadow-inner border-none w-full lg:w-auto"
                onClick={(e) => handleActionClick(e, 'vincular')}
                aria-label={`Vincular imóvel ${property.code}`}
              >
                <Link2 className="w-[16px] h-[16px] mr-1.5 shrink-0" />
                <span className="truncate">VINCULAR</span>
              </Button>
            )}
            {demand && !isClosed && !isVisita && (
              <Button
                className="flex-1 h-11 min-h-[44px] bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold text-[13px] px-2 shadow-sm relative z-10 transition-all duration-150 ease-in-out active:shadow-inner border-none w-full lg:w-auto"
                onClick={(e) => handleActionClick(e, 'visita')}
                aria-label={`Agendar visita para imóvel ${property.code}`}
              >
                <Eye className="w-[16px] h-[16px] mr-1.5 shrink-0" />
                <span className="truncate">VISITA</span>
              </Button>
            )}
            {demand && isVisita && (
              <Button
                className="flex-1 h-11 min-h-[44px] bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold text-[13px] px-2 shadow-sm relative z-10 transition-all duration-150 ease-in-out active:shadow-inner border-none w-full lg:w-auto"
                onClick={(e) => handleActionClick(e, 'negocio')}
                aria-label={`Fechar negócio para imóvel ${property.code}`}
              >
                <Handshake className="w-[16px] h-[16px] mr-1.5 shrink-0" />
                <span className="truncate">NEGÓCIO</span>
              </Button>
            )}
            <Button
              variant="outline"
              className="flex-1 h-11 min-h-[44px] border-[#2E5F8A]/30 text-[#1A3A52] bg-white hover:bg-gray-100 dark:hover:bg-gray-800 font-bold text-[13px] px-2 relative z-10 transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto whitespace-nowrap"
              onClick={(e) => handleActionClick(e, 'details')}
              aria-label={`Ver detalhes do imóvel ${property.code}`}
            >
              <BookOpen className="w-[16px] h-[16px] mr-1.5 shrink-0" />
              <span className="truncate">Detalhes</span>
            </Button>{' '}
          </>
        )}

        <div className="flex gap-2 w-full lg:w-auto lg:flex-1 order-last lg:order-none">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                className={cn(
                  'flex-1 font-bold h-11 min-h-[44px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner shadow-sm',
                  publicUrl
                    ? 'bg-[#1A3A52] text-white hover:bg-[#153045]'
                    : 'bg-[#E5E5E5] text-[#999999]',
                )}
                disabled={!publicUrl}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  if (import.meta.env.DEV) {
                    console.log(`Botão [ver_no_site] clicado em [CapturedPropertyCard]`, {
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
                aria-label={`Ver imóvel ${property.code} no site`}
              >
                <ExternalLink className="w-[16px] h-[16px] mr-1.5" />
                <span className="truncate">Ver no site</span>
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
                  'w-[44px] h-11 min-h-[44px] p-0 shrink-0 border-[2px] relative z-10 transition-all duration-150 ease-in-out active:shadow-inner bg-white',
                  publicUrl
                    ? 'border-[#2E5F8A] text-[#1A3A52] hover:bg-gray-100 dark:hover:bg-gray-800'
                    : 'border-[#E5E5E5] text-[#999999]',
                )}
                disabled={!publicUrl}
                onClick={handleCopyLink}
                aria-label={`Compartilhar imóvel ${property.code}`}
              >
                <Share2 className="w-[16px] h-[16px]" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{publicUrl ? 'Compartilhar' : 'Imóvel sem código cadastrado'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </Card>
  )
}
