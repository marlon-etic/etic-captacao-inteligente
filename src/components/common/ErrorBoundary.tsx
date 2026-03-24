import React, { Component, ReactNode } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorCount: number
}

export class ErrorBoundary extends Component<Props, State> {
  private resetTimer: NodeJS.Timeout | null = null

  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)

    this.setState((prev) => {
      const newCount = prev.errorCount + 1

      // Limit auto-recovery to avoid infinite reload loops
      if (newCount <= 3) {
        if (this.resetTimer) clearTimeout(this.resetTimer)
        this.resetTimer = setTimeout(() => {
          this.resetError()
        }, 5000)
      }

      return { errorCount: newCount }
    })
  }

  componentWillUnmount() {
    if (this.resetTimer) clearTimeout(this.resetTimer)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-lg max-w-md w-full text-center border-t-4 border-red-500">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-2">Erro ao Carregar</h2>
            <p className="text-gray-600 text-sm mb-4">
              Ocorreu um erro ao processar a página. A sincronização falhou e precisa ser
              recarregada manualmente.
            </p>

            <div className="bg-gray-50 text-left p-3 rounded text-xs text-gray-500 font-mono mb-6 overflow-auto max-h-32">
              Erro: {this.state.error?.message || 'Desconhecido'}
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center items-center gap-2 bg-gray-900 text-white py-2.5 rounded-lg hover:bg-gray-800 transition font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              Recarregar Página
            </button>

            {this.state.errorCount > 3 && (
              <p className="text-xs text-red-500 mt-4 font-medium">
                Múltiplos erros detectados. Entre em contato com o suporte ou tente acessar em aba
                anônima.
              </p>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
