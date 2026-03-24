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

  const handleRetry = useCallback(async () => {
    console.log(`[UI-ERROR] Tentativa de retry manual #${retryCount + 1}`)
    setIsRetrying(true)
    try {
      onRetry?.()
      setInternalError(null)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    } catch (err) {
      const newErr = err instanceof Error ? err : new Error('Erro desconhecido no retry')
      console.error('[UI-ERROR] Retry falhou:', newErr)
      setInternalError(newErr)
    } finally {
      setIsRetrying(false)
    }
  }, [onRetry, retryCount])

  if (activeError) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-200 rounded-lg shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-red-900">
              Erro ao sincronizar dados (Tentativa {retryCount})
            </p>
            <p className="text-xs font-medium text-red-700 mt-1 break-words">
              {activeError.message}
            </p>
            <p className="text-xs font-bold text-red-600 mt-1">
              Verifique o console (F12) para logs detalhados.
            </p>
          </div>
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white font-bold rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            {isRetrying ? 'Tentando...' : 'Tentar Novamente'}
          </button>
        </div>
        <div className="opacity-50 pointer-events-none grayscale transition-all duration-300">
          {children}
        </div>
      </div>
    )
  }

  return <>{children}</>
}
