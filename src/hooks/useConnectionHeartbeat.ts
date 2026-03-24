import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export const useConnectionHeartbeat = () => {
  const missedBeats = useRef(0)
  const lastBeatTime = useRef(Date.now())

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    // Canal dedicado e persistente para keep-alive do WebSockets
    const channel = supabase.channel('system_keepalive', {
      config: { broadcast: { ack: true } }, // Confirmação rigorosa do ping
    })

    channel.subscribe((status) => {
      if (import.meta.env.VITE_DEBUG_MODE) {
        if (status !== 'SUBSCRIBED') {
          console.log(
            `[Diagnostic - Heartbeat Channel] Status: ${status} às ${new Date().toLocaleTimeString()}`,
          )
        } else {
          console.log(
            `[Diagnostic - Reconnection] Reconexão ou conexão inicial estabelecida às: ${new Date().toLocaleTimeString()}`,
          )
        }
      }
    })

    const beat = async () => {
      if (!mounted) return

      if (!navigator.onLine) {
        // Suspende atividade inútil durante offline reportado
        timeoutId = setTimeout(beat, 20000)
        return
      }

      const now = Date.now()
      if (import.meta.env.VITE_DEBUG_MODE) {
        const diff = now - lastBeatTime.current
        console.log(
          `[Diagnostic - Heartbeat] Disparado às ${new Date(now).toLocaleTimeString()} (Intervalo: ${diff}ms)`,
        )
      }
      lastBeatTime.current = now

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
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.log(`[Diagnostic - Heartbeat] ACK recebido em ${Date.now() - start}ms`)
          }
        } else {
          // Fallback silencioso via query REST se WebSocket não estiver montado
          const controller = new AbortController()
          const tid = setTimeout(() => controller.abort(), 5000)

          const start = Date.now()
          const { error } = await supabase
            .from('users')
            .select('id')
            .limit(1)
            .abortSignal(controller.signal)

          clearTimeout(tid)
          if (error) throw error
          missedBeats.current = 0

          if (import.meta.env.VITE_DEBUG_MODE) {
            console.log(`[Diagnostic - Heartbeat Fallback] Resposta em ${Date.now() - start}ms`)
          }
        }
      } catch (err: any) {
        missedBeats.current += 1
        if (import.meta.env.VITE_DEBUG_MODE) {
          console.warn(
            `[Diagnostic - Heartbeat] Falhou (${missedBeats.current}/2):`,
            err.message,
            `às ${new Date().toLocaleTimeString()}`,
          )
        }

        if (missedBeats.current >= 2) {
          if (import.meta.env.VITE_DEBUG_MODE) {
            console.error(
              `[Diagnostic - Reconnection] 2 falhas consecutivas. Forçando reconexão imediata do Realtime às ${new Date().toLocaleTimeString()}`,
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

    // Offset inicial para o heartbeat não chocar com loads iniciais do app
    timeoutId = setTimeout(beat, 5000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [])
}
