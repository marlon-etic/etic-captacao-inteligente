import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

export const useConnectionHeartbeat = () => {
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Heartbeat a cada 10 segundos
    heartbeatRef.current = setInterval(async () => {
      try {
        // FIX: Usando GET (.select('id').limit(1)) ao invés de HEAD ({ head: true })
        // para evitar erro de runtime "Unexpected end of JSON input" ao fazer parse de resposta vazia.
        const { error } = await Promise.race([
          supabase.from('users').select('id').limit(1),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error('Heartbeat timeout')), 5000),
          ),
        ])

        if (error) {
          console.warn('❌ Heartbeat falhou:', error.message)
        }
      } catch (err) {
        console.warn('Heartbeat error:', err)
      }
    }, 10000)

    return () => {
      if (heartbeatRef.current) {
        clearInterval(heartbeatRef.current)
      }
    }
  }, [])
}
