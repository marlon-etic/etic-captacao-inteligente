import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  X,
  MapPin,
  Home,
  Building2,
  DollarSign,
  BedDouble,
  Clock,
  Users,
  ChevronRight,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  FocoDemandDetailDialog,
  type FocoDemand,
} from '@/components/dashboard/FocoDemandDetailDialog'

interface FocoItem {
  tipo: string
  tipo_imovel: string
  bairro_alvo: string | null
  qtd_clientes_aguardando: number | null
  ticket_medio: number | null
}

interface Props {
  focoItem: FocoItem | null
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

export function FocoCaptacaoDetailsModal({ focoItem, isOpen, onClose }: Props) {
  const [demands, setDemands] = useState<FocoDemand[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDemand, setSelectedDemand] = useState<FocoDemand | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)

  useEffect(() => {
    if (!focoItem || !isOpen) {
      setDemands([])
      return
    }

    async function fetchDemands() {
      setLoading(true)
      try {
        const bairro = focoItem!.bairro_alvo || ''
        const { data, error } = await supabase.rpc('fn_get_foco_demandas', {
          p_bairro: bairro,
          p_tipo: focoItem!.tipo,
          p_tipo_imovel: focoItem!.tipo_imovel,
        })

        if (error) {
          console.error('[FocoModal] RPC error:', error)
          setDemands([])
        } else {
          const sorted = (data || []).sort((a: FocoDemand, b: FocoDemand) => {
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
          })
          setDemands(sorted as unknown as FocoDemand[])
        }
      } catch (e) {
        console.error('[FocoModal] Error fetching foco demands:', e)
        setDemands([])
      } finally {
        setLoading(false)
      }
    }

    fetchDemands()
  }, [focoItem, isOpen])

  if (!focoItem) return null

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-[640px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-3 bg-[#1A3A52] text-white relative">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              {focoItem.tipo_imovel === 'Comercial' ? (
                <Building2 className="w-5 h-5" />
              ) : (
                <Home className="w-5 h-5" />
              )}
              {focoItem.bairro_alvo || 'Região Indefinida'}
            </DialogTitle>
            {focoItem.qtd_clientes_aguardando !== null && (
              <span className="absolute left-1/2 -translate-x-1/2 bottom-2 text-xs font-medium bg-white/15 px-2 py-0.5 rounded-full">
                {focoItem.qtd_clientes_aguardando} clientes aguardando
              </span>
            )}
            <DialogClose asChild>
              <button className="absolute right-4 top-[50%] -translate-y-[50%] h-10 w-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </DialogClose>
          </DialogHeader>

          <div className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-[#F5F5F5] rounded-lg p-3">
                <p className="text-xs text-[#999999] font-bold uppercase mb-1">Tipo</p>
                <p className="text-sm font-bold text-[#1A3A52]">{focoItem.tipo}</p>
              </div>
              <div className="bg-[#F5F5F5] rounded-lg p-3">
                <p className="text-xs text-[#999999] font-bold uppercase mb-1">Tipologia</p>
                <p className="text-sm font-bold text-[#1A3A52]">{focoItem.tipo_imovel}</p>
              </div>
              <div className="bg-[#F5F5F5] rounded-lg p-3">
                <p className="text-xs text-[#999999] font-bold uppercase mb-1">Ticket Médio</p>
                <p className="text-sm font-bold text-[#1A3A52]">
                  {formatCurrency(focoItem.ticket_medio || 0)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-[#1A3A52] text-sm mb-2 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Clientes Aguardando ({demands.length})
              </h4>
              <ScrollArea className="max-h-[400px] rounded-lg border border-[#E5E5E5]">
                {loading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-[80px] w-full rounded-lg" />
                    ))}
                  </div>
                ) : demands.length === 0 ? (
                  <div className="text-center py-12 text-[#999999] font-medium text-sm">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    Nenhuma demanda encontrada para esta região.
                    {(focoItem.qtd_clientes_aguardando ?? 0) > 0 && (
                      <p className="text-xs text-[#CCCCCC] mt-1">
                        O count indicava {focoItem.qtd_clientes_aguardando} cliente(s). As demandas
                        podem ter sido atendidas.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E5E5]">
                    {demands.map((demand) => (
                      <div
                        key={demand.id}
                        className="p-4 hover:bg-[#F8FAFC] transition-all cursor-pointer hover:border-l-[3px] hover:border-l-[#2E5F8A] group"
                        onClick={() => {
                          setSelectedDemand(demand)
                          setDetailOpen(true)
                        }}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="font-bold text-[#1A3A52] text-sm group-hover:text-[#2E5F8A] transition-colors">
                              {demand.nome_cliente || 'Cliente não identificado'}
                            </p>
                            <p className="text-xs text-[#999999] flex items-center gap-1 mt-0.5">
                              <MapPin className="w-3 h-3" />
                              {(demand.bairros || demand.localizacoes || ['Sem bairro']).join(', ')}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge variant="outline" className="text-xs">
                              {demand.status_demanda || 'aberta'}
                            </Badge>
                            <span className="text-[10px] text-[#999999] font-medium">
                              {demand.tipo}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-[#666666] font-medium">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            {formatCurrency(demand.valor_maximo || demand.orcamento_max || 0)}
                          </span>
                          <span className="flex items-center gap-1">
                            <BedDouble className="w-3 h-3" />
                            {demand.dormitorios || demand.quartos || 0} dorm.
                          </span>
                          {demand.nivel_urgencia && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {demand.nivel_urgencia}
                            </span>
                          )}
                          <span className="text-[#999999]">
                            {formatDate(demand.created_at || '')}
                          </span>
                          <ChevronRight className="w-3 h-3 ml-auto text-[#999999] group-hover:text-[#2E5F8A] transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <FocoDemandDetailDialog
        demand={selectedDemand}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false)
          setSelectedDemand(null)
        }}
      />
    </>
  )
}
