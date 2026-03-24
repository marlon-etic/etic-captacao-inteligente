import React, { useEffect, useState } from 'react'
import { useSmartSync } from '@/hooks/useSmartSync'

export const ConnectionStatus: React.FC = () => {
  const { isOnline, disconnectedSince, circuitBreakerActive } = useSmartSync()
  const [showIndicator, setShowIndicator] = useState(false)

  useEffect(() => {
    let timeout: NodeJS.Timeout

    if (!isOnline || circuitBreakerActive) {
      const start = disconnectedSince || Date.now()
      const elapsed = Date.now() - start

      if (elapsed >= 10000) {
        setShowIndicator(true)
      } else {
        timeout = setTimeout(() => {
          setShowIndicator(true)
        }, 10000 - elapsed)
      }
    } else {
      if (showIndicator) {
        const hideTimeout = setTimeout(() => setShowIndicator(false), 3000)
        return () => clearTimeout(hideTimeout)
      }
    }

    return () => clearTimeout(timeout)
  }, [isOnline, disconnectedSince, circuitBreakerActive, showIndicator])

  if (!showIndicator) return null

  if (isOnline && !circuitBreakerActive) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md z-[9999] transition-opacity duration-300">
        <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">Conectado</span>
      </div>
    )
  }

  if (!isOnline) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md z-[9999] transition-opacity duration-300">
        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">Sem conexão de internet</span>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-md z-[9999] transition-opacity duration-300">
      <div className="w-2.5 h-2.5 bg-yellow-600 rounded-full animate-pulse"></div>
      <span className="text-sm font-bold">Servidor indisponível. Reconectando...</span>
    </div>
  )
}
