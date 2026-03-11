import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { User, Demand, DemandStatus, BadgeType, UserStats } from '@/types'
import { useToast } from '@/hooks/use-toast'

interface AppState {
  currentUser: User | null
  users: User[]
  demands: Demand[]
  notifications: string[]
  login: (email: string, password?: string) => void
  logout: () => void
  requestPasswordReset: (email: string) => void
  addDemand: (demand: Partial<Demand>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  submitDemandResponse: (id: string, action: 'encontrei' | 'nao_encontrei', payload: any) => any
  submitIndependentCapture: (payload: any) => void
  addPoints: (amount: number, userId?: string) => void
  sessionExpiresAt: number | null
  getSimilarDemands: (id: string) => Demand[]
}

const defaultStats: UserStats = {
  imoveisCaptados: 0,
  responseTimeSum: 0,
  responseCount: 0,
  negociosFechados: 0,
  imoveisCaptadosSemana: 0,
  diasSemDemandaPendente: 0,
  streakRespostasRapidas: 0,
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'captador@etic.com',
    role: 'captador',
    points: 1250,
    dailyPoints: 150,
    weeklyPoints: 600,
    monthlyPoints: 1250,
    badges: ['🏆 Especialista', '🔥 Semana de Ouro'],
    stats: {
      ...defaultStats,
      imoveisCaptados: 105,
      imoveisCaptadosSemana: 11,
      negociosFechados: 2,
    },
  },
  {
    id: '2',
    name: 'Carlos Santos',
    email: 'sdr@etic.com',
    role: 'sdr',
    points: 800,
    dailyPoints: 0,
    weeklyPoints: 200,
    monthlyPoints: 800,
    badges: ['🚀 Rastreador Rápido'],
    stats: { ...defaultStats, responseCount: 10, responseTimeSum: 120 },
  },
  {
    id: '4',
    name: 'Marina Costa',
    email: 'corretor@etic.com',
    role: 'corretor',
    points: 950,
    dailyPoints: 50,
    weeklyPoints: 350,
    monthlyPoints: 950,
    badges: ['⭐ Negociador Estrela'],
    stats: { ...defaultStats, negociosFechados: 6 },
  },
  {
    id: '3',
    name: 'Roberto Lima',
    email: 'gestor@etic.com',
    role: 'gestor',
    points: 0,
    dailyPoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    badges: [],
    stats: defaultStats,
  },
]

