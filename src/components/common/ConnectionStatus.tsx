import React from 'react'

interface ConnectionStatusProps {
  isConnected?: boolean
  error?: Error | string | null
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = () => {
  // Operação Zero-Noise Connection & Root-Kill:
  // O componente visual de aviso de conexão foi inteiramente desativado.
  // Nenhum alerta visual interromperá a experiência da interface gráfica.
  return null
}
