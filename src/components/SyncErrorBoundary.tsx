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

      // Do not break the UI if it's the known extension interference error
      if (
        reason.message.includes('channel closed') ||
        reason.message.includes('asynchronous response')
      ) {
        event.preventDefault()
        return // Silently handled by useRealtimeSync global listener
      }

      setInternalError(reason)
    }

    window.addEventListener('unhandledrejection', handleRejection)
    return () => window.removeEventListener('unhandledrejection', handleRejection)
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
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm space-y-4 mb-6 animate-fade-in">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-900">Falha de Conexão - Tentativa #{retryCount + 1}</p>
            <p className="text-sm font-medium text-red-800 mt-1">{activeError.message}</p>
          </div>
        </div>
        <button
          onClick={handleRetry}
          disabled={isRetrying}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
        >
          <RefreshCw className={isRetrying ? 'animate-spin w-4 h-4' : 'w-4 h-4'} />
          {isRetrying ? 'Sincronizando...' : 'Forçar Atualização'}
        </button>
      </div>
    )
  }

  return <>{children}</>
}
