import React, { ReactNode, useState, useCallback, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface SyncErrorBoundaryProps {
  children: ReactNode
  onRetry?: () => void
  retryCount?: number
  toggleRealtime?: () => void
  isRealtimeEnabled?: boolean
  error?: Error | null
}

export const SyncErrorBoundary: React.FC<SyncErrorBoundaryProps> = ({
  children,
  onRetry,
  retryCount = 0,
  error: externalError,
}) => {
  const [internalError, setInternalError] = useState<Error | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const activeError = externalError || internalError

  useEffect(() => {
    setInternalError(externalError || null)
  }, [externalError])

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason instanceof Error ? event.reason : new Error(String(event.reason))
      console.groupCollapsed(
        '%c🚨 EXTENSION CHANNEL ERROR - Desabilite extensões de terceiros!',
        'color: red; font-size: 14px; font-weight: bold',
      )
      console.error('Full Reason:', reason)
      console.trace('Full Stack:')
      console.log('Dica: Teste em modo anônimo (Ctrl+Shift+N) sem extensions.')
      console.groupEnd()
      event.preventDefault()
      setInternalError(reason)
    }

    window.addEventListener('unhandledrejection', handleRejection, true)
    return () => window.removeEventListener('unhandledrejection', handleRejection, true)
  }, [])

  const handleRetry = useCallback(async () => {
    setIsRetrying(true)
    try {
      if (onRetry) {
        const result = onRetry()
        if (result instanceof Promise) {
          await result
        }
      }
      setInternalError(null)
    } catch (err) {
      setInternalError(err instanceof Error ? err : new Error(String(err)))
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry])

  if (activeError) {
    return (
      <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg shadow-sm space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-900">
              Erro de Canal (Extension Interference) - Tentativa #{retryCount + 1}
            </p>
            <p className="text-sm font-medium text-red-800 mt-1">{activeError.message}</p>
            <div className="mt-3 bg-red-100/50 p-3 rounded border border-red-200 text-xs text-red-800 space-y-2">
              <p>
                <strong>Causa Provável:</strong> Extensões do navegador interceptando/quebrando
                requisições assíncronas do aplicativo (Message Channel Closed).
              </p>
              <p>
                <strong>Solução Imediata:</strong> Abra em modo anônimo (Ctrl+Shift+N) ou desabilite
                extensões ativas no momento (como Vibe Coding, AdBlocks, etc).
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={isRetrying ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
          {isRetrying ? 'Atualizando...' : 'Forçar Atualização (Polling)'}
        </button>
      </div>
    )
  }

  return <>{children}</>
}
