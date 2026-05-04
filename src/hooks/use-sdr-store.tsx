import { createContext, useContext, useState, ReactNode } from 'react'

import { useEffect } from 'react'

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
  buscaImoveis: string
  filtroCompatibilidade: string
  trendingClienteId: string | null
  setPeriodo: (p: Periodo) => void
  setCardFiltrado: (c: CardFiltrado) => void
  setCustomDates: (start: string, end: string) => void
  setBuscaImoveis: (b: string) => void
  setFiltroCompatibilidade: (f: string) => void
  setTrendingCliente: (id: string | null) => void
}

const StoreContext = createContext<StoreState | undefined>(undefined)

export function SdrStoreProvider({ children }: { children: ReactNode }) {
  const [periodo, setPeriodoState] = useState<Periodo>('semana')
  const [dataCustomStart, setDataCustomStart] = useState('')
  const [dataCustomEnd, setDataCustomEnd] = useState('')
  const [cardFiltrado, setCardFiltradoState] = useState<CardFiltrado>('nenhum')
  const [buscaImoveis, setBuscaImoveis] = useState('')
  const [filtroCompatibilidade, setFiltroCompatibilidade] = useState('todos')
  const [trendingClienteId, setTrendingCliente] = useState<string | null>(null)

  useEffect(() => {
    const savedPeriodo = localStorage.getItem('sdr_periodo')
    if (savedPeriodo) setPeriodoState(savedPeriodo as Periodo)
    const savedCard = localStorage.getItem('sdr_card_filtrado')
    if (savedCard) setCardFiltradoState(savedCard as CardFiltrado)
  }, [])

  const setPeriodo = (p: Periodo) => {
    setPeriodoState(p)
    localStorage.setItem('sdr_periodo', p)
  }

  const setCardFiltrado = (c: CardFiltrado) => {
    setCardFiltradoState(c)
    localStorage.setItem('sdr_card_filtrado', c)
  }

  return (
    <StoreContext.Provider
      value={{
        periodo,
        dataCustomStart,
        dataCustomEnd,
        cardFiltrado,
        buscaImoveis,
        filtroCompatibilidade,
        trendingClienteId,
        setPeriodo,
        setCardFiltrado,
        setCustomDates: (s, e) => {
          setDataCustomStart(s)
          setDataCustomEnd(e)
        },
        setBuscaImoveis,
        setFiltroCompatibilidade,
        setTrendingCliente,
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
