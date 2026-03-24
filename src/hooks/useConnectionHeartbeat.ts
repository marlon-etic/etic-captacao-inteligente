import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export const useConnectionHeartbeat = () => {
  const missedBeats = useRef(0)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Canal dedicado e persistente para keep-alive do WebSockets
    const channel = supabase.channel('system_keepalive', {
      config: { broadcast: { ack: true } }, // Confirmação rigorosa do ping
    })

    channel.subscribe((status) => {
      if (import.meta.env.VITE_DEBUG_MODE && status !== 'SUBSCRIBED') {
        console.log(`[Heartbeat] Channel status: ${status}`)
      }
    })

    const beat = async () => {
      if (!mounted) return

      if (!navigator.onLine) {
        // Suspende atividade inútil durante offline reportado
        timeoutId = setTimeout(beat, 20000)
        return
      }

      // Jitter aleatório (±2s) para evitar colisão de pacotes (Heartbeat ao redor de 20s)
      const jitter = Math.floor(Math.random() * 4000) - 2000
      const nextBeat = 20000 + jitter

      try {
        if (channel.state === 'joined') {
          const start = Date.now()

          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Heartbeat ack timeout > 5s')), 5000),
          )

          const sendPromise = channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: { ts: start },
          })

          const res = await Promise.race([sendPromise, timeoutPromise])

          if (res !== 'ok') {
            throw new Error('Heartbeat não recebido (Not acknowledged)')
          }

          missedBeats.current = 0
        } else {
          // Fallback silencioso via query REST se WebSocket não estiver montado
          const controller = new AbortController()
          const tid = setTimeout(() => controller.abort(), 5000)

          const { error } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .abortSignal(controller.signal)

          clearTimeout(tid)
          if (error) throw error
          missedBeats.current = 0
        }
      } catch (err: any) {
        missedBeats.current += 1
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.warn(`[Heartbeat] Falhou (${missedBeats.current}/2):`, err.message)
        }

        if (missedBeats.current >= 2) {
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.error(
              '[Heartbeat] 2 falhas consecutivas. Forçando reconexão imediata do Realtime...',
            )
          }
          // Reinicia rigorosamente todo o engine Realtime para limpar falhas e recuperar WebSockets mortos
          supabase.realtime.disconnect()
          setTimeout(() => {
            if (mounted) supabase.realtime.connect()
          }, 1000)
          missedBeats.current = 0
        }
      }

      if (mounted) {
        timeoutId = setTimeout(beat, nextBeat)
      }
    }

    // Aguarda startup do app e aciona primeiro ciclo
    timeoutId = setTimeout(beat, 20000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [])
}
