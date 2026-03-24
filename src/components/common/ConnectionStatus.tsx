import React, { useEffect, useState } from 'react'
import { useSmartSync } from '@/hooks/useSmartSync'

type VisualState = 'hidden' | 'reconnecting' | 'disconnected' | 'recovered'

export const ConnectionStatus: React.FC = () => {
  const { isOnline, disconnectedSince, circuitBreakerActive } = useSmartSync()
  const [visualState, setVisualState] = useState<VisualState>('hidden')

  // Se o navegador está offline OU o disjuntor ativou por falhas repetidas
  const isCurrentlyDisconnected = !isOnline || circuitBreakerActive

  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isCurrentlyDisconnected) {
      const start = disconnectedSince || Date.now()

      const checkState = () => {
        const elapsed = Date.now() - start
        if (elapsed >= 15000) {
          // Desconexão crítica (>15s)
          setVisualState((prev) => (prev !== 'disconnected' ? 'disconnected' : prev))
        } else if (elapsed >= 5000) {
          // Reconexão ativa (5s - 15s)
          setVisualState((prev) => (prev !== 'reconnecting' ? 'reconnecting' : prev))
        } else {
          // Oscilação momentânea (<5s), mantém silencioso
          setVisualState((prev) => (prev !== 'hidden' ? 'hidden' : prev))
        }
      }

      checkState() // Checa imediatamente
      interval = setInterval(checkState, 1000)
    } else {
      // Quando reconecta, atualiza o estado imediatamente sem delay
      setVisualState((prev) => {
        if (prev === 'reconnecting' || prev === 'disconnected') {
          // Só mostra o indicador verde de "Recuperado" se o usuário chegou a ver um alerta
          return 'recovered'
        }
        return 'hidden'
      })
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isCurrentlyDisconnected, disconnectedSince])

  // Lógica separada para remover o aviso verde após 2.5s
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

  // Logging de diagnóstico para Dev Mode
  useEffect(() => {
    if (import.meta.env.VITE_DEBUG_MODE) {
      console.log(
        `[Diagnostic - ConnectionStatus] Status visual alterado para: ${visualState} às ${new Date().toLocaleTimeString()}`,
      )
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
