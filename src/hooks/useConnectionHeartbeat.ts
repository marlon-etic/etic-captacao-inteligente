import { useEffect } from 'react'

export const useConnectionHeartbeat = () => {
  useEffect(() => {
    // O Supabase já gerencia o heartbeat do websocket nativamente
    // Esta função foi simplificada e esvaziada para evitar tráfego e falsos positivos de desconexão (PROMPT-057)
  }, [])
}
