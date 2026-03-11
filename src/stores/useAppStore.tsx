import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
} from 'react'
import { User, Demand, DemandStatus, BadgeType, UserStats, WebhookEvent } from '@/types'
import { toast } from '@/hooks/use-toast'

interface AppState {
  currentUser: User | null
  users: User[]
  demands: Demand[]
  webhookQueue: WebhookEvent[]
  auditLogs: string[]
  login: (email: string, password?: string) => void
  logout: () => void
  addDemand: (demand: Partial<Demand>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  submitDemandResponse: (id: string, action: 'encontrei' | 'nao_encontrei', payload: any) => any
  submitIndependentCapture: (payload: any) => void
  addPoints: (amount: number, userId?: string) => void
  getSimilarDemands: (id: string) => Demand[]
  triggerCron: () => void
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
]

const createDem = (id: string, name: string, loc: string, hrs: number): Demand => ({
  id,
  clientName: name,
  location: loc,
  budget: 850000,
  minBudget: 800000,
  maxBudget: 1000000,
  bedrooms: 3,
  parkingSpots: 2,
  description: 'Demanda de teste',
  timeframe: 'Imediato',
  urgency: 'Alta',
  type: 'Venda',
  status: 'Pendente',
  createdBy: '2',
  assignedTo: '1',
  createdAt: new Date(Date.now() - hrs * 3600000).toISOString(),
})

const initialDemands = [
  createDem('d1', 'João Pedro', 'Jardins', 5),
  createDem('d2', 'Maria Silva', 'Moema', 25),
  createDem('d3', 'Carlos Santos', 'Pinheiros', 49),
  createDem('d4', 'Fernanda Lima', 'Centro', 73),
]

const AppContext = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [allDemands, setAllDemands] = useState<Demand[]>(initialDemands)
  const [webhookQueue, setWebhookQueue] = useState<WebhookEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<string[]>([])

