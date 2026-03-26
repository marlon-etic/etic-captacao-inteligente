import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export const useConnectionHeartbeat = () => {
  const missedBeats = useRef(0)

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout

    const channel = supabase.channel('system_keepalive', {
      config: { broadcast: { ack: true } },
    })

    channel.subscribe()

    const beat = async () => {
      if (!mounted) return

      if (!navigator.onLine) {
        timeoutId = setTimeout(beat, 30000)
        return
      }

      const jitter = Math.floor(Math.random() * 4000) - 2000
      const nextBeat = 30000 + jitter

      try {
        if (channel.state === 'joined') {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('timeout')), 5000),
          )

          const sendPromise = channel.send({
            type: 'broadcast',
            event: 'ping',
            payload: { ts: Date.now() },
          })

          const res = await Promise.race([sendPromise, timeoutPromise])

          if (res !== 'ok') {
            throw new Error('Not acknowledged')
          }

          missedBeats.current = 0
        } else {
          missedBeats.current = 0
        }
      } catch (err: any) {
        missedBeats.current += 1
        if (missedBeats.current >= 3) {
          missedBeats.current = 0
        }
      }

      if (mounted) {
        timeoutId = setTimeout(beat, nextBeat)
      }
    }

    timeoutId = setTimeout(beat, 10000)

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      supabase.removeChannel(channel)
    }
  }, [])
}
