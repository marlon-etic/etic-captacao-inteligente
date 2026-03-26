import React, { useEffect } from 'react'

interface ConnectionStatusProps {
  isConnected?: boolean
  error?: Error | string | null
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = () => {
  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_MODE === 'true') {
      const handleOffline = () => console.log('[Network] Browser reported offline state')
      const handleOnline = () => console.log('[Network] Browser reported online state')

      window.addEventListener('offline', handleOffline)
      window.addEventListener('online', handleOnline)

      return () => {
        window.removeEventListener('offline', handleOffline)
        window.removeEventListener('online', handleOnline)
      }
    }
  }, [])

  // Operação Zero-Noise Connection (PROMPT-059):
  // O componente visual de aviso foi completamente desativado.
  // Qualquer interrupção de rede irá falhar silenciosamente no background
  // (via useSmartSync) sem bloquear a interface ou exibir tarjas de erro.
  return null
}
