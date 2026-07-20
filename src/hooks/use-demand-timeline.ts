import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { SupabaseDemand } from '@/hooks/use-supabase-demands'

export interface TimelineEvent {
  id: string
  type: 'creation' | 'match' | 'visit' | 'response' | 'status_change' | 'priority' | 'links'
  timestamp: string
  title: string
  description: string
}

export function useDemandTimeline(demand: SupabaseDemand) {
  const [events, setEvents] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const respostasRef = useRef(demand.respostas_captador || [])

  useEffect(() => {
    respostasRef.current = demand.respostas_captador || []
  }, [demand.respostas_captador])

  const fetchTimeline = useCallback(async () => {
    if (!demand.id) return
    setLoading(true)
    try {
      const [matchesResult, statusLogsResult, auditLinksResult] = await Promise.all([
        supabase
          .from('imovel_demand_match')
          .select(
            'id, imovel_id, created_at, imoveis_captados(endereco, codigo_imovel, localizacao_texto)',
          )
          .eq('demanda_id', demand.id),
        supabase
          .from('demand_status_log')
          .select('*')
          .eq('demanda_id', demand.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('audit_log')
          .select('id, created_at, dados_novos')
          .eq('registro_id', demand.id)
          .eq('acao', 'UPDATE_LINKS')
          .order('created_at', { ascending: false }),
      ])

      const matches = matchesResult.data || []
      const statusLogs = statusLogsResult.data || []
      const auditLinks = auditLinksResult.data || []
      const matchIds = matches.map((m: any) => m.id)

      let visits: any[] = []
      if (matchIds.length > 0) {
        const { data: visitData } = await supabase
          .from('visit_records')
          .select('id, property_link_id, visited_at, notes')
          .in('property_link_id', matchIds)
          .order('visited_at', { ascending: false })
        visits = visitData || []
      }

      const timelineEvents: TimelineEvent[] = [
        {
          id: 'creation',
          type: 'creation',
          timestamp: demand.created_at,
          title: 'Demanda Criada',
          description: 'A demanda foi criada no sistema.',
        },
      ]

      if (demand.is_prioritaria) {
        timelineEvents.push({
          id: 'priority',
          type: 'priority',
          timestamp: demand.created_at,
          title: 'Prioritária',
          description: 'Demanda marcada como prioritária.',
        })
      }

      auditLinks.forEach((a: any) => {
        const novos = a.dados_novos as any
        const links: string[] = novos?.links_sugeridos || []
        const count = Array.isArray(links) ? links.length : 0
        timelineEvents.push({
          id: `links-${a.id}`,
          type: 'links',
          timestamp: a.created_at,
          title: 'Links Sugeridos Adicionados',
          description:
            count > 0
              ? `${count} link${count !== 1 ? 's' : ''} sugerido${count !== 1 ? 's' : ''}`
              : 'Links atualizados',
        })
      })

      matches.forEach((m: any) => {
        const p = m.imoveis_captados
        const label = p?.endereco || p?.localizacao_texto || p?.codigo_imovel || 'Imóvel'
        timelineEvents.push({
          id: `match-${m.id}`,
          type: 'match',
          timestamp: m.created_at,
          title: 'Imóvel Vinculado',
          description: label,
        })
      })

      visits.forEach((v: any) => {
        timelineEvents.push({
          id: `visit-${v.id}`,
          type: 'visit',
          timestamp: v.visited_at,
          title: 'Visita Registrada',
          description: v.notes || 'Visita ao imóvel.',
        })
      })

      respostasRef.current.forEach((r: any) => {
        const isNF = r.resposta === 'nao_encontrei' || r.resposta === 'perdido'
        timelineEvents.push({
          id: `resp-${r.id}`,
          type: 'response',
          timestamp: r.created_at,
          title: isNF ? 'Não Encontrado' : 'Resposta',
          description: r.motivo || r.observacao || r.resposta,
        })
      })

      statusLogs.forEach((s: any) => {
        timelineEvents.push({
          id: `status-${s.id}`,
          type: 'status_change',
          timestamp: s.created_at,
          title: 'Status Alterado',
          description: `${s.status_anterior || '—'} → ${s.status_novo}`,
        })
      })

      timelineEvents.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      setEvents(timelineEvents)
    } catch (err) {
      console.error('[Timeline] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [demand.id, demand.created_at, demand.is_prioritaria])

  useEffect(() => {
    fetchTimeline()
  }, [fetchTimeline])

  useEffect(() => {
    if (!demand.id) return
    const channel = supabase
      .channel(`timeline_${demand.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'visit_records' }, () =>
        fetchTimeline(),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imovel_demand_match' }, () =>
        fetchTimeline(),
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'demand_status_log' },
        () => fetchTimeline(),
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, () =>
        fetchTimeline(),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          supabase.rpc('log_realtime_error', {
            p_channel_name: `timeline_${demand.id}`,
            p_error_message: 'Channel error in demand timeline',
          })
        }
      })
    return () => {
      supabase.removeChannel(channel)
    }
  }, [demand.id, fetchTimeline])

  return { events, loading, refresh: fetchTimeline }
}
