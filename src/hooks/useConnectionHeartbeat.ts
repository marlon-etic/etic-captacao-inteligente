import { useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

export const useConnectionHeartbeat = () => {
  useEffect(() => {
    let mounted = true
    let intervalId: NodeJS.Timeout

    const checkConnection = async () => {
      try {
        // Safe SELECT limit(1) to avoid HEAD empty JSON parse error
        const { error } = await supabase.from('users').select('id').limit(1)

        if (error) {
          console.warn('[Heartbeat] Erro na conexão:', error.message)
        }
      } catch (err) {
        console.warn('[Heartbeat] Falha na requisição de conexão:', err)
      }
    }

    if (mounted) {
      checkConnection()
    }

    intervalId = setInterval(checkConnection, 60000)

    return () => {
      mounted = false
      clearInterval(intervalId)
    }
  }, [])
}
