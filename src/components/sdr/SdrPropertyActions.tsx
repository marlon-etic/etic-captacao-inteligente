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
import {
  Calendar,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  XCircle,
  Handshake,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { useUserRole } from '@/hooks/use-user-role'
import useAppStore from '@/stores/useAppStore'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function SdrPropertyActions({
  propertyId,
  demandId,
}: {
  propertyId: string
  demandId: string
}) {
  const [matchId, setMatchId] = useState<string | null>(null)
  const [visits, setVisits] = useState<any[]>([])
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [negotiations, setNegotiations] = useState<any[]>([])

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
  }, [propertyId, demandId])

  const fetchRecords = async () => {
    if (!matchId) return
    const [resVisits, resFeedbacks, resNeg] = await Promise.all([
      supabase.from('visit_records').select('*').eq('property_link_id', matchId),
      supabase.from('feedback_records').select('*').eq('property_link_id', matchId),
      supabase.from('negotiation_records').select('*').eq('property_link_id', matchId),
    ])
    if (resVisits.data) setVisits(resVisits.data)
    if (resFeedbacks.data) setFeedbacks(resFeedbacks.data)
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
          table: 'feedback_records',
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

  // Modals state
  const [visitOpen, setVisitOpen] = useState(false)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [negOpen, setNegOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Visit Form
  const [visitNotes, setVisitNotes] = useState('')

  // Feedback Form
  const [interestLevel, setInterestLevel] = useState<'interested' | 'not_interested'>('interested')
  const [feedbackText, setFeedbackText] = useState('')

  // Negotiation Form
  const [negStatus, setNegStatus] = useState<'negociado' | 'falhou'>('negociado')
  const [negNotes, setNegNotes] = useState('')

  if (!matchId) return null

  const hasVisitToday = visits.some((v) => {
    const vDate = new Date(v.visited_date || v.created_at).toDateString()
    return vDate === new Date().toDateString()
  })
  const hasFeedback = feedbacks.length > 0
  const hasNegotiation = negotiations.length > 0

  const handleVisit = async () => {
    setIsLoading(true)
    const { error } = await supabase.functions.invoke('visit-registration', {
      body: { property_link_id: matchId, notes: visitNotes },
    })
    setIsLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Visita registrada com sucesso!' })
      setVisitOpen(false)
      setVisitNotes('')
    }
  }

  const handleFeedback = async () => {
    setIsLoading(true)
    const { error } = await supabase.functions.invoke('feedback-registration', {
      body: {
        property_link_id: matchId,
        interest_level: interestLevel,
        feedback_text: feedbackText,
      },
    })
    setIsLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Feedback registrado com sucesso!' })
      setFeedbackOpen(false)
      setFeedbackText('')
    }
  }

  const handleNegotiation = async () => {
    setIsLoading(true)
    const { error } = await supabase.functions.invoke('negotiation-registration', {
      body: { property_link_id: matchId, negotiation_status: negStatus, notes: negNotes },
    })
    setIsLoading(false)
    if (error) {
      toast({ title: 'Erro', description: error.message, variant: 'destructive' })
    } else {
      toast({ title: 'Sucesso', description: 'Negociação registrada com sucesso!' })
      setNegOpen(false)
      setNegNotes('')
    }
  }

  const getUserName = (id: string) =>
    users.find((u) => u.id === id)?.name || users.find((u) => u.id === id)?.nome || 'SDR'

  const timelineEvents = [
    ...visits.map((v) => ({
      type: 'visit',
      date: new Date(v.visited_at || v.created_at),
      data: v,
    })),
    ...feedbacks.map((f) => ({ type: 'feedback', date: new Date(f.created_at), data: f })),
    ...negotiations.map((n) => ({
      type: 'negotiation',
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
            onClick={() => {
              setInterestLevel('interested')
              setFeedbackOpen(true)
            }}
            disabled={hasFeedback}
            className="flex-1 min-w-[120px] bg-white border-[#E5E5E5] hover:bg-green-50 text-green-700 hover:text-green-800"
          >
            <ThumbsUp className="w-4 h-4 mr-2" />
            Gostei
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInterestLevel('not_interested')
              setFeedbackOpen(true)
            }}
            disabled={hasFeedback}
            className="flex-1 min-w-[120px] bg-white border-[#E5E5E5] hover:bg-red-50 text-red-700 hover:text-red-800"
          >
            <ThumbsDown className="w-4 h-4 mr-2" />
            Não Gostei
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setNegOpen(true)}
            disabled={hasNegotiation}
            className="flex-1 min-w-[120px] bg-white border-[#E5E5E5] hover:bg-purple-50 text-purple-700 hover:text-purple-800"
          >
            <Handshake className="w-4 h-4 mr-2" />
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
                {ev.type === 'feedback' && ev.data.interest_level === 'interested' && (
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                )}
                {ev.type === 'feedback' && ev.data.interest_level === 'not_interested' && (
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                )}
                {ev.type === 'negotiation' && ev.data.negotiation_status === 'negociado' && (
                  <CheckCircle2 className="w-4 h-4 text-purple-500" />
                )}
                {ev.type === 'negotiation' && ev.data.negotiation_status === 'falhou' && (
                  <XCircle className="w-4 h-4 text-slate-500" />
                )}
              </div>
              <div className="flex-1 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                <div className="flex justify-between items-start mb-1 gap-2">
                  <span className="font-bold text-slate-700 text-sm">
                    {ev.type === 'visit' && 'Visita Realizada'}
                    {ev.type === 'feedback' &&
                      ev.data.interest_level === 'interested' &&
                      'Cliente Interessado'}
                    {ev.type === 'feedback' &&
                      ev.data.interest_level === 'not_interested' &&
                      'Cliente Não Interessado'}
                    {ev.type === 'negotiation' &&
                      ev.data.negotiation_status === 'negociado' &&
                      'Negócio Fechado'}
                    {ev.type === 'negotiation' &&
                      ev.data.negotiation_status === 'falhou' &&
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
                {(ev.data.notes || ev.data.feedback_text) && (
                  <div className="text-sm text-slate-600 bg-slate-50 p-2.5 rounded-md flex gap-2 items-start border border-slate-100">
                    <MessageSquare className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                    <span className="leading-relaxed">
                      {ev.data.notes || ev.data.feedback_text}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={visitOpen} onOpenChange={setVisitOpen}>
        <DialogContent className="sm:max-w-md">
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

      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar Feedback</DialogTitle>
            <DialogDescription>
              {interestLevel === 'interested'
                ? 'O cliente gostou do imóvel.'
                : 'O cliente não gostou do imóvel.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Motivo / Feedback (Opcional)</Label>
              <Textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Detalhes do que o cliente achou..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleFeedback}
              disabled={isLoading}
              className={
                interestLevel === 'interested'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={negOpen} onOpenChange={setNegOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Status da Negociação</DialogTitle>
            <DialogDescription>
              Atualize o resultado das negociações para este imóvel.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select value={negStatus} onValueChange={(val: any) => setNegStatus(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o resultado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="negociado">Negócio Fechado (Sucesso)</SelectItem>
                  <SelectItem value="falhou">Negociação Falhou</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Observações (Opcional)</Label>
              <Textarea
                value={negNotes}
                onChange={(e) => setNegNotes(e.target.value)}
                placeholder="Valores acordados, motivo da falha..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNegOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button
              onClick={handleNegotiation}
              disabled={isLoading}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar Negociação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
