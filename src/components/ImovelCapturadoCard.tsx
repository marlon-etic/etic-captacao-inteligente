import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Check, Eye, Undo, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
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
import { Demand, CapturedProperty } from '@/types'

export function ImovelCapturadoCard({
  property,
  demand,
  isOwnerOrAdmin,
}: {
  property: CapturedProperty
  demand: Demand
  isOwnerOrAdmin: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const [confirmFechamento, setConfirmFechamento] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const etapa = property.etapa_funil || 'capturado'

  const handleVisitado = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSubmitting) return
    setIsSubmitting(true)
    const { error } = await supabase
      .from('imoveis_captados')
      .update({ etapa_funil: 'visitado', data_visita: new Date().toISOString() })
      .eq('id', property.id)
    if (!error) {
      toast({
        title: 'Etapa atualizada',
        description: `Imóvel ${property.code} marcado como visitado.`,
        className: 'bg-[#FBBF24] text-[#854D0E] border-none',
      })
    }
    setIsSubmitting(false)
  }

  const handleFechado = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    const { error } = await supabase
      .from('imoveis_captados')
      .update({ etapa_funil: 'fechado', data_fechamento: new Date().toISOString() })
      .eq('id', property.id)
    if (!error) {
      const table = demand.type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
      await supabase.from(table).update({ status_demanda: 'ganho' }).eq('id', demand.id)
      toast({
        title: '🎉 Negócio Fechado!',
        description: `O imóvel ${property.code} foi marcado como fechado. +30 pontos!`,
        className: 'bg-[#10B981] text-white border-none',
      })
    }
    setConfirmFechamento(false)
    setIsSubmitting(false)
  }

  const handleDesfazer = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSubmitting) return
    setIsSubmitting(true)

    if (etapa === 'visitado') {
      await supabase
        .from('imoveis_captados')
        .update({ etapa_funil: 'capturado', data_visita: null })
        .eq('id', property.id)
      toast({ description: 'Etapa desfeita para Capturado.' })
    } else if (etapa === 'fechado') {
      await supabase
        .from('imoveis_captados')
        .update({ etapa_funil: 'visitado', data_fechamento: null })
        .eq('id', property.id)
      const table = demand.type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
      await supabase.from(table).update({ status_demanda: 'atendida' }).eq('id', demand.id)

      const col = demand.type === 'Aluguel' ? 'demanda_locacao_id' : 'demanda_venda_id'
      if (property.captador_id) {
        await supabase
          .from('pontuacao_captador')
          .delete()
          .eq(col, demand.id)
          .eq('tipo_pontuacao', 'ganho_confirmado')
          .eq('captador_id', property.captador_id)
      }
      toast({ description: 'Etapa desfeita para Visitado.' })
    } else if (etapa === 'perdido') {
      await supabase
        .from('imoveis_captados')
        .update({ etapa_funil: 'capturado' })
        .eq('id', property.id)
      toast({ description: 'Etapa desfeita para Capturado.' })
    }
    setIsSubmitting(false)
  }

  const handlePerdido = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isSubmitting) return
    setIsSubmitting(true)
    await supabase.from('imoveis_captados').update({ etapa_funil: 'perdido' }).eq('id', property.id)
    toast({
      title: 'Imóvel Perdido',
      description: 'O imóvel foi marcado como perdido.',
      className: 'bg-[#EF4444] text-white border-none',
    })
    setIsSubmitting(false)
  }

  const formatPrice = (val?: number) => {
    if (!val) return '0'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  return (
    <>
      <div className="flex flex-col border border-[#E5E5E5] rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md bg-white w-full">
        <div
          className="flex flex-col sm:flex-row p-4 gap-4 cursor-pointer relative"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex-1 flex flex-col gap-1.5 min-w-0 pr-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-[16px] text-[#1A3A52] shrink-0">
                {property.code}
              </span>
              <Badge
                className={cn(
                  'border-none text-white font-bold px-2 py-0.5 flex items-center gap-1 shadow-sm text-[10px] uppercase shrink-0 transition-colors duration-300',
                  etapa === 'capturado' && 'bg-[#3B82F6]',
                  etapa === 'visitado' && 'bg-[#FBBF24] text-[#854D0E]',
                  etapa === 'fechado' && 'bg-[#10B981]',
                  etapa === 'perdido' && 'bg-[#EF4444]',
                )}
              >
                {etapa === 'capturado' && '📍 CAPTURADO'}
                {etapa === 'visitado' && '👁️ VISITADO'}
                {etapa === 'fechado' && '✓ FECHADO'}
                {etapa === 'perdido' && '✗ PERDIDO'}
              </Badge>
            </div>

            <div className="flex items-center gap-1.5 text-[13px] text-[#666666]">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-[#F44336]" />
              <span className="truncate">
                {Array.isArray(property.neighborhood)
                  ? property.neighborhood.join(', ')
                  : property.neighborhood}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between mt-1 gap-2">
              <span className="text-[16px] font-black text-[#10B981] shrink-0">
                {formatPrice(property.value)}
              </span>
              <div className="text-[12px] text-[#999999] truncate">
                Captador: <span className="font-bold text-[#333333]">{property.captador_name}</span>
              </div>
            </div>
          </div>

          {isOwnerOrAdmin && (
            <div
              className="flex flex-col gap-2 shrink-0 border-t sm:border-t-0 sm:border-l border-[#F5F5F5] pt-3 sm:pt-0 sm:pl-4 justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {etapa === 'capturado' && (
                <>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleVisitado}
                    className="w-full sm:w-[130px] min-h-[40px] bg-[#FBBF24] hover:bg-[#F59E0B] text-[#854D0E] font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Eye className="w-4 h-4 mr-1.5" /> Visitado
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmFechamento(true)
                    }}
                    className="w-full sm:w-[130px] min-h-[40px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Fechar
                  </Button>
                </>
              )}
              {etapa === 'visitado' && (
                <>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={(e) => {
                      e.stopPropagation()
                      setConfirmFechamento(true)
                    }}
                    className="w-full sm:w-[130px] min-h-[40px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Fechar
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleDesfazer}
                    variant="outline"
                    className="w-full sm:w-[130px] min-h-[40px] bg-[#F5F5F5] border-[#E5E5E5] text-[#666666] font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Undo className="w-4 h-4 mr-1.5" /> Desfazer
                  </Button>
                </>
              )}
              {etapa === 'fechado' && (
                <>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handleDesfazer}
                    variant="outline"
                    className="w-full sm:w-[130px] min-h-[40px] bg-[#F5F5F5] border-[#E5E5E5] text-[#666666] font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <Undo className="w-4 h-4 mr-1.5" /> Desfazer
                  </Button>
                  <Button
                    size="sm"
                    disabled={isSubmitting}
                    onClick={handlePerdido}
                    className="w-full sm:w-[130px] min-h-[40px] bg-[#EF4444] hover:bg-[#DC2626] text-white font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                  >
                    <X className="w-4 h-4 mr-1.5" /> Perdido
                  </Button>
                </>
              )}
              {etapa === 'perdido' && (
                <Button
                  size="sm"
                  disabled={isSubmitting}
                  onClick={handleDesfazer}
                  variant="outline"
                  className="w-full sm:w-[130px] min-h-[40px] bg-[#F5F5F5] border-[#E5E5E5] text-[#666666] font-bold text-[12px] px-3 shadow-sm transition-transform hover:scale-[1.02]"
                >
                  <Undo className="w-4 h-4 mr-1.5" /> Desfazer
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Expanded Area */}
        <div
          className={cn(
            'bg-[#F8FAFC] border-t border-[#E5E5E5] overflow-hidden transition-all duration-300 ease-in-out',
            expanded ? 'max-h-[300px] p-4 opacity-100' : 'max-h-0 p-0 opacity-0',
          )}
        >
          <div className="grid grid-cols-2 gap-4 text-[13px] text-[#333333]">
            <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E5]/50">
              <strong className="text-[#999999] uppercase text-[10px] block mb-0.5">
                Dormitórios
              </strong>
              <span className="font-bold text-[#1A3A52]">{property.dormitorios || 'Indif.'}</span>
            </div>
            <div className="bg-white p-2.5 rounded-lg border border-[#E5E5E5]/50">
              <strong className="text-[#999999] uppercase text-[10px] block mb-0.5">Vagas</strong>
              <span className="font-bold text-[#1A3A52]">
                {property.vagas || property.parkingSpots || 'Indif.'}
              </span>
            </div>
            <div className="col-span-2 bg-[#FFFBEB] p-3 rounded-lg border border-[#FCD34D]/50 text-[#854D0E]">
              <strong className="uppercase text-[10px] block mb-1 font-black">Observações</strong>
              <p className="font-medium whitespace-pre-wrap leading-snug">
                {property.observacoes ||
                  property.obs ||
                  'Nenhuma observação específica fornecida pelo captador.'}
              </p>
            </div>
            <div className="col-span-2 flex flex-col gap-1 mt-1 pt-3 border-t border-[#E5E5E5]/50">
              <span className="text-[11px] text-[#999999] flex justify-between">
                <strong>Capturado:</strong>{' '}
                {new Date(property.capturedAt || '').toLocaleString('pt-BR')}
              </span>
              {property.data_visita && (
                <span className="text-[11px] text-[#F59E0B] flex justify-between">
                  <strong>Visitado:</strong>{' '}
                  {new Date(property.data_visita).toLocaleString('pt-BR')}
                </span>
              )}
              {property.data_fechamento && (
                <span className="text-[11px] text-[#10B981] flex justify-between">
                  <strong>Fechado:</strong>{' '}
                  {new Date(property.data_fechamento).toLocaleString('pt-BR')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <AlertDialog open={confirmFechamento} onOpenChange={setConfirmFechamento}>
        <AlertDialogContent className="rounded-[16px] border-0 shadow-2xl p-0 overflow-hidden max-w-[400px] z-[120]">
          <AlertDialogHeader className="p-6 bg-[#F8FAFC] border-b border-[#E5E5E5]">
            <AlertDialogTitle className="text-[#1A3A52] font-black text-xl flex items-center gap-2">
              <Check className="w-6 h-6 text-[#10B981]" /> Confirmar Fechamento
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#666666] mt-2 text-[15px]">
              Ao confirmar o fechamento deste imóvel, a demanda será marcada como{' '}
              <strong className="text-[#10B981]">Ganha</strong> e o captador{' '}
              <strong className="text-[#333333]">{property.captador_name}</strong> receberá{' '}
              <strong className="text-[#10B981]">+30 pontos</strong> no ranking.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="p-4 bg-white border-t border-[#E5E5E5] flex gap-3">
            <AlertDialogCancel className="mt-0 min-h-[48px] border-none bg-[#F5F5F5] hover:bg-[#E5E5E5] text-[#333333] font-bold">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleFechado}
              disabled={isSubmitting}
              className="min-h-[48px] bg-[#10B981] hover:bg-[#059669] text-white font-black shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
            >
              {isSubmitting ? 'Confirmando...' : 'Confirmar Negócio'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
