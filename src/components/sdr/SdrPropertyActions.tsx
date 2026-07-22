import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'
import { Calendar, CheckCircle2, XCircle, Handshake, Loader2, MessageSquare } from 'lucide-react'
import { useUserRole } from '@/hooks/use-user-role'
import useAppStore from '@/stores/useAppStore'
import { Label } from '@/components/ui/label'
import { NegotiationRegistrationModal } from '@/components/NegotiationRegistrationModal'
import type { LinkedProperty } from '@/components/VisitRegistrationModal'

export function SdrPropertyActions({
  propertyId,
  demandId,
  tipoDemanda = 'Locação',
}: {
  propertyId: string
  demandId: string
  tipoDemanda?: string
}) {
  const [matchId, setMatchId] = useState<string | null>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [negotiations, setNegotiations] = useState<any[]>([])
  const [visitOpen, setVisitOpen] = useState(false)
  const [negOpen, setNegOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [visitNotes, setVisitNotes] = useState('')
  const [negLinkedProperty, setNegLinkedProperty] = useState<LinkedProperty | null>(null)

  const { role } = useUserRole()
  const { users } = useAppStore()
  const isActionAllowed =
    role === 'sdr' || role === 'corretor' || role === 'admin' || role === 'gestor'

  useEffect(() => {
    async function fetchMatch() {
      if (!propertyId || !demandId) return
      const { data } = await supabase
        .from('imovel_demand_match')
        .select('id')
        .eq('imovel_id', propertyId)
        .eq('demanda_id', demandId)
        .maybeSingle()
      if (data) setMatchId(data.id)
    }
    fetchMatch()

    const matchChannel = supabase
      .channel(`match_listener_${propertyId}_${demandId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'imovel_demand_match',
          filter: `imovel_id=eq.${propertyId}`,
        },
        (payload) => {
          if (payload.new && payload.new.demanda_id === demandId) {
            setMatchId(payload.new.id)
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(matchChannel)
    }
  }, [propertyId, demandId])

  const fetchRecords = async () => {
    if (!matchId) return
    const [resVisits, resNeg] = await Promise.all([
      supabase.from('visit_records').select('*').eq('property_link_id', matchId),
      supabase.from('negotiation_records').select('*').eq('property_link_id', matchId),
    ])
    if (resVisits.data) setVisits(resVisits.data)
    if (resNeg.data) setNegotiations(resNeg.data)
  }

  useEffect(() => {
    if (!matchId) return
    fetchRecords()

    const channel = supabase
      .channel(`sdr_actions_${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'visit_records',
          filter: `property_link_id=eq.${matchId}`,
        },
        fetchRecords,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'negotiation_records',
          filter: `property_link_id=eq.${matchId}`,
        },
        fetchRecords,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [matchId])

  const [negStatus] = useState<'negotiated' | 'failed'>('negotiated')
  const [negNotes] = useState('')

  const ensureMatchId = async () => {
    if (matchId) return matchId

    const { data: locData } = await supabase
      .from('demandas_locacao')
      .select('tipo')
      .eq('id', demandId)
      .maybeSingle()
    let tipoDem = locData?.tipo
    if (!tipoDem) {
      const { data: venData } = await supabase
        .from('demandas_vendas')
        .select('tipo')
        .eq('id', demandId)
        .maybeSingle()
      tipoDem = venData?.tipo || 'Ambos'
    }

    const { data, error } = await supabase
      .from('imovel_demand_match')
      .insert({
        imovel_id: propertyId,
        demanda_id: demandId,
        tipo_demanda: tipoDem,
        tipo_vinculacao: 'manual',
        compatibilidade_pct: 0,
      })
      .select('id')
      .maybeSingle()

    if (error && error.code === '23505') {
      const { data: existing } = await supabase
        .from('imovel_demand_match')
        .select('id')
        .eq('imovel_id', propertyId)
        .eq('demanda_id', demandId)
        .maybeSingle()
      if (existing) {
        setMatchId(existing.id)
        return existing.id
      }
    }

    if (error || !data) {
      toast({
        title: 'Erro',
        description: 'Não foi possível vincular o imóvel para registrar a ação.',
        variant: 'destructive',
      })
      return null
    }
    setMatchId(data.id)
    return data.id
  }

  const hasVisitToday = visits.some((v) => {
    const vDate = new Date(v.visited_date || v.created_at).toDateString()
    return vDate === new Date().toDateString()
  })
  const hasNegotiation = negotiations.length > 0

  const handleVisit = async () => {
    setIsLoading(true)
    const currentMatchId = await ensureMatchId()
    if (!currentMatchId) {
      setIsLoading(false)
      return
    }
    const { error } = await supabase.functions.invoke('visit-registration', {
      body: { property_link_id: currentMatchId, notes: visitNotes },
    })
    setIsLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Visita registrada com sucesso!' })
      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: { data: { id: demandId, _visitRegistered: true } },
        }),
      )
      setVisitOpen(false)
      setVisitNotes('')
    }
  }

  const handleOpenNegotiation = async () => {
    setIsLoading(true)
    const currentMatchId = await ensureMatchId()
    if (!currentMatchId) {
      setIsLoading(false)
      return
    }

    const { data: propData } = await supabase
      .from('imoveis_captados')
      .select('codigo_imovel, endereco, localizacao_texto')
      .eq('id', propertyId)
      .maybeSingle()

    const label = propData?.codigo_imovel
      ? `${propData.codigo_imovel}${propData.endereco ? ' - ' + propData.endereco : ''}`
      : propData?.endereco || propData?.localizacao_texto || 'Imóvel'

    setNegLinkedProperty({ matchId: currentMatchId, label })
    setIsLoading(false)
    setNegOpen(true)
  }

  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name || users.find((u) => u.id === id)?.nome || 'SDR'

  const timelineEvents = [
    ...visits.map((v) => ({
      type: 'visit' as const,
      date: new Date(v.visited_at || v.created_at),
      data: v,
    })),
    ...negotiations.map((n) => ({
      type: 'negotiation' as const,
      date: new Date(n.negotiation_date || n.created_at),
      data: n,
    })),
  ].sort((a, b) => b.date.getTime() - a.date.getTime())

  return (
    <div className="bg-[#F8FAFC] rounded-xl border border-[#E5E5E5] p-4 mt-2">
      {isActionAllowed && (
        <div className="flex flex-wrap gap-2 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setVisitOpen(true)}
            disabled={hasVisitToday}
            className="flex-1 min-w-[120px] bg-white border-[#E5E5E5] hover:bg-blue-50 text-blue-700 hover:text-blue-800"
          >
            <Calendar className="w-4 h-4 mr-2" />
            {hasVisitToday ? 'Visita Hoje ✓' : 'Registrar Visita'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenNegotiation}
            disabled={hasNegotiation || isLoading}
            className="flex-1 min-w-[120px] bg-white border-[#E5E5E5] hover:bg-purple-50 text-purple-700 hover:text-purple-800"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Handshake className="w-4 h-4 mr-2" />
            )}
            {hasNegotiation ? 'Negociado ✓' : 'Negociação'}
          </Button>
        </div>
      )}

      {timelineEvents.length > 0 && (
        <div className="space-y-3 relative before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent pt-2">
          {timelineEvents.map((ev, i) => (
            <div key={i} className="relative flex items-start gap-4">
              <div className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white bg-slate-100 text-slate-500 shadow-sm shrink-0 z-10 relative">
                {ev.type === 'visit' && <Calendar className="w-4 h-4 text-blue-500" />}
                {ev.type === 'negotiation' && ev.data.negotiation_status === 'negotiated' && (
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                )}
                {ev.type === 'negotiation' && ev.data.negotiation_status === 'failed' && (
                  <XCircle className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="font-bold text-slate-700 text-sm">
                    {ev.type === 'visit' && 'Visita Realizada'}
                    {ev.type === 'negotiation' &&
                      ev.data.negotiation_status === 'negotiated' &&
                      'Negócio Fechado'}
                    {ev.type === 'negotiation' &&
                      ev.data.negotiation_status === 'failed' &&
                      'Negociação Falhou'}
                  </span>
                  <span className="text-xs text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-0.5 rounded-full border border-slate-100">
                    {ev.date.toLocaleString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-2">
                  Por {getUserName(ev.data.sdr_user_id || ev.data.negotiated_by_user_id)}
                </div>
                {ev.type === 'negotiation' &&
                  ev.data.negotiation_status === 'negotiated' &&
                  ev.data.valor_fechado > 0 && (
                    <div className="text-sm text-purple-700 font-bold mb-1">
                      Valor Fechado: R${' '}
                      {Number(ev.data.valor_fechado).toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </div>
                  )}
                {ev.data.notes && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-md flex gap-2 items-start border border-slate-100">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <span className="leading-relaxed">{ev.data.notes}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent className="sm:max-w-md z-[1200]">
          <DialogHeader>
            <DialogTitle>Registrar Visita</DialogTitle>
            <DialogDescription>Confirme a visita realizada a este imóvel.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Observações da Visita (Opcional)</Label>
              <Textarea
                value={visitNotes}
                onChange={(e) => setVisitNotes(e.target.value)}
                placeholder="Como foi a visita? Detalhes relevantes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVisitOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleVisit}
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {negLinkedProperty && (
        <NegotiationRegistrationModal
          open={negOpen}
          onOpenChange={setNegOpen}
          demandId={demandId}
          tipoDemanda={tipoDemanda}
          linkedProperties={[negLinkedProperty]}
        />
      )}
    </div>
  )
}
