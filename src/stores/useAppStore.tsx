import React, { createContext, useContext, useState, ReactNode } from 'react'
import { User, Demand, DemandStatus } from '@/types'

interface AppState {
  currentUser: User | null
  users: User[]
  demands: Demand[]
  notifications: string[]
  login: (email: string, password?: string) => void
  logout: () => void
  requestPasswordReset: (email: string) => void
  addDemand: (
    demand: Omit<
      Demand,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'createdBy'
      | 'urgency'
      | 'similarProfilesCount'
      | 'bedrooms'
      | 'parkingSpots'
    > & {
      urgency?: 'Alta' | 'Média' | 'Baixa'
      similarProfilesCount?: number
      bedrooms?: number
      parkingSpots?: number
    },
  ) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  submitDemandResponse: (
    id: string,
    action: 'encontrei' | 'nao_encontrei',
    payload: any,
  ) => { success: boolean; message: string }
  addPoints: (amount: number) => void
  sessionExpiresAt: number | null
  getSimilarDemands: (id: string) => Demand[]
}

const mockUsers: User[] = [
  { id: '1', name: 'Ana Silva', email: 'captador@etic.com', role: 'captador', points: 1250 },
  { id: '2', name: 'Carlos Santos', email: 'sdr@etic.com', role: 'sdr', points: 800 },
  { id: '3', name: 'Roberto Lima', email: 'gestor@etic.com', role: 'gestor', points: 0 },
  { id: '4', name: 'Marina Costa', email: 'corretor@etic.com', role: 'corretor', points: 950 },
  { id: '5', name: 'Admin Master', email: 'admin@etic.com', role: 'admin', points: 0 },
]

const mockDemands: Demand[] = [
  {
    id: 'd1',
    clientName: 'João Pedro',
    clientEmail: 'joao@example.com',
    location: 'Jardins',
    budget: 850000,
    minBudget: 800000,
    maxBudget: 1000000,
    bedrooms: 3,
    parkingSpots: 2,
    description: 'Apartamento com 3 quartos, suíte e varanda.',
    timeframe: 'Até 3 meses',
    urgency: 'Média',
    type: 'Venda',
    status: 'Pendente',
    createdBy: '2',
    createdAt: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd1-sim1',
    clientName: 'Maria Silva',
    clientEmail: 'maria@example.com',
    location: 'Jardins',
    budget: 860000,
    minBudget: 800000,
    maxBudget: 1000000,
    bedrooms: 3,
    parkingSpots: 2,
    description: 'Busco apto espaçoso nos Jardins.',
    timeframe: 'Até 6 meses',
    urgency: 'Baixa',
    type: 'Venda',
    status: 'Pendente',
    createdBy: '2',
    createdAt: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd1-sim2',
    clientName: 'Pedro Costa',
    clientEmail: 'pedro@example.com',
    location: 'Jardins',
    budget: 840000,
    minBudget: 800000,
    maxBudget: 900000,
    bedrooms: 3,
    parkingSpots: 2,
    description: 'Apto 3 dorms.',
    timeframe: 'Imediato',
    urgency: 'Alta',
    type: 'Venda',
    status: 'Em Captação',
    createdBy: '3',
    createdAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd1-sim3',
    clientName: 'Ana Paula',
    clientEmail: 'ana@example.com',
    location: 'Jardins',
    budget: 880000,
    minBudget: 850000,
    maxBudget: 950000,
    bedrooms: 3,
    parkingSpots: 2,
    description: 'Tem que ter varanda.',
    timeframe: 'Até 3 meses',
    urgency: 'Média',
    type: 'Venda',
    status: 'Pendente',
    createdBy: '1',
    createdAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd1-sim4',
    clientName: 'Carlos Eduardo',
    clientEmail: 'carlos@example.com',
    location: 'Jardins',
    budget: 820000,
    minBudget: 800000,
    maxBudget: 850000,
    bedrooms: 3,
    parkingSpots: 2,
    description: 'Financiamento aprovado.',
    timeframe: 'Imediato',
    urgency: 'Alta',
    type: 'Venda',
    status: 'Pendente',
    createdBy: '4',
    createdAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd2',
    clientName: 'Empresa XYZ',
    clientEmail: 'contato@xyz.com',
    location: 'Vila Olímpia',
    budget: 15000,
    minBudget: 10000,
    maxBudget: 20000,
    bedrooms: 0,
    parkingSpots: 5,
    description: 'Laje corporativa de 200m2 para escritório.',
    timeframe: 'Imediato',
    urgency: 'Alta',
    type: 'Aluguel',
    status: 'Em Captação',
    createdBy: '4',
    assignedTo: '1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd3',
    clientName: 'Fernanda M.',
    clientEmail: 'fernanda@example.com',
    location: 'Pinheiros',
    budget: 1200000,
    minBudget: 1000000,
    maxBudget: 1500000,
    bedrooms: 2,
    parkingSpots: 2,
    description: 'Sobrado em rua tranquila, 2 vagas.',
    timeframe: '3 a 6 meses',
    urgency: 'Baixa',
    type: 'Venda',
    status: 'Pendente',
    createdBy: '2',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'd4',
    clientName: 'Lucas R.',
    clientEmail: 'lucas@example.com',
    location: 'Moema',
    budget: 4500,
    minBudget: 3000,
    maxBudget: 5000,
    bedrooms: 1,
    parkingSpots: 1,
    description: 'Studio mobiliado próximo ao metrô.',
    timeframe: 'Imediato',
    urgency: 'Alta',
    type: 'Aluguel',
    status: 'Pendente',
    createdBy: '4',
    assignedTo: '1',
    createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(),
  },
]

