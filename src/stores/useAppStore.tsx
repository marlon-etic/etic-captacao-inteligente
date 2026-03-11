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
  addDemand: (demand: Omit<Demand, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  addPoints: (amount: number) => void
  sessionExpiresAt: number | null
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
    location: 'Jardins',
    budget: 850000,
    type: 'Venda',
    status: 'Pendente',
    createdBy: '2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd2',
    clientName: 'Empresa XYZ',
    location: 'Vila Olímpia',
    budget: 15000,
    type: 'Aluguel',
    status: 'Em Captação',
    createdBy: '4',
    assignedTo: '1',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd3',
    clientName: 'Fernanda M.',
    location: 'Pinheiros',
    budget: 1200000,
    type: 'Venda',
    status: 'Pendente',
    createdBy: '2',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'd4',
    clientName: 'Lucas R.',
    location: 'Moema',
    budget: 4500,
    type: 'Aluguel',
    status: 'Visita',
    createdBy: '4',
    assignedTo: '1',
    createdAt: new Date().toISOString(),
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

  // Auditing mock logger
  const logAudit = (userId: string, event: 'login' | 'logout') => {
    console.log(`[AUDIT] User ${userId} ${event} at ${new Date().toISOString()}`)
  }

  const login = (email: string, password?: string) => {
    const now = Date.now()
    const attempt = loginAttempts[email] || { count: 0, firstAttempt: now }

    // Rate Limiting: max 5 attempts per minute
    if (attempt.count >= 5 && now - attempt.firstAttempt < 60000) {
      throw new Error('Muitas tentativas. Tente novamente em 1 minuto')
    }

    // Reset attempts if 1 minute has passed
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

    // Passwords would be verified against bcrypt hashes in the backend
    if (password && password !== 'Password1') {
      attempt.count += 1
      setLoginAttempts({ ...loginAttempts, [email]: attempt })
      throw new Error('Senha incorreta')
    }

    setLoginAttempts({ ...loginAttempts, [email]: { count: 0, firstAttempt: now } })

    // JWT Session validity (24 hours)
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

  const addDemand = (demandData: Omit<Demand, 'id' | 'createdAt' | 'status' | 'createdBy'>) => {
    if (!currentUser) return
    const newDemand: Demand = {
      ...demandData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'Pendente',
      createdBy: currentUser.id,
    }
    setAllDemands((prev) => [newDemand, ...prev])
    setNotifications((prev) => [`Nova demanda criada para ${demandData.location}`, ...prev])
  }

  const updateDemandStatus = (id: string, status: DemandStatus) => {
    setAllDemands((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status, assignedTo: currentUser?.id } : d)),
    )
    if (status === 'Captado sob demanda' || status === 'Negócio') {
      addPoints(100)
    }
  }

  const addPoints = (amount: number) => {
    if (!currentUser) return
    setCurrentUser((prev) => (prev ? { ...prev, points: prev.points + amount } : prev))
    setUsers((prev) =>
      prev.map((u) => (u.id === currentUser.id ? { ...u, points: u.points + amount } : u)),
    )
  }

  // Row Level Security (RLS) Filtering
  const demands = allDemands.filter((d) => {
    if (!currentUser) return false
    if (currentUser.role === 'gestor' || currentUser.role === 'admin') return true
    if (currentUser.role === 'captador')
      return d.assignedTo === currentUser.id || d.createdBy === currentUser.id
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
    addPoints,
    sessionExpiresAt,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within an AppStoreProvider')
  return context
}