const AppContext = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [allDemands, setAllDemands] = useState<Demand[]>([])
  const [notifications, setNotifications] = useState<string[]>([])
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null)

  // Initialize mock demands omitted for brevity, assume they exist or start empty
  useEffect(() => {
    const d: Demand = {
      id: 'd1',
      clientName: 'João Pedro',
      location: 'Jardins',
      budget: 850000,
      minBudget: 800000,
      maxBudget: 1000000,
      bedrooms: 3,
      parkingSpots: 2,
      description: 'Apto',
      timeframe: 'Imediato',
      urgency: 'Alta',
      type: 'Venda',
      status: 'Pendente',
      createdBy: '2',
      createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    }
    setAllDemands([d])
  }, [])

  const checkBadges = (userId: string) => {
    setUsers((prev) => {
      const newUsers = [...prev]
      const idx = newUsers.findIndex((u) => u.id === userId)
      if (idx === -1) return prev

      const user = newUsers[idx]
      const stats = user.stats
      const currentBadges = user.badges || []
      const earned: BadgeType[] = []

      if (!currentBadges.includes('🏆 Especialista') && stats.imoveisCaptados >= 100)
        earned.push('🏆 Especialista')
      if (
        !currentBadges.includes('🚀 Rastreador Rápido') &&
        stats.responseCount >= 5 &&
        stats.responseTimeSum / stats.responseCount <= 18
      )
        earned.push('🚀 Rastreador Rápido')
      if (!currentBadges.includes('💎 Sem Demandas Abertas') && stats.diasSemDemandaPendente >= 7)
        earned.push('💎 Sem Demandas Abertas')
      if (!currentBadges.includes('🔥 Semana de Ouro') && stats.imoveisCaptadosSemana >= 10)
        earned.push('🔥 Semana de Ouro')
      if (!currentBadges.includes('⭐ Negociador Estrela') && stats.negociosFechados >= 5)
        earned.push('⭐ Negociador Estrela')
      if (!currentBadges.includes('🎯 Perfeccionista') && stats.streakRespostasRapidas >= 14)
        earned.push('🎯 Perfeccionista')

      if (earned.length > 0) {
        newUsers[idx] = { ...user, badges: [...currentBadges, ...earned] }
        if (currentUser?.id === userId) {
          setCurrentUser(newUsers[idx])
          earned.forEach((b) =>
            toast({
              title: 'Conquista Desbloqueada! 🎉',
              description: `Você ganhou a insígnia: ${b}`,
              className: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white border-0',
            }),
          )
        }
      }
      return newUsers
    })
  }

  const updateUserStats = (userId: string, updates: Partial<UserStats>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, stats: { ...u.stats, ...updates } } : u)),
    )
    if (currentUser?.id === userId) {
      setCurrentUser((prev) => (prev ? { ...prev, stats: { ...prev.stats, ...updates } } : prev))
    }
    checkBadges(userId)
  }

  const addPoints = (amount: number, userId?: string) => {
    const targetId = userId || currentUser?.id
    if (!targetId) return

    setUsers((prev) =>
      prev.map((u) =>
        u.id === targetId
          ? {
              ...u,
              points: u.points + amount,
              dailyPoints: u.dailyPoints + amount,
              weeklyPoints: u.weeklyPoints + amount,
              monthlyPoints: u.monthlyPoints + amount,
            }
          : u,
      ),
    )
    if (currentUser?.id === targetId) {
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              points: prev.points + amount,
              dailyPoints: prev.dailyPoints + amount,
              weeklyPoints: prev.weeklyPoints + amount,
              monthlyPoints: prev.monthlyPoints + amount,
            }
          : prev,
      )
    }
  }

  const getSimilarDemands = (id: string) => {
    const demand = allDemands.find((d) => d.id === id)
    if (!demand) return []
    return allDemands.filter(
      (d) =>
        d.id !== demand.id &&
        d.location.toLowerCase() === demand.location.toLowerCase() &&
        d.type === demand.type,
    )
  }

  const submitIndependentCapture = (payload: any) => {
    if (!currentUser) return
    let points = 35
    const breakdown = ['+35 (Capt. Independente)']

    if (payload.docCompleta) {
      points += 20
      breakdown.push('+20 (Doc Completa)')
    }

    addPoints(points)
    updateUserStats(currentUser.id, {
      imoveisCaptados: currentUser.stats.imoveisCaptados + 1,
      imoveisCaptadosSemana: currentUser.stats.imoveisCaptadosSemana + 1,
    })

    toast({
      title: 'Captação Registrada! 🌟',
      description: `+${points} pts: ${breakdown.join(', ')}`,
      className: 'bg-emerald-600 text-white',
    })
  }

  const submitDemandResponse = (
    id: string,
    action: 'encontrei' | 'nao_encontrei',
    payload: any,
  ) => {
    if (!currentUser) return { success: false, message: 'Não logado' }
    const demand = allDemands.find((d) => d.id === id)
    if (!demand) return { success: false, message: 'Demanda não encontrada' }

    const hoursElapsed = (Date.now() - new Date(demand.createdAt).getTime()) / 3600000
    let points = 0
    const breakdown = []

    if (action === 'encontrei') {
      points += 50
      breakdown.push('+50 (Sob Demanda)')

      if (hoursElapsed <= 12) {
        points += 15
        breakdown.push('+15 (Rapidez <12h)')
        const newStreak = currentUser.stats.streakRespostasRapidas + 1
        updateUserStats(currentUser.id, { streakRespostasRapidas: newStreak })
        if (newStreak > 1) {
          points += 10
          breakdown.push('+10 (Streak <24h)')
        }
      }

      if (hoursElapsed > 48) {
        points -= 20
        breakdown.push('-20 (Atraso >48h)')
      }

      if (getSimilarDemands(id).length + 1 >= 5) {
        points += 25
        breakdown.push('+25 (Alta Demanda 5+)')
      }

      if (payload.docCompleta) {
        points += 20
        breakdown.push('+20 (Doc Completa)')
      }

      addPoints(points)
      updateUserStats(currentUser.id, {
        imoveisCaptados: currentUser.stats.imoveisCaptados + 1,
        imoveisCaptadosSemana: currentUser.stats.imoveisCaptadosSemana + 1,
        responseCount: currentUser.stats.responseCount + 1,
        responseTimeSum: currentUser.stats.responseTimeSum + hoursElapsed,
      })

      setAllDemands((prev) =>
        prev.map((d) =>
          d.id === id ? { ...d, status: 'Captado sob demanda', assignedTo: currentUser.id } : d,
        ),
      )

      toast({
        title: 'Imóvel Registrado! 🎉',
        description: `Ganhou ${points} pts: ${breakdown.join(', ')}`,
        className: 'bg-emerald-600 text-white',
      })
      return { success: true, message: 'Imóvel Registrado!' }
    } else {
      if (hoursElapsed > 48) {
        addPoints(-20)
        toast({
          title: 'Penalidade Aplicada',
          description: '-20 pts por resposta após 48h.',
          variant: 'destructive',
        })
      }
      setAllDemands((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: payload.continueSearch ? 'Em Captação' : 'Sem demanda' }
            : d,
        ),
      )
      return { success: true, message: 'Resposta registrada' }
    }
  }

  const updateDemandStatus = (id: string, status: DemandStatus) => {
    const demand = allDemands.find((d) => d.id === id)
    if (!demand) return

    if (status === 'Negócio' && demand.assignedTo) {
      addPoints(100, demand.assignedTo)
      const u = users.find((u) => u.id === demand.assignedTo)
      if (u) updateUserStats(u.id, { negociosFechados: u.stats.negociosFechados + 1 })
      toast({ title: 'Negócio Fechado! 💰', description: '+100 pts atribuídos.' })
    } else if (status === 'Visita' && demand.assignedTo) {
      addPoints(15, demand.assignedTo)
      toast({ title: 'Visita Agendada! 📍', description: '+15 pts atribuídos.' })
    }
    setAllDemands((prev) => prev.map((d) => (d.id === id ? { ...d, status } : d)))
  }

  const login = (email: string) => {
    const user = users.find((u) => u.email === email)
    if (!user) throw new Error('Email não cadastrado')
    setCurrentUser(user)
    setSessionExpiresAt(Date.now() + 24 * 3600000)
  }

  const logout = () => setCurrentUser(null)
  const requestPasswordReset = () => {}
  const addDemand = (d: any) => setAllDemands((p) => [{ ...d, id: Math.random() + '' }, ...p])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        demands: allDemands,
        notifications,
        login,
        logout,
        requestPasswordReset,
        addDemand,
        updateDemandStatus,
        submitDemandResponse,
        submitIndependentCapture,
        addPoints,
        sessionExpiresAt,
        getSimilarDemands,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export default function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useAppStore must be used within an AppStoreProvider')
  return context
}
