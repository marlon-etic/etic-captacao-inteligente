import React from 'react'

interface ConnectionStatusProps {
  isConnected: boolean
  error?: string | null
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ isConnected, error }) => {
  if (isConnected) {
    return (
      <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-md z-[9999] transition-opacity duration-300">
        <div className="w-2.5 h-2.5 bg-green-600 rounded-full animate-pulse"></div>
        <span className="text-sm font-bold">Conectado</span>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-2 bg-red-100 text-red-800 px-4 py-2 rounded-lg shadow-md z-[9999] transition-opacity duration-300">
      <div className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse"></div>
      <span className="text-sm font-bold">Desconectado</span>
      {error && (
        <span className="text-xs ml-2 font-medium max-w-[150px] truncate" title={error}>
          ({error})
        </span>
      )}
    </div>
  )
}
