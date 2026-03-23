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
  CheckCircle,
  XCircle,
  AlertTriangle,
  Home,
  Star,
  BedDouble,
  Car,
  Tag,
  Lock,
  Info,
  CheckCircle2,
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

  const statusConfig =
    demand.status_demanda === 'aberta'
      ? { label: 'DISPONÍVEL PARA TODOS', bg: 'bg-[#10B981]', text: 'text-white', icon: Lock }
      : demand.status_demanda === 'atendida'
        ? {
            label: 'ATENDIDA / EM NEGOCIAÇÃO',
            bg: 'bg-blue-500',
            text: 'text-white',
            icon: CheckCircle2,
          }
        : demand.status_demanda === 'sem_resposta_24h'
          ? { label: 'SEM RESPOSTA', bg: 'bg-yellow-500', text: 'text-white', icon: AlertTriangle }
          : { label: 'PERDIDA / CANCELADA', bg: 'bg-gray-500', text: 'text-white', icon: XCircle }

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const togglePriority = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const table = demand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
    const newStatus = !demand.is_prioritaria
    const optimisticData = { ...demand, is_prioritaria: newStatus }
    window.dispatchEvent(
      new CustomEvent('demanda-updated', { detail: { tipo: demand.tipo, data: optimisticData } }),
    )

    const { error } = await supabase
      .from(table)
      .update({ is_prioritaria: newStatus })
      .eq('id', demand.id)
    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível alterar a prioridade',
        variant: 'destructive',
      })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', { detail: { tipo: demand.tipo, data: demand } }),
      )
    } else {
      toast({
        title: newStatus ? 'Priorizada' : 'Prioridade Removida',
        description: newStatus ? 'Demanda destacada.' : 'Destaque removido.',
        className: 'bg-[#10B981] text-white',
      })
    }
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
        className: 'bg-[#10B981] text-white',
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
    const newObs = demand.observacoes
      ? `${demand.observacoes}\n\n[PERDIDA] Motivo: ${reason} - ${obs}`
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
        className: status === 'fechado' ? 'bg-[#10B981] text-white' : '',
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

  return (
    <>
      <Card className="w-full relative overflow-hidden rounded-[16px] border border-[#E5E5E5] shadow-sm hover:shadow-md transition-all duration-200 bg-gradient-to-b from-[#F2FBF5] to-white flex flex-col h-full">
        {demand.is_prioritaria && (
          <div className="absolute top-11 right-3 z-10 bg-[#FCD34D] text-[#854D0E] text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-[#F59E0B]">
            <Star className="w-3 h-3 fill-current" /> PRIORITÁRIA
          </div>
        )}

        <div
          className={cn(
            'px-4 py-2.5 flex items-center gap-2 font-black text-[11px] uppercase tracking-widest shadow-sm',
            statusConfig.bg,
            statusConfig.text,
          )}
        >
          <statusConfig.icon className="w-3.5 h-3.5" />
          {statusConfig.label}
          {isBrandNew && (
            <span className="ml-auto bg-white/20 px-2 rounded-sm text-[9px] animate-pulse">
              NOVA
            </span>
          )}
        </div>

        <div className="p-4 flex flex-col gap-3 flex-1">
          <h3
            className="text-[18px] font-black text-[#1A3A52] leading-tight pr-24 line-clamp-1"
            title={demand.nome_cliente}
          >
            {demand.nome_cliente}
          </h3>

          <div className="flex flex-col gap-1.5 mt-1">
            <div className="flex items-center gap-2 text-[14px] text-[#333333]">
              <MapPin className="w-4 h-4 text-pink-500 shrink-0" />
              <span className="font-medium line-clamp-1" title={demand.bairros?.join(', ')}>
                {demand.bairros?.join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[14px] text-[#333333]">
              <Home className="w-4 h-4 text-[#1A3A52] shrink-0" />
              <span className="font-medium">
                {demand.tipo_imovel || 'Imóvel para ' + demand.tipo}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <DollarSign className="w-5 h-5 text-[#10B981] shrink-0" />
            <span className="text-[20px] font-black text-[#10B981] tracking-tight">
              {formatPrice(demand.valor_minimo)} - {formatPrice(demand.valor_maximo)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-[13px] text-[#666666] font-medium bg-white p-2.5 rounded-lg mt-1 border border-[#E5E5E5] flex-wrap shadow-sm">
            <div className="flex items-center gap-1.5">
              <BedDouble className="w-4 h-4 text-[#999999]" /> {demand.dormitorios || 'Indif.'} dorm
            </div>
            <div className="flex items-center gap-1.5">
              <Car className="w-4 h-4 text-[#999999]" /> {demand.vagas_estacionamento || 'Indif.'}{' '}
              vagas
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[#999999]" /> {demand.tipo}
            </div>
          </div>

          <div className="flex items-start gap-2.5 bg-[#E8F5E9] text-[#065F46] p-3 rounded-lg text-[13px] mt-1 border border-[#A7F3D0] shadow-sm">
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-[#10B981]" />
            <p className="leading-snug font-medium line-clamp-3">
              {demand.observacoes ||
                'Nenhum cliente específico — qualquer imóvel que se encaixe serve!'}
            </p>
          </div>

          <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#E5E5E5] flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded-md h-6 bg-white border border-[#E5E5E5] shadow-sm">
                <DeadlineIcon className={cn('w-3.5 h-3.5', deadlineColor)} />
                <span className={deadlineColor}>{elapsedText}</span>
              </div>
            </div>
            <Badge
              className={cn(
                'border-none px-3 h-6 flex items-center justify-center font-bold text-[11px] shadow-sm',
                capturedCount > 0
                  ? 'bg-[#10B981] text-white'
                  : 'bg-white text-[#999999] border border-[#E5E5E5]',
              )}
            >
              {capturedCount} imóveis captados
            </Badge>
          </div>

          <div className="flex flex-col gap-2 mt-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  'w-full min-h-[40px] shadow-sm transition-all font-bold text-[11px] lg:text-[12px] px-1 lg:px-2',
                  demand.is_prioritaria
                    ? 'bg-[#FFFBEB] border-[#FCD34D] text-[#854D0E] hover:bg-[#FEF3C7]'
                    : 'bg-white border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5]',
                )}
                onClick={togglePriority}
              >
                <Star
                  className={cn(
                    'w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 lg:mr-1.5 shrink-0',
                    demand.is_prioritaria ? 'fill-[#FCD34D] text-[#FCD34D]' : 'text-[#999999]',
                  )}
                />
                <span className="truncate">
                  {demand.is_prioritaria ? 'Prioritária' : 'Priorizar'}
                </span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full min-h-[40px] border-[#E5E5E5] bg-white hover:bg-[#F5F5F5] text-[#333333] shadow-sm font-bold text-[11px] lg:text-[12px] px-1 lg:px-2"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditOpen(true)
                }}
              >
                <Edit className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 lg:mr-1.5 text-[#1A3A52] shrink-0" />{' '}
                <span className="truncate">Editar</span>
              </Button>
            </div>

            {demand.status_demanda === 'aberta' && (
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[40px] bg-[#E8F5E9] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5] shadow-sm font-bold text-[11px] lg:text-[12px] px-1 lg:px-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setWonOpen(true)
                  }}
                >
                  <CheckCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 lg:mr-1.5 shrink-0" />{' '}
                  <span className="truncate">Marcar Ganho</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full min-h-[40px] bg-[#FEF2F2] text-[#EF4444] border-[#FECACA] hover:bg-[#FEE2E2] shadow-sm font-bold text-[11px] lg:text-[12px] px-1 lg:px-2"
                  onClick={(e) => {
                    e.stopPropagation()
                    setLostOpen(true)
                  }}
                >
                  <XCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4 mr-1 lg:mr-1.5 shrink-0" />{' '}
                  <span className="truncate">Marcar Perdido</span>
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="ghost"
            className="w-full text-[12px] text-[#666666] font-bold mt-1 h-10 bg-[#F5F5F5] hover:bg-[#E5E5E5] rounded-[8px]"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Ocultar Histórico de Captações' : 'Ver Histórico de Captações'}{' '}
            {expanded ? (
              <ChevronUp className="w-4 h-4 ml-1.5" />
            ) : (
              <ChevronDown className="w-4 h-4 ml-1.5" />
            )}
          </Button>
        </div>

        {expanded && (
          <div className="bg-[#FAFAFA] p-4 border-t border-[#E5E5E5] rounded-b-[16px] animate-in fade-in slide-in-from-top-2">
            {capturedCount === 0 ? (
              <div className="py-6 text-center text-[#999999] text-[13px] border border-dashed border-[#E5E5E5] rounded-lg bg-white">
                Nenhum imóvel captado ainda.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {demand.imoveis_captados.map((imovel) => (
                  <div
                    key={imovel.id}
                    className="bg-white p-3.5 rounded-lg border border-[#E5E5E5] shadow-sm flex flex-col gap-3 hover:border-[#1A3A52]/30 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-black text-[#1A3A52] text-[14px] truncate">
                          {imovel.codigo_imovel || 'Sem código'}
                        </span>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] h-5 py-0 px-2 uppercase border-none font-bold shrink-0',
                            imovel.status_captacao === 'fechado'
                              ? 'bg-[#D1FAE5] text-[#065F46]'
                              : imovel.status_captacao === 'perdido'
                                ? 'bg-[#FEE2E2] text-[#EF4444]'
                                : 'bg-[#E0E7FF] text-[#047857]',
                          )}
                        >
                          {imovel.status_captacao || 'Pendente'}
                        </Badge>
                      </div>
                      <div className="text-[12px] text-[#666666] flex flex-col gap-2 font-medium">
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-4 h-4 shrink-0 text-[#999999]" />{' '}
                          <span className="truncate">{imovel.endereco || 'Não informado'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 shrink-0 text-[#10B981]" />{' '}
                          <span className="font-bold text-[#333333] text-[13px]">
                            {formatPrice(imovel.preco || 0)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 truncate">
                          <UserIcon className="w-4 h-4 shrink-0 text-[#999999]" />{' '}
                          <span className="truncate text-[#333333]">{imovel.captador_nome}</span>
                        </div>
                      </div>
                    </div>
                    {imovel.status_captacao === 'pendente' &&
                      demand.status_demanda === 'aberta' && (
                        <div className="flex gap-2 pt-3 border-t border-[#E5E5E5] mt-1">
                          <Button
                            size="sm"
                            className="h-9 bg-[#10B981] hover:bg-[#059669] text-white flex-1 text-[12px] font-bold shadow-sm"
                            onClick={(e) =>
                              handleAction(e, imovel.id, 'fechado', 'Imóvel Validado')
                            }
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1.5" /> Validar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-9 text-[#EF4444] border-[#FECACA] hover:bg-[#FEE2E2] flex-1 text-[12px] font-bold shadow-sm"
                            onClick={(e) =>
                              handleAction(e, imovel.id, 'perdido', 'Imóvel Rejeitado')
                            }
                          >
                            <XCircle className="w-4 h-4 mr-1.5" /> Rejeitar
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
            <AlertDialogTitle className="text-[#1A3A52] font-black">
              Marcar como Ganho
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#666666] font-medium text-[14px]">
              Você conseguiu fechar negócio com <strong>{demand.nome_cliente}</strong>? Esta ação
              marcará a demanda como Atendida e a removerá do fluxo ativo de buscas dos captadores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="font-bold border-[#E5E5E5] min-h-[44px]">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmWon}
              className="bg-[#10B981] hover:bg-[#059669] text-white font-bold min-h-[44px]"
            >
              Sim, fechei negócio
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
