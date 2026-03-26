import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

type VisualState = 'hidden' | 'reconnecting' | 'disconnected' | 'recovered'

export const ConnectionStatus: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [visualState, setVisualState] = useState<VisualState>('hidden')
  const [disconnectedSince, setDisconnectedSince] = useState<number | null>(null)

  const location = useLocation()
  const isOnlineRef = useRef(isOnline)
  isOnlineRef.current = isOnline

  const checkRealConnection = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const { error } = await supabase
        .from('users')
        .select('id')
        .limit(1)
        .abortSignal(controller.signal)

      clearTimeout(timeoutId)

      if (
        error &&
        (error.message.includes('fetch') ||
          error.message.includes('abort') ||
          error.message.includes('network') ||
          error.message.includes('Failed'))
      ) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  useEffect(() => {
    let debounceTimer: NodeJS.Timeout

    const handleOnline = () => {
      clearTimeout(debounceTimer)
      if (!isOnlineRef.current) {
        setIsOnline(true)
        setDisconnectedSince(null)
      }
    }

    const handleOffline = () => {
      // Ignorar se a aba estiver em background/suspensa
      if (document.visibilityState === 'hidden') return

      // Aplicar um debounce agressivo (8s) para ignorar oscilações rápidas (flapping)
      debounceTimer = setTimeout(async () => {
        // Silent Ping para dupla verificação de conectividade real com servidor
        const isReallyOnline = await checkRealConnection()

        if (isReallyOnline) {
          handleOnline()
        } else {
          setIsOnline(false)
          setDisconnectedSince(Date.now())
        }
      }, 8000)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && !isOnlineRef.current) {
        // Ao restaurar a aba que estava suspensa e offline, testar o ping
        const isReallyOnline = await checkRealConnection()
        if (isReallyOnline) {
          handleOnline()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      clearTimeout(debounceTimer)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (!isOnline) {
      const start = disconnectedSince || Date.now()

      // Ajuste de tolerância severo para evitar alertas visuais desnecessários
      // Para as rotas de maior uso (/app ou /), elevamos bastante a tolerância de falha
      const isLoginOrHome = location.pathname === '/' || location.pathname === '/app'
      const reconnectingTolerance = isLoginOrHome ? 25000 : 15000
      const disconnectedTolerance = isLoginOrHome ? 45000 : 30000

      const checkState = () => {
        const elapsed = Date.now() - start

        if (elapsed >= disconnectedTolerance) {
          setVisualState((prev) => (prev !== 'disconnected' ? 'disconnected' : prev))
        } else if (elapsed >= reconnectingTolerance) {
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
  }, [isOnline, disconnectedSince, location.pathname])

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
