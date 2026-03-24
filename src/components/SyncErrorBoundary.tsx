import React, { ReactNode, useState, useCallback, useEffect } from 'react'
import { AlertCircle, RefreshCw, ToggleRight, ToggleLeft } from 'lucide-react'

interface SyncErrorBoundaryProps {
  children: ReactNode
  onRetry?: () => void
  toggleRealtime?: () => void
  isRealtimeEnabled?: boolean
  retryCount?: number
  error?: Error | null
}

export const SyncErrorBoundary: React.FC<SyncErrorBoundaryProps> = ({
  children,
  onRetry,
  toggleRealtime,
  isRealtimeEnabled,
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
      console.group('GLOBAL CHANNEL ERROR')
      console.error('Reason:', event.reason)
      console.trace('Stack:')
      console.groupEnd()
      event.preventDefault() // Previne default browser popup
      setInternalError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
      )
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
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (err) {
      setInternalError(err instanceof Error ? err : new Error('Retry failed: ' + String(err)))
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry])

  if (activeError) {
    return (
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-red-900 truncate">
                Erro de Canal/Sincronização (#{retryCount + 1})
              </p>
              <p className="text-sm font-medium text-red-700 mt-1 break-words">
                {activeError.message}
              </p>
              {activeError.stack && (
                <pre className="text-[10px] text-red-600 mt-2 overflow-auto max-h-24 bg-red-100/50 p-2 rounded border border-red-200">
                  {activeError.stack.slice(0, 500)}...
                </pre>
              )}
              <p className="text-xs font-medium text-red-600 mt-2">
                Dica: Teste em modo anônimo (sem extensions) para isolar erros externos.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white font-bold rounded text-xs hover:bg-red-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <RefreshCw className={isRetrying ? 'animate-spin w-3.5 h-3.5' : 'w-3.5 h-3.5'} />
              {isRetrying ? 'Retry...' : 'Reconectar'}
            </button>
            {toggleRealtime && (
              <button
                onClick={toggleRealtime}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1A3A52] text-white font-bold rounded text-xs hover:bg-[#1A3A52]/90 transition-colors shadow-sm"
              >
                {isRealtimeEnabled ? (
                  <ToggleRight className="w-4 h-4" />
                ) : (
                  <ToggleLeft className="w-4 h-4" />
                )}
                Realtime: {isRealtimeEnabled ? 'ON' : 'OFF'}
              </button>
            )}
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