  const addLog = useCallback(
    (msg: string) =>
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]),
    [],
  )
  const enqueueWebhook = useCallback(
    (evento: string, payload: any) =>
      setWebhookQueue((prev) => [
        ...prev,
        {
          id: Math.random().toString(36).substr(2, 9),
          evento,
          payload,
          status: 'pending',
          tentativas: 0,
          createdAt: new Date().toISOString(),
        },
      ]),
    [],
  )

  const triggerCron = useCallback(() => {
    const now = Date.now()
    const actions: Array<{ type: '24h' | '48h' | '72h'; demand: Demand }> = []

    setAllDemands((prev) => {
      let changed = false
      const next = prev.map((d) => {
        if (d.status !== 'Pendente') return d
        const hrs = (now - new Date(d.createdAt).getTime()) / 3600000
        const updated = { ...d }
        if (hrs >= 72 && !d.notificada_72h) {
          updated.notificada_72h = true
          updated.status = 'Impossível'
          updated.assignedTo = undefined
          actions.push({ type: '72h', demand: d })
          changed = true
        } else if (hrs >= 48 && !d.notificada_48h) {
          updated.notificada_48h = true
          updated.isRepescagem = true
          actions.push({ type: '48h', demand: d })
          changed = true
        } else if (hrs >= 24 && !d.notificada_24h) {
          updated.notificada_24h = true
          actions.push({ type: '24h', demand: d })
          changed = true
        }
        return updated
      })
      return changed ? next : prev
    })

    setTimeout(() => {
      actions.forEach(({ type, demand }) => {
        if (type === '72h') {
          enqueueWebhook('WA_MESSAGE_MANAGER', {
            message: `Demanda impossível: ${demand.clientName} em ${demand.location} não foi respondida`,
          })
          addLog(`[Cron] Demanda de ${demand.clientName} atualizada para Impossível (>72h).`)
        } else if (type === '48h') {
          enqueueWebhook('WA_MESSAGE_CAPTURER', {
            message: `Última chance: Responda em 24h ou a demanda será repassada`,
          })
          if (demand.assignedTo) {
            setUsers((u) =>
              u.map((user) =>
                user.id === demand.assignedTo ? { ...user, points: user.points - 20 } : user,
              ),
            )
            addLog(`[Cron] Penalidade: -20 pts para captador (Demanda ${demand.clientName} >48h).`)
          }
          addLog(`[Cron] Demanda de ${demand.clientName} entrou em Repescagem (>48h).`)
        } else if (type === '24h') {
          enqueueWebhook('WA_MESSAGE_CAPTURER', {
            message: `Lembrete: Responda a demanda de ${demand.clientName} em ${demand.location}`,
          })
          addLog(`[Cron] Lembrete 24h enfileirado para demanda de ${demand.clientName}.`)
        }
      })
    }, 100)
  }, [enqueueWebhook, addLog])

  useEffect(() => {
    const t = setTimeout(triggerCron, 2000)
    const i = setInterval(triggerCron, 20000)
    return () => {
      clearTimeout(t)
      clearInterval(i)
    }
  }, [triggerCron])

  useEffect(() => {
    const pending = webhookQueue.find((q) => q.status === 'pending')
    if (!pending) return
    const timer = setTimeout(() => {
      const isFailure = Math.random() < 0.2
      if (isFailure && pending.tentativas < 2) {
        toast({
          title: 'Aviso',
          description: 'Notificação falhou, será retentada',
          variant: 'destructive',
        })
        setWebhookQueue((prev) =>
          prev.map((q) => (q.id === pending.id ? { ...q, tentativas: q.tentativas + 1 } : q)),
        )
      } else if (isFailure) {
        toast({
          title: 'Erro',
          description: 'Erro ao atualizar status após tentativas',
          variant: 'destructive',
        })
        setWebhookQueue((prev) =>
          prev.map((q) => (q.id === pending.id ? { ...q, status: 'failed' } : q)),
        )
        addLog(`[Erro] Falha definitiva na notificação para ${pending.evento}.`)
      } else {
        toast({
          title: 'WhatsApp Enviado',
          description: pending.payload.message,
          className: 'bg-emerald-600 text-white',
        })
        setWebhookQueue((prev) =>
          prev.map((q) => (q.id === pending.id ? { ...q, status: 'processed' } : q)),
        )
        addLog(`[Sucesso] ${pending.payload.message}`)
      }
    }, 2500)
    return () => clearTimeout(timer)
  }, [webhookQueue, addLog])

  const addPoints = (amount: number, userId?: string) => {
    const id = userId || currentUser?.id
    if (!id) return
    setUsers((p) =>
      p.map((u) =>
        u.id === id
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
    if (currentUser?.id === id)
      setCurrentUser((p) =>
        p
          ? {
              ...p,
              points: p.points + amount,
              dailyPoints: p.dailyPoints + amount,
              weeklyPoints: p.weeklyPoints + amount,
              monthlyPoints: p.monthlyPoints + amount,
            }
          : p,
      )
  }

  const getSimilarDemands = (id: string) => {
    const d = allDemands.find((x) => x.id === id)
    if (!d) return []
    return allDemands.filter(
      (x) =>
        x.id !== d.id && x.location.toLowerCase() === d.location.toLowerCase() && x.type === d.type,
    )
  }

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        demands: allDemands,
        webhookQueue,
        auditLogs,
        triggerCron,
        login: (e) => setCurrentUser(users.find((u) => u.email === e) || null),
        logout: () => setCurrentUser(null),
        addDemand: (d) => setAllDemands((p) => [{ ...d, id: Math.random() + '' } as Demand, ...p]),
        updateDemandStatus: (i, s) =>
          setAllDemands((p) => p.map((d) => (d.id === i ? { ...d, status: s } : d))),
        submitDemandResponse: () => ({ success: true, message: '' }),
        submitIndependentCapture: () => {},
        addPoints,
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
