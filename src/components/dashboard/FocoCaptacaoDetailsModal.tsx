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
import { X, MapPin, Home, Building2, DollarSign, BedDouble, Clock, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface FocoItem {
  tipo: string
  tipo_imovel: string
  bairro_alvo: string | null
  qtd_clientes_aguardando: number | null
  ticket_medio: number | null
}

interface FocoDemand {
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

  useEffect(() => {
    if (!focoItem || !isOpen) {
      setDemands([])
      return
    }

    async function fetchDemands() {
      setLoading(true)
      try {
        const bairro = focoItem!.bairro_alvo || ''
        const isVenda = focoItem!.tipo?.toLowerCase().includes('venda')
        const table = isVenda ? 'demandas_vendas' : 'demandas_locacao'
        const fields =
          'id, nome_cliente, bairros, localizacoes, valor_maximo, orcamento_max, dormitorios, quartos, nivel_urgencia, status_demanda, tipo_imovel, created_at'

        let query = supabase
          .from(table)
          .select(fields)
          .in('status_demanda', ['aberta', 'em busca', 'em visita'])

        if (bairro && bairro !== 'Sem Bairro') {
          query = query.or(
            `bairros.cs.${JSON.stringify([bairro])},localizacoes.cs.${JSON.stringify([bairro])}`,
          )
        }

        const { data, error } = await query.order('created_at', { ascending: false }).limit(30)
        if (error) throw error
        setDemands((data || []) as FocoDemand[])
      } catch (e) {
        console.error('Error fetching foco demands:', e)
        setDemands([])
      } finally {
        setLoading(false)
      }
    }

    fetchDemands()
  }, [focoItem, isOpen])

  if (!focoItem) return null

  return (
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
                  Nenhuma demanda encontrada para esta região.
                </div>
              ) : (
                <div className="divide-y divide-[#E5E5E5]">
                  {demands.map((demand) => (
                    <div key={demand.id} className="p-4 hover:bg-[#F8FAFC] transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-[#1A3A52] text-sm">
                            {demand.nome_cliente || 'Cliente não identificado'}
                          </p>
                          <p className="text-xs text-[#999999] flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {(demand.bairros || demand.localizacoes || ['Sem bairro']).join(', ')}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {demand.status_demanda || 'aberta'}
                        </Badge>
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
  )
}
