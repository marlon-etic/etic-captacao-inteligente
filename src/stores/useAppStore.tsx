import React, { createContext, useContext, useState, ReactNode } from 'react'
import { User, Demand, DemandStatus } from '@/types'

interface AppState {
  currentUser: User | null
  users: User[]
  demands: Demand[]
  notifications: string[]
  login: (email: string) => void
  logout: () => void
  addDemand: (demand: Omit<Demand, 'id' | 'createdAt' | 'status' | 'createdBy'>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  addPoints: (amount: number) => void
}

const mockUsers: User[] = [
  { id: '1', name: 'Ana Silva', email: 'captador@etic.com', role: 'captador', points: 1250 },
  { id: '2', name: 'Carlos Santos', email: 'sdr@etic.com', role: 'sdr', points: 800 },
  { id: '3', name: 'Roberto Lima', email: 'gestor@etic.com', role: 'gestor', points: 0 },
  { id: '4', name: 'Marina Costa', email: 'corretor@etic.com', role: 'corretor', points: 950 },
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
  const [demands, setDemands] = useState<Demand[]>(mockDemands)
  const [notifications, setNotifications] = useState<string[]>(['Bem-vindo ao Étic Captação!'])

  const login = (email: string) => {
    const user = users.find((u) => u.email === email)
    if (user) setCurrentUser(user)
  }

  const logout = () => setCurrentUser(null)

  const addDemand = (demandData: Omit<Demand, 'id' | 'createdAt' | 'status' | 'createdBy'>) => {
    if (!currentUser) return
    const newDemand: Demand = {
      ...demandData,
      id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      status: 'Pendente',
      createdBy: currentUser.id,
    }
    setDemands((prev) => [newDemand, ...prev])
    setNotifications((prev) => [`Nova demanda criada para ${demandData.location}`, ...prev])
  }

  const updateDemandStatus = (id: string, status: DemandStatus) => {
    setDemands((prev) =>
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

  const value = {
    currentUser,
    users,
    demands,
    notifications,
    login,
    logout,
    addDemand,
    updateDemandStatus,
    addPoints,
  }
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within an AppStoreProvider')
  return context
}
