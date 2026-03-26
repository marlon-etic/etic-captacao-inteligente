import React, { useEffect, useState } from 'react'

type VisualState = 'hidden' | 'reconnecting' | 'disconnected' | 'recovered'

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [visualState, setVisualState] = useState<VisualState>('hidden')
  const [disconnectedSince, setDisconnectedSince] = useState<number | null>(null)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setDisconnectedSince(null)
    }
    const handleOffline = () => {
      setIsOnline(false)
      setDisconnectedSince(Date.now())
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (!isOnline) {
      const start = disconnectedSince || Date.now()

      const checkState = () => {
        const elapsed = Date.now() - start
        // Aumentado a tolerância visual para evitar avisos curtos (flapping)
        if (elapsed >= 15000) {
          setVisualState((prev) => (prev !== 'disconnected' ? 'disconnected' : prev))
        } else if (elapsed >= 5000) {
          setVisualState((prev) => (prev !== 'reconnecting' ? 'reconnecting' : prev))
        } else {
          setVisualState((prev) => (prev !== 'hidden' ? 'hidden' : prev))
        }
      }

      checkState()
      interval = setInterval(checkState, 1000)
    } else {
      setVisualState((prev) => {
        if (prev === 'reconnecting' || prev === 'disconnected') {
          return 'recovered'
        }
        return 'hidden'
      })
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isOnline, disconnectedSince])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (visualState === 'recovered') {
      timeout = setTimeout(() => {
        setVisualState('hidden')
      }, 3000)
    }
    return () => {
      if (timeout) clearTimeout(timeout)
    }
  }, [visualState])

  if (visualState === 'hidden') return null

  if (visualState === 'recovered') {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md z-[9999] animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">Conexão restaurada</span>
      </div>
    )
  }

  if (visualState === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md z-[9999] animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">Sem conexão com a internet</span>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg shadow-md z-[9999] animate-in slide-in-from-bottom-4 duration-300">
      <div className="w-2.5 h-2.5 bg-yellow-600 rounded-full animate-pulse"></div>
      <span className="text-sm font-bold">Reconectando...</span>
    </div>
  )
}
