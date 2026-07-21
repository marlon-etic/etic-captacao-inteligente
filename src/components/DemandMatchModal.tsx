import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { calculateMatching } from '@/lib/matching'
import { isResidential, hasBedrooms } from '@/lib/residential-filter'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { X, MapPin, CheckCircle, Loader2, Calendar, Zap, MessageSquare } from 'lucide-react'
import { VisitRegistrationModal } from './VisitRegistrationModal'
import { FeedbackRegistrationModal } from './FeedbackRegistrationModal'

interface MatchProperty {
  id: string
  codigo_imovel: string | null
  endereco: string | null
  localizacao_texto: string | null
  preco: number | null
  dormitorios: number | null
  vagas: number | null
  tipo_imovel: string | null
  score: number
  details: any
  isLinked: boolean
  hasVisit: boolean
  matchId?: string
}

interface Props {
  demand: SupabaseDemand | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DemandMatchModal({ demand, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const { currentUser } = useAppStore()
  const [properties, setProperties] = useState<MatchProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [linking, setLinking] = useState(false)
  const [visitTarget, setVisitTarget] = useState<{
    imovelId: string
    matchId?: string
    label: string
  } | null>(null)
  const [feedbackTarget, setFeedbackTarget] = useState<{
    matchId: string
    label: string
  } | null>(null)

  useEffect(() => {
    if (!demand || !open) return
    setLoading(true)
    setSelected(new Set())

    const fetchMatches = async () => {
      const tipoFilter = demand.tipo === 'Venda' ? ['Venda', 'Ambos'] : ['Locação', 'Ambos']

      const [{ data: existingMatches }, { data: rawProps }] = await Promise.all([
        supabase.from('imovel_demand_match').select('id, imovel_id').eq('demanda_id', demand.id),
        supabase
          .from('imoveis_captados')
          .select(
            'id, codigo_imovel, endereco, localizacao_texto, preco, valor, dormitorios, vagas, tipo_imovel, tipo',
          )
          .in('tipo', tipoFilter)
          .limit(200),
      ])

      const matchIds = (existingMatches || []).map((m: any) => m.id)
      const { data: visitData } =
        matchIds.length > 0
          ? await supabase
              .from('visit_records')
              .select('property_link_id')
              .in('property_link_id', matchIds)
          : { data: [] }
      const visitedLinkIds = new Set((visitData || []).map((v: any) => v.property_link_id))

      const matched = (rawProps || [])
        .filter((p: any) => isResidential(p.tipo_imovel) && hasBedrooms(p.dormitorios))
        .map((p: any) => {
          const result = calculateMatching(p, demand)
          const existing = (existingMatches || []).find((m: any) => m.imovel_id === p.id)
          return {
            ...p,
            score: result.score,
            details: result.details,
            isLinked: !!existing,
            hasVisit: existing ? visitedLinkIds.has(existing.id) : false,
            matchId: existing?.id,
          }
        })
        .filter((m: any) => m.score > 50)
        .sort((a: any, b: any) => b.score - a.score)

      setProperties(matched)
      setLoading(false)
    }
    fetchMatches()
  }, [demand, open])

  const toggleSelection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleBulkLink = async () => {
    const toLink = properties.filter((p) => selected.has(p.id) && !p.isLinked)
    if (toLink.length === 0 || !demand) return
    setLinking(true)
    try {
      const inserts = toLink.map((p) => ({
        imovel_id: p.id,
        demanda_id: demand.id,
        tipo_demanda: demand.tipo === 'Venda' ? 'Venda' : 'Locação',
        captador_id: currentUser?.id,
        tipo_vinculacao: 'manual',
        compatibilidade_pct: p.score,
      }))
      const { error } = await supabase.from('imovel_demand_match').insert(inserts)
      if (error) throw error
      setProperties((prev) => prev.map((p) => (selected.has(p.id) ? { ...p, isLinked: true } : p)))
      setSelected(new Set())
      toast({
        title: 'Imóveis Vinculados!',
        description: `${toLink.length} imóveis vinculados à demanda.`,
        className: 'bg-[#10B981] text-white border-none',
      })
    } catch (err: any) {
      toast({
        title: 'Erro ao vincular',
        description: err.message,
        variant: 'destructive',
      })
    } finally {
      setLinking(false)
    }
  }

  const formatCurrency = (val: number | null) => {
    if (!val) return 'R$ 0'
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0,
    }).format(val)
  }

