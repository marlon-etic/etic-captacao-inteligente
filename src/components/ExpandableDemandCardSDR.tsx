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
  User as UserIcon,
  Edit,
  Check,
  X,
  AlertTriangle,
  Home,
  Building,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { supabase } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { useTimeElapsed } from '@/hooks/useTimeElapsed'
import { LostModal } from './LostModal'
import { EditDemandModal } from './EditDemandModal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function ExpandableDemandCardSDR({
  demand,
  onUpdate,
}: {
  demand: SupabaseDemand
  onUpdate?: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [wonOpen, setWonOpen] = useState(false)
  const [lostOpen, setLostOpen] = useState(false)

  const { text: elapsedText, hoursElapsed } = useTimeElapsed(demand.created_at)
  const daysElapsed = Math.floor(hoursElapsed / 24)

  let deadlineColor = 'text-[#666666]'
  let DeadlineIcon = Clock
  if (daysElapsed > 14) {
    deadlineColor = 'text-red-600 font-bold'
    DeadlineIcon = AlertTriangle
  } else if (daysElapsed > 7) {
    deadlineColor = 'text-orange-600 font-bold'
    DeadlineIcon = Clock
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aberta':
        return 'bg-blue-500 text-white'
      case 'atendida':
        return 'bg-emerald-600 text-white'
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
        return 'Ganho'
      case 'sem_resposta_24h':
        return 'Sem Resposta'
      case 'impossivel':
        return 'Perdido'
      default:
        return status
    }
  }

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'Alta':
        return <Clock className="w-3 h-3 text-red-500" />
      case 'Média':
        return <Clock className="w-3 h-3 text-yellow-500" />
      case 'Baixa':
        return <Clock className="w-3 h-3 text-gray-400" />
      default:
        return <Clock className="w-3 h-3 text-gray-400" />
    }
  }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const confirmWon = async () => {
    const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
    const { data, error } = await supabase
      .from(table)
      .update({ status_demanda: 'atendida' })
      .eq('id', demand.id)
      .select()
      .single()
    if (!error) {
      toast({
        title: 'Sucesso',
        description: 'Demanda marcada como Ganho!',
        className: 'bg-emerald-600 text-white border-emerald-600',
      })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', { detail: { tipo: demand.tipo, data } }),
      )
      if (onUpdate) onUpdate()
    } else {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
    setWonOpen(false)
  }

  const confirmLost = async (reason: string, obs: string) => {
    const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

    const currentObs = demand.observacoes || ''
    const newObs = currentObs
      ? `${currentObs}\n\n[PERDIDA] Motivo: ${reason} - ${obs}`
      : `[PERDIDA] Motivo: ${reason} - ${obs}`

    const payload: any = { status_demanda: 'impossivel' }
    if (demand.tipo === 'Aluguel') payload.observacoes = newObs
    else payload.necessidades_especificas = newObs

    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', demand.id)
      .select()
      .single()
    if (!error) {
      toast({ title: 'Sucesso', description: 'Demanda marcada como Perdida.' })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', { detail: { tipo: demand.tipo, data } }),
      )
      if (onUpdate) onUpdate()
    } else {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
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
      if (status === 'fechado') {
        const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
        await supabase.from(table).update({ status_demanda: 'atendida' }).eq('id', demand.id)
      }
      toast({
        title: 'Sucesso',
        description: message,
        className: status === 'fechado' ? 'bg-emerald-600 text-white border-emerald-600' : '',
      })
      window.dispatchEvent(
        new CustomEvent('imovel-action', {
          detail: { propId, status, demandId: demand.id, tipo: demand.tipo },
        }),
      )
      if (onUpdate) onUpdate()
    } else {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    }
  }

  const capturedCount = demand.imoveis_captados?.length || 0
  const isBrandNew = new Date().getTime() - new Date(demand.created_at).getTime() < 1000 * 60 * 5

  const statusBg =
    demand.status_demanda === 'atendida'
      ? 'bg-emerald-50/50 border-emerald-200'
      : demand.status_demanda === 'impossivel'
        ? 'bg-gray-50 border-gray-200 opacity-80 grayscale-[30%]'
        : 'bg-white'

  return (
    <>
      <Card
        className={cn(
          'w-full transition-all duration-200 shadow-sm border-[#E5E5E5] flex flex-col relative overflow-hidden',
          expanded ? 'shadow-md border-[#1A3A52]/30' : 'hover:shadow-md hover:border-[#1A3A52]/20',
          statusBg,
        )}
      >
        {demand.status_demanda === 'atendida' && (
          <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
        )}
        {demand.status_demanda === 'impossivel' && (
          <div className="absolute top-0 left-0 w-1 h-full bg-gray-400" />
        )}

        <div
          className="p-4 cursor-pointer flex flex-col gap-3"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-start justify-between w-full">
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border border-[#E5E5E5]',
                demand.tipo === 'Aluguel' ? 'bg-blue-50' : 'bg-amber-50',
              )}
            >
              {demand.tipo === 'Aluguel' ? (
                <Home className="w-5 h-5 text-blue-600" />
              ) : (
                <Building className="w-5 h-5 text-amber-600" />
              )}
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <Badge
                className={cn(
                  'border-none h-5 px-2 py-0 text-[10px] uppercase tracking-wider',
                  getStatusColor(demand.status_demanda),
                )}
              >
                {getStatusLabel(demand.status_demanda)}
              </Badge>
              {isBrandNew && (
                <Badge className="bg-pink-500 text-white uppercase px-2 py-0 border-none h-5 text-[10px] animate-pulse">
                  NOVA
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3
              className="text-[16px] font-bold text-[#1A3A52] leading-tight line-clamp-1"
              title={demand.nome_cliente}
            >
              {demand.nome_cliente}
            </h3>
            <div className="flex flex-col gap-1 text-[13px] text-[#666666] mt-1">
              <div className="flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate" title={demand.bairros?.join(', ')}>
                  {demand.bairros?.join(', ')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <DollarSign className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="font-medium">
                  {formatPrice(demand.valor_minimo)} - {formatPrice(demand.valor_maximo)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-1">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#333333] bg-[#F5F5F5] border border-[#E5E5E5] px-2 py-0.5 rounded-md h-6">
              {getUrgencyIcon(demand.nivel_urgencia)}{' '}
              <span className="uppercase">{demand.nivel_urgencia}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md h-6 bg-[#F5F5F5] border border-[#E5E5E5]">
              <DeadlineIcon className={cn('w-3 h-3', deadlineColor)} />
              <span className={deadlineColor}>{elapsedText}</span>
            </div>
          </div>

          <div
            className="flex items-center justify-between mt-2 pt-3 border-t border-[#E5E5E5]"
            onClick={(e) => e.stopPropagation()}
          >
            <Badge
              className={cn(
                'min-h-[28px] px-2.5 font-bold border-none transition-colors',
                capturedCount > 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-[#F5F5F5] text-[#999999]',
              )}
            >
              {capturedCount} captaç{capturedCount !== 1 ? 'ões' : 'ão'}
            </Badge>
            <div className="flex items-center gap-0.5">
              {demand.status_demanda === 'aberta' && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-[#1A3A52] hover:bg-[#F5F5F5] rounded-full"
                    onClick={() => setEditOpen(true)}
                    title="Editar Demanda"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-emerald-600 hover:bg-emerald-50 rounded-full"
                    onClick={() => setWonOpen(true)}
                    title="Marcar como Ganho"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-red-600 hover:bg-red-50 rounded-full"
                    onClick={() => setLostOpen(true)}
                    title="Marcar como Perdido"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-[#999999] hover:bg-[#F5F5F5] rounded-full ml-1"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="p-4 pt-0 border-t border-[#E5E5E5] bg-black/[0.02] rounded-b-[12px] animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-3 mt-4 mb-5">
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-[#E5E5E5] shadow-sm">
                <p className="text-[11px] font-bold text-[#999999] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5" /> Contato
                </p>
                <p className="text-[13px] text-[#333333]">
                  <strong>Tel:</strong> {demand.telefone || 'N/A'}
                </p>
                <p className="text-[13px] text-[#333333] truncate" title={demand.email}>
                  <strong>Email:</strong> {demand.email || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5 bg-white p-3 rounded-lg border border-[#E5E5E5] shadow-sm">
                <p className="text-[11px] font-bold text-[#999999] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" /> Requisitos
                </p>
                <p className="text-[13px] text-[#333333]">
                  <strong>Quartos:</strong> {demand.dormitorios || 'Indiferente'}
                </p>
                <p className="text-[13px] text-[#333333]">
                  <strong>Vagas:</strong> {demand.vagas_estacionamento || 'Indiferente'}
                </p>
                {demand.observacoes && (
                  <p className="text-[13px] text-[#333333] mt-2 whitespace-pre-wrap leading-snug p-2 bg-[#F9FAFB] rounded border border-[#E5E5E5]">
                    {demand.observacoes}
                  </p>
                )}
              </div>
            </div>

            <h4 className="text-[12px] font-bold text-[#1A3A52] mb-3 uppercase tracking-wider">
              Histórico de Captações
            </h4>
            {capturedCount === 0 ? (
              <div className="py-6 text-center text-[#999999] text-[13px] border border-dashed border-[#E5E5E5] rounded-lg bg-white">
                Nenhum imóvel captado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {demand.imoveis_captados.map((imovel) => (
                  <div
                    key={imovel.id}
                    className="bg-white p-3 rounded-lg border border-[#E5E5E5] shadow-sm flex flex-col gap-3 hover:border-[#1A3A52]/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-bold text-[#1A3A52] text-[14px] truncate">
                          {imovel.codigo_imovel || 'Sem código'}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] h-5 py-0 px-2 uppercase border-none font-bold shrink-0',
                            imovel.status_captacao === 'fechado'
                              ? 'bg-emerald-100 text-emerald-700'
                              : imovel.status_captacao === 'perdido'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-blue-100 text-blue-700',
                          )}
                        >
                          {imovel.status_captacao || 'Pendente'}
                        </Badge>
                      </div>
                      <div className="text-[12px] text-[#666666] flex flex-col gap-1.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />{' '}
                          <span className="truncate">{imovel.endereco || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 shrink-0" />{' '}
                          <span className="font-medium text-[#333333]">
                            {formatPrice(imovel.preco || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 truncate">
                          <UserIcon className="w-3.5 h-3.5 shrink-0" />{' '}
                          <span className="truncate text-[#333333]">{imovel.captador_nome}</span>
                        </div>
                      </div>
                    </div>
                    {imovel.status_captacao === 'pendente' &&
                      demand.status_demanda === 'aberta' && (
                        <div className="flex gap-2 pt-2 border-t border-[#E5E5E5]">
                          <Button
                            size="sm"
                            className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white flex-1 text-[12px] font-bold"
                            onClick={(e) =>
                              handleAction(e, imovel.id, 'fechado', 'Imóvel Validado')
                            }
                          >
                            Validar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-red-600 border-red-200 hover:bg-red-50 flex-1 text-[12px] font-bold"
                            onClick={(e) =>
                              handleAction(e, imovel.id, 'perdido', 'Imóvel Rejeitado')
                            }
                          >
                            Rejeitar
                          </Button>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>

      <EditDemandModal demand={demand} isOpen={editOpen} onClose={() => setEditOpen(false)} />

      <LostModal open={lostOpen} onOpenChange={setLostOpen} onConfirm={confirmLost} />

      <AlertDialog open={wonOpen} onOpenChange={setWonOpen}>
        <AlertDialogContent className="z-[1100]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#1A3A52]">Marcar como Ganho</AlertDialogTitle>
            <AlertDialogDescription className="text-[#666666]">
              Você conseguiu fechar negócio com <strong>{demand.nome_cliente}</strong>? Esta ação
              marcará a demanda como Atendida e a removerá do fluxo ativo de buscas dos captadores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold border-[#E5E5E5]">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmWon}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              Sim, fechei negócio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
