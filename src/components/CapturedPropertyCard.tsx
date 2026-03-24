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

  const handleAction = (type: 'visita' | 'negocio' | 'details' | 'edit' | 'vincular') => {
    if (onAction) {
      onAction(type, demand, property)
    }
  }

  const handleWhatsApp = () => {
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
    ? 'text-[#1A3A52] cursor-pointer hover:underline transition-colors'
    : 'text-[#333333]'

  return (
    <Card className="w-full h-full min-h-[160px] rounded-[12px] border-[2px] border-[#2E5F8A] hover:shadow-[0_8px_16px_rgba(26,58,82,0.15)] flex flex-col bg-[#FFFFFF] transition-all duration-200 p-[16px]">
      <CardContent className="p-0 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-[12px] gap-[8px]">
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

        <div className="flex flex-col gap-[6px] flex-grow">
          <div className="text-[14px] leading-tight flex items-center gap-1">
            <span
              className={cn(interactiveClass, 'font-bold')}
              onClick={() => isCaptador && handleAction('edit')}
            >
              🏷️ Código:
            </span>
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
              {property.code || 'Não informado'}
            </a>
          </div>
          <p
            className={cn('text-[12px] leading-tight', interactiveClass)}
            onClick={() => isCaptador && handleAction('edit')}
          >
            📍 Localização: {property.neighborhood}
          </p>
          <p
            className={cn('text-[14px] font-bold mt-[2px]', interactiveClass)}
            onClick={() => isCaptador && handleAction('edit')}
          >
            💰 Valor: R$ {formatPrice(property.value)}
          </p>
          <p
            className={cn('text-[12px] mt-[2px]', interactiveClass)}
            onClick={() => isCaptador && handleAction('edit')}
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
            onClick={() => isCaptador && handleAction('edit')}
          >
            📝 Observações: <span className="italic">{property.obs || 'Nenhuma observação'}</span>
          </div>
        </div>

        <div className="flex flex-col gap-[8px] mt-[16px] w-full">
          <div className="flex flex-row gap-[8px] w-full">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  className={cn(
                    'flex-1 font-bold min-h-[44px]',
                    publicUrl
                      ? 'bg-[#1A3A52] enabled:hover:bg-[#153045] text-white'
                      : 'bg-[#E5E5E5] text-[#999999]',
                  )}
                  disabled={!publicUrl}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (publicUrl) window.open(publicUrl, '_blank')
                  }}
                >
                  <ExternalLink className="w-[16px] h-[16px]" />
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
                    'w-[44px] h-[44px] p-0 shrink-0 border-[2px]',
                    publicUrl
                      ? 'border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5]'
                      : 'border-[#E5E5E5] text-[#999999]',
                  )}
                  disabled={!publicUrl}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (publicUrl) handleCopyLink(e)
                  }}
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
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5] font-bold text-[12px] px-2"
                  onClick={() => handleAction('edit')}
                >
                  <Edit2 className="w-[14px] h-[14px]" />
                  Editar
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5] font-bold text-[12px] px-2"
                  onClick={() => handleAction('details')}
                >
                  <BookOpen className="w-[14px] h-[14px]" />
                  Ver Detalhes
                </Button>
                <Button
                  className="w-full min-h-[44px] bg-[#25D366] enabled:hover:bg-[#128C7E] text-white font-bold text-[12px] px-2 border border-transparent"
                  onClick={handleWhatsApp}
                >
                  <MessageCircle className="w-[14px] h-[14px]" />
                  Contatar Solicitante
                </Button>
              </>
            )}

            {isSDRCorretorAdmin && (
              <>
                <Button
                  className="flex-1 min-h-[44px] bg-[#10B981] enabled:hover:bg-[#059669] text-white font-bold text-[12px] px-2 border border-transparent shadow-sm"
                  onClick={() => handleAction('vincular')}
                >
                  <Link2 className="w-[14px] h-[14px]" />
                  <span className="hidden sm:inline">VINCULAR</span>
                  <span className="sm:hidden">Vincular</span>
                </Button>
                {!isClosed && !isVisita && (
                  <Button
                    className="flex-1 min-h-[44px] bg-[#FF9800] enabled:hover:bg-[#F57C00] text-white font-bold text-[12px] px-2 border border-transparent shadow-sm"
                    onClick={() => handleAction('visita')}
                  >
                    <Eye className="w-[14px] h-[14px]" />
                    <span className="hidden sm:inline">VISITA AGENDADA</span>
                    <span className="sm:hidden">Visita</span>
                  </Button>
                )}
                {isVisita && (
                  <Button
                    className="flex-1 min-h-[44px] bg-[#4CAF50] enabled:hover:bg-[#388E3C] text-white font-bold text-[12px] px-2 border border-transparent shadow-sm"
                    onClick={() => handleAction('negocio')}
                  >
                    <Handshake className="w-[14px] h-[14px]" />
                    <span className="hidden sm:inline">NEGÓCIO FECHADO</span>
                    <span className="sm:hidden">Fechado</span>
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="flex-1 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] enabled:hover:bg-[#F5F5F5] font-bold text-[12px] px-2"
                  onClick={() => handleAction('details')}
                >
                  <BookOpen className="w-[14px] h-[14px]" />
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
