import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export const useConnectionHeartbeat = () => {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    heartbeatRef.current = setInterval(async () => {
      try {
        const { error } = await Promise.race([
          supabase.from('users').select('id', { count: 'exact', head: true }).limit(1),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Heartbeat timeout')), 5000),
          ),
        ])

        if (error) {
          console.warn('❌ Heartbeat falhou:', error.message || error)
        } else {
          console.log('💓 Heartbeat OK')
        }
      } catch (err) {
        console.error('Heartbeat error:', err)
      }
    }, 10000)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [])
}
