import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'

export interface Notificacao {
  id: string
  usuario_id: string
  tipo: 'nova_demanda' | 'novo_imovel' | 'imovel_capturado' | 'status_atualizado'
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
    } catch (e) {}
  }, [currentUser, fetchWithResilience])

  useEffect(() => {
    fetchNotificacoes()
  }, [fetchNotificacoes])

  useConsolidatedSync({
    channelName: 'notificacoes_changes',
    setupRealtime: (channel) => {
      if (!currentUser) return
      channel
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `usuario_id=eq.${currentUser.id}`,
          },
          (payload) => {
            setNotificacoes((prev) => [payload.new as Notificacao, ...prev].slice(0, 50))
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

  return { notificacoes, markAsRead, markAllAsRead }
}
