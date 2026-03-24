import React, { ReactNode, useState, useCallback, useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface SyncErrorBoundaryProps {
  children: ReactNode
  onRetry?: () => void
  error?: Error | null
  retryCount?: number
}

export const SyncErrorBoundary: React.FC<SyncErrorBoundaryProps> = ({
  children,
  onRetry,
  error: externalError,
  retryCount = 0,
}) => {
  const [internalError, setInternalError] = useState<Error | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)

  const activeError = externalError || internalError

  useEffect(() => {
    setInternalError(externalError || null)
  }, [externalError])

  // Captura global de unhandled promise rejections (fix channel closed)
  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('[GLOBAL] Unhandled Rejection (Channel Closed?):', event.reason)
      event.preventDefault() // Previne default browser popup
      setInternalError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      )
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  const handleRetry = useCallback(async () => {
    console.log(`[UI] Retry #${retryCount + 1} - Capturando async errors`)
    setIsRetrying(true)
    try {
      if (onRetry) {
        const result = onRetry()
        if (result instanceof Promise) {
          await result
        }
      }
      setInternalError(null)
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Espera extra para dar tempo aos websockets
    } catch (err) {
      const newErr = err instanceof Error ? err : new Error('Retry failed: ' + String(err))
      console.error('[UI] Retry erro com stack:', newErr.stack)
      setInternalError(newErr)
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, retryCount])

  if (activeError) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-3 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-red-900 truncate">
                Erro de Sincronização (Tentativa {retryCount + 1})
              </p>
              <p className="text-xs font-medium text-red-700 mt-1 break-words">
                {activeError.message}
              </p>
              {activeError.stack && (
                <pre className="text-xs text-red-600 mt-2 overflow-auto max-h-24 bg-red-100 p-2 rounded border border-red-200">
                  {activeError.stack.slice(0, 500)}...
                </pre>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="self-start flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Processando...' : 'Tentar Reconectar'}
            </button>
            <p className="text-xs font-medium text-red-600">
              Dica: Verifique F12 &gt; Console para logs [Realtime] e desabilite extensions
              temporariamente.
            </p>
          </div>
        </div>
        <div className="opacity-50 pointer-events-none grayscale transition-all duration-300">
          {children}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
