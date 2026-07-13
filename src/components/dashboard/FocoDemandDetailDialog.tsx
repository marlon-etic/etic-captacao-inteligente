import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  X,
  MapPin,
  DollarSign,
  BedDouble,
  Clock,
  Phone,
  Mail,
  Calendar,
  Building2,
  Car,
  MessageCircle,
  Copy,
  StickyNote,
} from 'lucide-react'

export interface FocoDemand {
  id: string
  nome_cliente: string | null
  bairros: string[] | null
  localizacoes: string[] | null
  valor_maximo: number | null
  orcamento_max: number | null
  dormitorios: number | null
  quartos: number | null
  nivel_urgencia: string | null
  status_demanda: string | null
  tipo_imovel: string | null
  created_at: string | null
  telefone: string | null
  email: string | null
  tipo: string | null
  observacoes?: string | null
  vagas?: number | null
}

interface Props {
  demand: FocoDemand | null
  isOpen: boolean
  onClose: () => void
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val || 0)

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

const formatPhoneForWhatsApp = (phone: string) => {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 0) return null
  const withCountryCode = digits.startsWith('55') ? digits : `55${digits}`
  return withCountryCode
}

export function FocoDemandDetailDialog({ demand, isOpen, onClose }: Props) {
  if (!demand) return null

  const whatsappNumber = demand.telefone ? formatPhoneForWhatsApp(demand.telefone) : null
  const whatsappMessage = demand.telefone
    ? `Olá ${demand.nome_cliente || ''}, encontrei seu imóvel na região ${(demand.bairros || demand.localizacoes || []).join(', ')}!`
    : ''

  const handleCopyContact = () => {
    const contact = [demand.nome_cliente, demand.telefone, demand.email].filter(Boolean).join(' | ')
    navigator.clipboard.writeText(contact)
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 bg-[#1A3A52] text-white relative">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {demand.nome_cliente || 'Cliente não identificado'}
          </DialogTitle>
          <DialogClose asChild>
            <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
              <X className="w-5 h-5" />
            </button>
          </DialogClose>
        </DialogHeader>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Tipo</p>
              <Badge className={demand.tipo === 'Venda' ? 'bg-[#FF9800]' : 'bg-[#1A3A52]'}>
                {demand.tipo || '—'}
              </Badge>
            </div>
            <div className="bg-[#F5F5F5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1">Status</p>
              <p className="text-sm font-bold text-[#1A3A52]">
                {demand.status_demanda || 'aberta'}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-[#2E5F8A] shrink-0" />
              <span className="font-bold text-[#1A3A52]">Localização:</span>
              <span className="text-[#666666]">
                {(demand.bairros || demand.localizacoes || ['Não informada']).join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-bold text-[#1A3A52]">Orçamento:</span>
              <span className="text-emerald-600 font-bold">
                {formatCurrency(demand.valor_maximo || demand.orcamento_max || 0)}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BedDouble className="w-4 h-4 text-[#2E5F8A] shrink-0" />
              <span className="font-bold text-[#1A3A52]">Dormitórios:</span>
              <span className="text-[#666666]">{demand.dormitorios || demand.quartos || 0}</span>
            </div>
            {demand.vagas !== undefined && demand.vagas !== null && demand.vagas > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <Car className="w-4 h-4 text-[#2E5F8A] shrink-0" />
                <span className="font-bold text-[#1A3A52]">Vagas:</span>
                <span className="text-[#666666]">{demand.vagas}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="w-4 h-4 text-[#2E5F8A] shrink-0" />
              <span className="font-bold text-[#1A3A52]">Tipo do Imóvel:</span>
              <span className="text-[#666666]">{demand.tipo_imovel || 'Indiferente'}</span>
            </div>
            {demand.nivel_urgencia && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="w-4 h-4 text-[#FF9800] shrink-0" />
                <span className="font-bold text-[#1A3A52]">Urgência:</span>
                <span className="text-[#666666]">{demand.nivel_urgencia}</span>
              </div>
            )}
            {demand.telefone && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-[#2E5F8A] shrink-0" />
                <span className="font-bold text-[#1A3A52]">Telefone:</span>
                <span className="text-[#666666]">{demand.telefone}</span>
              </div>
            )}
            {demand.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-[#2E5F8A] shrink-0" />
                <span className="font-bold text-[#1A3A52]">Email:</span>
                <span className="text-[#666666]">{demand.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#999999] shrink-0" />
              <span className="font-bold text-[#1A3A52]">Criada em:</span>
              <span className="text-[#666666]">{formatDate(demand.created_at || '')}</span>
            </div>
          </div>

          {demand.observacoes && (
            <div className="bg-[#F8FAFC] border border-[#E5E5E5] rounded-lg p-3">
              <p className="text-xs text-[#999999] font-bold uppercase mb-1 flex items-center gap-1">
                <StickyNote className="w-3 h-3" />
                Observações
              </p>
              <p className="text-sm text-[#666666]">{demand.observacoes}</p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            {whatsappNumber && (
              <a
                href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Button>
              </a>
            )}
            <Button
              variant="outline"
              className="flex-1 gap-2 border-[#E5E5E5] hover:bg-[#F5F5F5]"
              onClick={handleCopyContact}
            >
              <Copy className="w-4 h-4" />
              Copiar Contato
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