  const selectedCount = properties.filter((p) => selected.has(p.id) && !p.isLinked).length

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-full h-[100dvh] sm:h-[85vh] sm:max-w-[700px] p-0 flex flex-col rounded-none sm:rounded-[16px] gap-0 bg-[#F8FAFC] shadow-2xl z-[1100]">
          <DialogHeader className="p-4 border-b border-[#E5E5E5] flex-row items-center justify-between bg-white shrink-0">
            <div>
              <DialogTitle className="text-xl font-black text-[#1A3A52]">
                Matches para {demand?.nome_cliente}
              </DialogTitle>
              <p className="text-sm text-[#666666] font-medium mt-1">
                {properties.length} imóveis compatíveis •{' '}
                {properties.filter((p) => p.isLinked).length} já vinculados
              </p>
            </div>
            <DialogClose className="w-8 h-8 rounded-full bg-[#F5F5F5] hover:bg-[#E5E5E5] flex items-center justify-center">
              <X className="w-5 h-5" />
            </DialogClose>
          </DialogHeader>

          {properties.filter((p) => !p.isLinked).length > 0 && (
            <div className="p-3 bg-white border-b border-[#E5E5E5] flex items-center justify-between shrink-0">
              <span className="text-sm font-bold text-[#333333]">{selectedCount} selecionados</span>
              <Button
                onClick={handleBulkLink}
                disabled={selectedCount === 0 || linking}
                size="sm"
                className="bg-[#10B981] hover:bg-[#059669] text-white"
              >
                {linking ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Vincular Selecionados
              </Button>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              [1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
            ) : properties.length === 0 ? (
              <div className="text-center py-16 flex flex-col items-center">
                <Zap className="w-12 h-12 text-[#999999]/30 mb-3" />
                <p className="text-[16px] font-bold text-[#333333]">
                  Nenhum imóvel compatível encontrado
                </p>
                <p className="text-[14px] text-[#666666] mt-1">
                  Tente ampliar os critérios da demanda.
                </p>
              </div>
            ) : (
              properties.map((prop) => (
                <div
                  key={prop.id}
                  className={cn(
                    'bg-white rounded-xl border p-3 flex items-start gap-3 transition-all',
                    prop.isLinked
                      ? 'border-[#10B981]/30 bg-[#F0FDF4]'
                      : selected.has(prop.id)
                        ? 'border-[#2E5F8A] ring-2 ring-[#2E5F8A]/20'
                        : 'border-[#E5E5E5] hover:border-[#2E5F8A]/30',
                  )}
                >
                  {!prop.isLinked && (
                    <Checkbox
                      checked={selected.has(prop.id)}
                      onCheckedChange={() => toggleSelection(prop.id)}
                      className="mt-1"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-[#1A3A52]">
                          {prop.codigo_imovel ? `#${prop.codigo_imovel}` : 'Imóvel'} -{' '}
                          {prop.tipo_imovel || 'N/A'}
                        </span>
                        <Badge
                          className={cn(
                            'text-[10px] font-bold border-none',
                            prop.score >= 80
                              ? 'bg-[#10B981] text-white'
                              : 'bg-[#3B82F6] text-white',
                          )}
                        >
                          {prop.score}% compatível
                        </Badge>
                        {prop.isLinked && (
                          <Badge className="bg-[#10B981] text-white text-[10px] border-none">
                            ✓ Vinculado
                          </Badge>
                        )}
                        {prop.hasVisit && (
                          <Badge className="bg-purple-500 text-white text-[10px] border-none">
                            Visitado
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm font-bold text-[#10B981]">
                        {formatCurrency(prop.preco)}
                      </span>
                    </div>
                    <p className="text-xs text-[#666666] mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3" />{' '}
                      {prop.endereco || prop.localizacao_texto || 'S/ endereço'}
                      <span className="ml-2 border-l pl-2 border-[#E5E5E5]">
                        {prop.dormitorios || 0} dorm • {prop.vagas || 0} vagas
                      </span>
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-[11px] font-bold"
                        onClick={() =>
                          setVisitTarget({
                            imovelId: prop.id,
                            matchId: prop.matchId,
                            label: `${prop.codigo_imovel || prop.tipo_imovel} - ${prop.endereco || prop.localizacao_texto || ''}`,
                          })
                        }
                      >
                        <Calendar className="w-3 h-3 mr-1" /> Registrar Visita
                      </Button>
                      {prop.isLinked && prop.matchId && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] font-bold"
                          onClick={() =>
                            setFeedbackTarget({
                              matchId: prop.matchId!,
                              label: `${prop.codigo_imovel || prop.tipo_imovel} - ${prop.endereco || prop.localizacao_texto || ''}`,
                            })
                          }
                        >
                          <MessageSquare className="w-3 h-3 mr-1" /> Feedback
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <VisitRegistrationModal
        open={!!visitTarget}
        onOpenChange={(o) => !o && setVisitTarget(null)}
        demandId={demand?.id || ''}
        tipoDemanda={demand?.tipo === 'Venda' ? 'Venda' : 'Locação'}
        imovelId={visitTarget?.imovelId}
        propertyLinkId={visitTarget?.matchId}
        propertyLabel={visitTarget?.label}
      />

      <FeedbackRegistrationModal
        open={!!feedbackTarget}
        onOpenChange={(o) => !o && setFeedbackTarget(null)}
        propertyLinkId={feedbackTarget?.matchId || ''}
        propertyLabel={feedbackTarget?.label || ''}
      />
    </>
  )
}
