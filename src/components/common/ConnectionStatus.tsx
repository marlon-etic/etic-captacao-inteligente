import React, { useEffect, useState } from 'react'
import { useSmartSync } from '@/hooks/useSmartSync'

type VisualState = 'hidden' | 'reconnecting' | 'disconnected' | 'recovered'

export const ConnectionStatus: React.FC = () => {
  const { isOnline, disconnectedSince, circuitBreakerActive } = useSmartSync()
  const [visualState, setVisualState] = useState<VisualState>('hidden')

  const isCurrentlyDisconnected = !isOnline || circuitBreakerActive

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isCurrentlyDisconnected) {
      const start = disconnectedSince || Date.now()

      const checkState = () => {
        const elapsed = Date.now() - start
        if (elapsed >= 15000) {
          setVisualState((prev) => (prev !== 'disconnected' ? 'disconnected' : prev))
        } else if (elapsed >= 8000) {
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
  }, [isCurrentlyDisconnected, disconnectedSince])

  useEffect(() => {
    let timeout: NodeJS.Timeout
    if (visualState === 'recovered') {
      timeout = setTimeout(() => {
        setVisualState('hidden')
      }, 2500)
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
        <span className="text-sm font-bold">Conectado</span>
      </div>
    )
  }

  if (visualState === 'disconnected') {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md z-[9999] animate-in slide-in-from-bottom-4 duration-300">
        <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">Sem conexão</span>
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
