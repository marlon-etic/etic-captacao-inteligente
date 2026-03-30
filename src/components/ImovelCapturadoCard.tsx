import { Badge } from '@/components/ui/badge'
import { Demand } from '@/types'
import { MapPin, UserIcon, ExternalLink } from 'lucide-react'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import { cn } from '@/lib/utils'

export function ImovelCapturadoCard({
  property,
  demand,
  isOwnerOrAdmin,
}: {
  property: any
  demand: Demand
  isOwnerOrAdmin: boolean
}) {
  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const isClosed = property.etapa_funil === 'fechado' || !!property.data_fechamento
  const isVisita = (property.etapa_funil === 'visitado' || !!property.data_visita) && !isClosed
  const isPendente = property.status_captacao === 'pendente'

  const getStatusBadge = () => {
    if (isClosed) return <Badge className="bg-[#4CAF50] text-white">🟢 Fechado</Badge>
    if (isVisita) return <Badge className="bg-[#FF9800] text-white">🟠 Em Visita</Badge>
    if (isPendente) return <Badge className="bg-[#6B7280] text-white">⚪ Pendente</Badge>
    return <Badge className="bg-[#3B82F6] text-white">🔵 Captado</Badge>
  }

  const propType = property.tipo || property.propertyType || demand?.type || 'Venda'
  const isAluguel = propType === 'Aluguel' || propType?.toLowerCase() === 'aluguel'

  const publicUrl = property.codigo_imovel ? getPropertyPublicUrl(property.codigo_imovel) : null

  return (
    <div className="bg-white p-3 md:p-4 rounded-[10px] border border-[#E5E5E5] shadow-sm flex flex-col sm:flex-row gap-3 items-start sm:items-center hover:border-[#1A3A52]/30 transition-colors">
      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-black text-[#1A3A52] text-[15px] truncate">
            {property.codigo_imovel || 'Sem código'}
          </span>
          <Badge
            className={cn(
              'font-bold text-[10px] text-white px-2 py-0.5 shadow-sm uppercase tracking-widest',
              isAluguel ? 'bg-[#3B82F6] hover:bg-[#2563EB]' : 'bg-[#EF4444] hover:bg-[#DC2626]',
            )}
          >
            {isAluguel ? 'ALUGUEL' : 'VENDA'}
          </Badge>
          {getStatusBadge()}
          {publicUrl && (
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#3B82F6] hover:underline flex items-center gap-1 text-[11px] font-bold bg-[#E8F0F8] px-2 py-0.5 rounded-sm ml-auto sm:ml-0"
            >
              <ExternalLink className="w-3 h-3" /> Ver no site
            </a>
          )}
        </div>

        <div className="flex flex-col gap-1 text-[13px] text-[#666666] font-medium">
          <div className="flex items-start gap-1.5">
            <MapPin className="w-4 h-4 shrink-0 text-[#999999] mt-0.5" />
            <span className="line-clamp-2">
              {property.endereco || property.neighborhood || 'Endereço não informado'}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[#10B981] font-bold text-[14px]">
            💰 R$ {formatPrice(property.preco || property.value || 0)}
          </div>
          <div className="flex items-center gap-1.5 mt-1 bg-[#F5F5F5] px-2 py-1 rounded-md max-w-fit">
            <UserIcon className="w-3.5 h-3.5 shrink-0 text-[#1A3A52]" />
            <span className="truncate text-[#333333] font-bold">
              {property.captador_nome || 'Captador Desconhecido'}
            </span>
          </div>

          {(property.observacoes || property.obs) && (
            <div className="mt-2 text-[12px] italic border-t border-[#F5F5F5] pt-2 text-[#999999] line-clamp-3 whitespace-pre-wrap">
              "{property.observacoes || property.obs}"
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
