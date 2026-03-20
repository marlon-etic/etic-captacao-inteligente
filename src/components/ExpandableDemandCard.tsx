import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Clock,
  ChevronDown,
  ChevronUp,
  MapPin,
  DollarSign,
  Calendar,
  User as UserIcon,
  CheckCircle2,
  XCircle,
  MessageCircle,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

export function ExpandableDemandCard({
  demand,
  onUpdate,
}: {
  demand: SupabaseDemand
  onUpdate?: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta':
        return 'bg-emerald-500 text-white'
      case 'atendida':
        return 'bg-blue-500 text-white'
      case 'sem_resposta_24h':
        return 'bg-yellow-500 text-white'
      case 'impossivel':
        return 'bg-gray-500 text-white'
      default:
        return 'bg-gray-500 text-white'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'aberta':
        return 'Aberta'
      case 'atendida':
        return 'Atendida'
      case 'sem_resposta_24h':
        return 'Sem Resposta'
      case 'impossivel':
        return 'Impossível'
      default:
        return status
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'Alta':
        return <Clock className="w-4 h-4 text-red-500" />
      case 'Média':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'Baixa':
        return <Clock className="w-4 h-4 text-gray-400" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const handleAction = async (
    e: React.MouseEvent,
    propId: string,
    status: string,
    message: string,
  ) => {
    e.stopPropagation()
    const { error } = await supabase
      .from('imoveis_captados')
      .update({ status_captacao: status })
      .eq('id', propId)
    if (!error) {
      toast({
        title: 'Sucesso',
        description: message,
        className: status === 'fechado' ? 'bg-emerald-600 text-white' : '',
      })
      window.dispatchEvent(new Event('demanda-updated'))
      if (onUpdate) onUpdate()
    } else {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const handleContact = (e: React.MouseEvent) => {
    e.stopPropagation()
    window.open(`https://wa.me/?text=Olá, sobre o imóvel da demanda...`, '_blank')
  }

  const capturedCount = demand.imoveis_captados?.length || 0
  const isBrandNew = new Date().getTime() - new Date(demand.created_at).getTime() < 1000 * 60 * 5 // 5 minutes

  return (
    <Card
      className={cn(
        'w-full transition-all duration-200 shadow-sm border-[#E5E5E5]',
        expanded ? 'shadow-md border-[#1A3A52]/30' : 'hover:shadow-md',
      )}
    >
      <div
        className="p-4 cursor-pointer flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex flex-col gap-2 flex-1 w-full">
          <div className="flex items-center gap-2 flex-wrap">
            {isBrandNew && (
              <Badge className="bg-pink-500 hover:bg-pink-600 text-white animate-pulse shadow-sm border-none uppercase tracking-wide px-2">
                NOVA
              </Badge>
            )}
            <Badge className={cn('border-none', getStatusColor(demand.status_demanda))}>
              {getStatusLabel(demand.status_demanda)}
            </Badge>
            <div className="flex items-center gap-1 text-[13px] font-bold text-[#333333] bg-[#F5F5F5] px-2 py-1 rounded-md">
              {getUrgencyIcon(demand.nivel_urgencia)} {demand.nivel_urgencia}
            </div>
            <span className="text-[12px] text-[#999999] ml-auto sm:ml-0 flex items-center gap-1">
              <Calendar className="w-3 h-3" />{' '}
              {new Date(demand.created_at).toLocaleDateString('pt-BR')}
            </span>
          </div>
          <h3 className="text-[18px] font-bold text-[#1A3A52] leading-tight">
            {demand.nome_cliente}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[13px] text-[#666666] mt-1">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-4 h-4 shrink-0 opacity-70" />
              <span className="truncate">{demand.bairros.join(', ')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 shrink-0 opacity-70" />
              <span>
                {formatPrice(demand.valor_minimo)} - {formatPrice(demand.valor_maximo)}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-3 shrink-0 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-[#E5E5E5]">
          <Badge
            className={cn(
              'min-h-[32px] px-3 font-bold border-none transition-colors',
              capturedCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-[#F5F5F5] text-[#999999]',
            )}
          >
            {capturedCount} imóvel{capturedCount !== 1 && 'eis'} captado{capturedCount !== 1 && 's'}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-[#1A3A52] font-bold hover:bg-[#F5F5F5]"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" /> Ocultar
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-1" /> Ver Propriedades
              </>
            )}
          </Button>
        </div>
      </div>
      {expanded && (
        <div className="p-4 pt-0 border-t border-[#E5E5E5] bg-[#FAFAFA] rounded-b-[12px]">
          {capturedCount === 0 ? (
            <div className="py-8 text-center text-[#999999] text-[14px]">
              Nenhum imóvel captado para esta demanda ainda.
            </div>
          ) : (
            <div className="flex flex-col gap-3 mt-4">
              {demand.imoveis_captados.map((imovel) => (
                <div
                  key={imovel.id}
                  className="bg-white p-3 rounded-lg border border-[#E5E5E5] shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center animate-in fade-in slide-in-from-top-2"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-[#1A3A52]">
                        {imovel.codigo_imovel || 'Sem código'}
                      </span>
                      <Badge variant="outline" className="text-[10px] h-5 py-0">
                        {imovel.status_captacao || 'Pendente'}
                      </Badge>
                    </div>
                    <div className="text-[13px] text-[#666666] flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5" />{' '}
                        {imovel.endereco || 'Endereço não informado'}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" /> {formatPrice(imovel.preco || 0)}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" /> Captador: {imovel.captador_nome}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row flex-wrap gap-2 w-full lg:w-auto lg:shrink-0 mt-2 lg:mt-0">
                    <Button
                      onClick={(e) => handleAction(e, imovel.id, 'fechado', 'Imóvel validado')}
                      size="sm"
                      className="flex-1 lg:flex-none bg-emerald-600 hover:bg-emerald-700 text-white h-9"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1.5" /> Validar
                    </Button>
                    <Button
                      onClick={(e) => handleAction(e, imovel.id, 'perdido', 'Imóvel rejeitado')}
                      variant="outline"
                      size="sm"
                      className="flex-1 lg:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 h-9 border-red-200"
                    >
                      <XCircle className="w-4 h-4 mr-1.5" /> Rejeitar
                    </Button>
                    <Button
                      onClick={(e) => handleContact(e)}
                      variant="secondary"
                      size="sm"
                      className="flex-1 lg:flex-none h-9"
                    >
                      <MessageCircle className="w-4 h-4 mr-1.5" /> Contato
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
