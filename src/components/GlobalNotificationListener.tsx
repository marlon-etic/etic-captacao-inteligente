import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import useAppStore from '@/stores/useAppStore'
import { useNotification } from '@/hooks/useNotification'

export function GlobalNotificationListener() {
  const { currentUser } = useAppStore()
  const { showNotification } = useNotification()
  const currentUserRef = useRef(currentUser)

  useEffect(() => {
    currentUserRef.current = currentUser
  }, [currentUser])

  const playSound = useCallback(() => {
    if (currentUserRef.current?.preferences?.notifications?.channels?.in_app !== false) {
      try {
        const audio = new Audio('/notification.mp3')
        audio.volume = 0.5
        audio.play().catch(() => {})
      } catch (e) {}
    }
  }, [])

  useEffect(() => {
    let mounted = true
    if (!currentUser) return

    const channel = supabase
      .channel('global_toast_notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notificacoes',
          filter: `usuario_id=eq.${currentUser.id}`,
        },
        (payload) => {
          if (!mounted) return
          const notif = payload.new

          let customColor = ''
          if (notif.prioridade === 'alta') customColor = 'bg-[#EF4444] text-white'
          else if (notif.prioridade === 'baixa') customColor = 'bg-[#6B7280] text-white'
          else customColor = 'bg-[#3B82F6] text-white'

          showNotification({
            type: notif.prioridade === 'alta' ? 'error' : 'info',
            title: notif.titulo,
            message: notif.mensagem,
            customColor,
            onClickAction: () => {
              const data = notif.dados_relacionados
              if (data?.demanda_id) {
                window.dispatchEvent(
                  new CustomEvent('navigate-to', { detail: `/app/demandas?id=${data.demanda_id}` }),
                )
              } else if (data?.imovel_id) {
                window.dispatchEvent(
                  new CustomEvent('navigate-to', { detail: `/app/disponivel-geral` }),
                )
              }
            },
          })
          playSound()
        },
      )
      .subscribe()

    return () => {
      mounted = false
      supabase.removeChannel(channel)
    }
  }, [currentUser, showNotification, playSound])

  return null
}