const AppContext = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [allDemands, setAllDemands] = useState<Demand[]>(mockDemands)
  const [notifications, setNotifications] = useState<string[]>(['Bem-vindo ao Étic Captação!'])
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null)
  const [loginAttempts, setLoginAttempts] = useState<
    Record<string, { count: number; firstAttempt: number }>
  >({})

  const logAudit = (userId: string, event: 'login' | 'logout') => {
    console.log(`[AUDIT] User ${userId} ${event} at ${new Date().toISOString()}`)
  }

  const login = (email: string, password?: string) => {
    const now = Date.now()
    const attempt = loginAttempts[email] || { count: 0, firstAttempt: now }

    if (attempt.count >= 5 && now - attempt.firstAttempt < 60000) {
      throw new Error('Muitas tentativas. Tente novamente em 1 minuto')
    }

    if (now - attempt.firstAttempt >= 60000) {
      attempt.count = 0
      attempt.firstAttempt = now
    }

    const user = users.find((u) => u.email === email)
    if (!user) {
      attempt.count += 1
      setLoginAttempts({ ...loginAttempts, [email]: attempt })
      throw new Error('Email não cadastrado')
    }

    if (password && password !== 'Password1') {
      attempt.count += 1
      setLoginAttempts({ ...loginAttempts, [email]: attempt })
      throw new Error('Senha incorreta')
    }

    setLoginAttempts({ ...loginAttempts, [email]: { count: 0, firstAttempt: now } })

    setSessionExpiresAt(now + 24 * 60 * 60 * 1000)
    setCurrentUser(user)
    logAudit(user.id, 'login')
  }

  const logout = () => {
    if (currentUser) logAudit(currentUser.id, 'logout')
    setCurrentUser(null)
    setSessionExpiresAt(null)
  }

  const requestPasswordReset = (email: string) => {
    const user = users.find((u) => u.email === email)
    if (!user) throw new Error('Email não cadastrado')
    console.log(`[EMAIL] Reset link sent to ${email}. Valid for 1 hour.`)
  }

  const addDemand = (
    demandData: Omit<
      Demand,
      | 'id'
      | 'createdAt'
      | 'status'
      | 'createdBy'
      | 'urgency'
      | 'similarProfilesCount'
      | 'bedrooms'
      | 'parkingSpots'
    > & {
      urgency?: 'Alta' | 'Média' | 'Baixa'
      similarProfilesCount?: number
      bedrooms?: number
      parkingSpots?: number
    },
  ) => {
    if (!currentUser) return
    const newDemand: Demand = {
      ...demandData,
      budget: demandData.budget ?? demandData.maxBudget,
      urgency: demandData.urgency || 'Média',
      bedrooms: demandData.bedrooms || 0,
      parkingSpots: demandData.parkingSpots || 0,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'Pendente',
      createdBy: currentUser.id,
    }

    console.log(`[SUPABASE MOCK] Inserting data`, newDemand)
    setAllDemands((prev) => [newDemand, ...prev])
    setNotifications((prev) => [`Nova demanda criada para ${demandData.location}`, ...prev])
  }

  const updateDemandStatus = (id: string, status: DemandStatus) => {
    setAllDemands((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, assignedTo: currentUser?.id } : d)),
    )
    if (status === 'Negócio') {
      addPoints(100)
    }
  }

  const getSimilarDemands = (id: string) => {
    const demand = allDemands.find((d) => d.id === id)
    if (!demand) return []
    const baseBudget = demand.budget || demand.maxBudget
    const minB = baseBudget * 0.9
    const maxB = baseBudget * 1.1
    return allDemands.filter(
      (d) =>
        d.id !== demand.id &&
        d.location.toLowerCase() === demand.location.toLowerCase() &&
        d.type === demand.type &&
        d.bedrooms === demand.bedrooms &&
        d.parkingSpots === demand.parkingSpots &&
        (d.budget || d.maxBudget) >= minB &&
        (d.budget || d.maxBudget) <= maxB,
    )
  }

  const submitDemandResponse = (
    id: string,
    action: 'encontrei' | 'nao_encontrei',
    payload: any,
  ) => {
    const demand = allDemands.find((d) => d.id === id)
    if (!demand || !currentUser) return { success: false, message: 'Demanda não encontrada' }
    if (demand.status !== 'Pendente' && demand.status !== 'Em Captação') {
      return { success: false, message: 'Esta demanda já foi respondida' }
    }

    const hoursSinceCreation = (Date.now() - new Date(demand.createdAt).getTime()) / 3600000
    const isLate = hoursSinceCreation > 48

    if (action === 'encontrei') {
      let points = 50

      const similarDemands = getSimilarDemands(id)
      const totalInterested = similarDemands.length + 1
      if (totalInterested >= 5) points += 25

      if (isLate) points -= 20

      addPoints(points)
      setAllDemands((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'Captado sob demanda', assignedTo: currentUser.id } : d,
        ),
      )

      const link = `eticimoveis.com.br/imovel/${payload.code}`
      console.log(
        `[WEBHOOK N8N] Imóvel ${payload.code} registrado. Notificando stakeholders. Link: ${link}`,
      )
      setNotifications((prev) => [`Imóvel registrado para ${demand.clientName}!`, ...prev])

      return { success: true, message: `Imóvel registrado! Link gerado. (+${points} pts)` }
    } else {
      const newStatus = payload.continueSearch ? 'Em Captação' : 'Sem demanda'
      setAllDemands((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: newStatus, assignedTo: currentUser.id } : d,
        ),
      )
      console.log(
        `[WEBHOOK N8N] Captação falhou. Motivo: ${payload.reason}. Continuar: ${payload.continueSearch}`,
      )
      return { success: true, message: 'Resposta registrada com sucesso' }
    }
  }

  const addPoints = (amount: number) => {
    if (!currentUser) return
    setCurrentUser((prev) => (prev ? { ...prev, points: prev.points + amount } : prev))
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, points: u.points + amount } : u)),
    )
  }

  const demands = allDemands.filter((d) => {
    if (!currentUser) return false
    if (currentUser.role === 'gestor' || currentUser.role === 'admin') return true
    if (currentUser.role === 'captador')
      return (
        d.assignedTo === currentUser.id || d.createdBy === currentUser.id || d.status === 'Pendente'
      )
    if (currentUser.role === 'sdr') return d.type === 'Aluguel'
    if (currentUser.role === 'corretor') return d.type === 'Venda'
    return false
  })

  const value = {
    currentUser,
    users,
    demands,
    notifications,
    login,
    logout,
    requestPasswordReset,
    addDemand,
    updateDemandStatus,
    submitDemandResponse,
    addPoints,
    sessionExpiresAt,
    getSimilarDemands,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within an AppStoreProvider')
  return context
}
