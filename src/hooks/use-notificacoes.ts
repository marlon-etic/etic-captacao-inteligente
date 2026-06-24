import { useEffect, useState, useCallback, createElement } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'
import { toast } from '@/components/ui/use-toast'

export interface Notificacao {
  id: string
  usuario_id: string
  tipo:
    | 'nova_demanda'
    | 'novo_imovel'
    | 'imovel_capturado'
    | 'status_atualizado'
    | 'busca_iniciada_outros'
    | 'busca_iniciada_responsavel'
    | 'busca_iniciada_admin'
    | 'visita_registrada'
    | 'feedback_registrado'
    | 'negociacao_registrada'
  titulo: string
  mensagem: string
  dados_relacionados: any
  lido: boolean
  prioridade: 'alta' | 'normal' | 'baixa'
  created_at: string
}

export function useNotificacoes() {
  const { currentUser } = useAppStore()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const { fetchWithResilience, enqueueMutation } = useSmartSync()

  const fetchNotificacoes = useCallback(async () => {
    if (!currentUser) return
    try {
      const data = await fetchWithResilience(`notificacoes_${currentUser.id}`, async () => {
        const { data: resData, error } = await supabase
          .from('notificacoes')
          .select('*')
          .eq('usuario_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(50)
        if (error) throw error
        return resData
      })
      if (data) {
        setNotificacoes(data as Notificacao[])
      }
    } catch (e) {
      console.error('[useNotificacoes] Erro ao buscar notificações:', e)
    }
  }, [currentUser, fetchWithResilience])

  useEffect(() => {
    fetchNotificacoes()
  }, [fetchNotificacoes])

  useConsolidatedSync({
    channelName: 'notificacoes_changes',
    setupRealtime: (channel) => {
      if (!currentUser)
        return channel
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'notificacoes',
              filter: `usuario_id=eq.${currentUser.id}`,
            },
            (payload) => {
              const newNotif = payload.new as Notificacao
              setNotificacoes((prev) => [newNotif, ...prev].slice(0, 50))
              if (typeof window !== 'undefined') {
                const demandaId = newNotif.dados_relacionados?.demanda_id
                toast({
                  title: newNotif.titulo,
                  description: newNotif.mensagem,
                  duration: 5000,
                  action: demandaId
                    ? createElement(
                        'button',
                        {
                          onClick: () => {
                            console.log(`[NOTIFICACAO] Redirecionando para demanda: ${demandaId}`)
                            supabase
                              .from('notificacoes')
                              .update({ lido: true })
                              .eq('id', newNotif.id)
                              .then()
                            window.dispatchEvent(
                              new CustomEvent('navigate-to', {
                                detail: `/app/buscar-imoveis?demanda_id=${demandaId}`,
                              }),
                            )
                          },
                          className:
                            'px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-bold transition-colors',
                        },
                        'Ver Demanda',
                      )
                    : undefined,
                })
              }
            },
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'notificacoes',
              filter: `usuario_id=eq.${currentUser.id}`,
            },
            (payload) => {
              setNotificacoes((prev) =>
                prev.map((n) => (n.id === payload.new.id ? (payload.new as Notificacao) : n)),
              )
            },
          )
    },
    onFallbackPoll: fetchNotificacoes,
  })

  const markAsRead = async (id: string) => {
    enqueueMutation(async () => {
      await supabase.from('notificacoes').update({ lido: true }).eq('id', id)
    })
    setNotificacoes((prev) => prev.map((n) => (n.id === id ? { ...n, lido: true } : n)))
  }

  const markAllAsRead = async () => {
    if (!currentUser) return
    enqueueMutation(async () => {
      await supabase
        .from('notificacoes')
        .update({ lido: true })
        .eq('usuario_id', currentUser.id)
        .eq('lido', false)
    })
    setNotificacoes((prev) => prev.map((n) => ({ ...n, lido: true })))
  }

  const handleNotificationClick = async (notif: Notificacao, navigate: (path: string) => void) => {
    await markAsRead(notif.id)
    if (
      notif.tipo === 'nova_demanda' ||
      notif.tipo === 'busca_iniciada_admin' ||
      notif.tipo === 'busca_iniciada_outros' ||
      notif.tipo === 'busca_iniciada_responsavel'
    ) {
      const demandaId = notif.dados_relacionados?.demanda_id
      if (demandaId) {
        console.log(`[NOTIFICACAO] Redirecionando para demanda: ${demandaId}`)
        navigate(`/app/buscar-imoveis?demanda_id=${demandaId}`)
      }
    } else if (
      notif.tipo === 'novo_imovel' ||
      notif.tipo === 'imovel_capturado' ||
      notif.tipo === 'status_atualizado' ||
      notif.tipo === 'visita_registrada' ||
      notif.tipo === 'feedback_registrado' ||
      notif.tipo === 'negociacao_registrada'
    ) {
      const imovelId = notif.dados_relacionados?.imovel_id
      if (imovelId) {
        console.log(`[NOTIFICACAO] Redirecionando para imovel: ${imovelId}`)
        navigate(`/app/buscar-imoveis?imovel_id=${imovelId}&modal=aberto`)
      } else if (notif.dados_relacionados?.demanda_id) {
        console.log(
          `[NOTIFICACAO] Redirecionando para demanda a partir de status: ${notif.dados_relacionados.demanda_id}`,
        )
        navigate(`/app/buscar-imoveis?demanda_id=${notif.dados_relacionados.demanda_id}`)
      }
    }
  }

  return { notificacoes, markAsRead, markAllAsRead, handleNotificationClick }
}
