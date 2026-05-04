import { createContext, useContext, useState, ReactNode } from 'react'

export type Periodo = 'hoje' | 'semana' | 'mes' | 'custom'
export type CardFiltrado =
  | 'nenhum'
  | 'novas'
  | 'ativas'
  | 'perdidas'
  | 'sob_demanda'
  | 'livres'
  | 'visitas'
  | 'fechados'

interface StoreState {
  periodo: Periodo
  dataCustomStart: string
  dataCustomEnd: string
  cardFiltrado: CardFiltrado
  setPeriodo: (p: Periodo) => void
  setCardFiltrado: (c: CardFiltrado) => void
  setCustomDates: (start: string, end: string) => void
}

const StoreContext = createContext<StoreState | undefined>(undefined)

export function SdrStoreProvider({ children }: { children: ReactNode }) {
  const [periodo, setPeriodo] = useState<Periodo>('semana')
  const [dataCustomStart, setDataCustomStart] = useState('')
  const [dataCustomEnd, setDataCustomEnd] = useState('')
  const [cardFiltrado, setCardFiltrado] = useState<CardFiltrado>('nenhum')

  return (
    <StoreContext.Provider
      value={{
        periodo,
        dataCustomStart,
        dataCustomEnd,
        cardFiltrado,
        setPeriodo,
        setCardFiltrado,
        setCustomDates: (s, e) => {
          setDataCustomStart(s)
          setDataCustomEnd(e)
        },
      }}
    >
      {children}
    </StoreContext.Provider>
  )
}

export function useSdrStore() {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useSdrStore must be used within SdrStoreProvider')
  return context
}
