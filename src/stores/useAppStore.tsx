import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
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
  enqueueWebhook: (event_type: string, entity_id: string | undefined, data: any) => void
  processWebhookCron: () => Promise<void>
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

const createDem = (
  id: string,
  name: string,
  loc: string,
  hrs: number,
  timeframe: string = 'Até 30 dias',
): Demand => ({
  id,
  clientName: name,
  location: loc,
  budget: 850000,
  minBudget: 800000,
  maxBudget: 1000000,
  bedrooms: 3,
  parkingSpots: 2,
  description: 'Demanda de teste',
  timeframe,
  type: 'Venda',
  status: 'Pendente',
  createdBy: '2',
  assignedTo: '1',
  createdAt: new Date(Date.now() - hrs * 3600000).toISOString(),
})

const initialDemands = [
  createDem('d1', 'João Pedro', 'Jardins', 5, 'Urgente'),
  createDem('d2', 'Maria Silva', 'Moema', 25, 'Até 15 dias'),
  createDem('d3', 'Carlos Santos', 'Pinheiros', 49, 'Até 30 dias'),
  createDem('d4', 'Fernanda Lima', 'Centro', 73, 'Até 90 dias ou +'),
]

const AppContext = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [allDemands, setAllDemands] = useState<Demand[]>(initialDemands)
  const [webhookQueue, setWebhookQueue] = useState<WebhookEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<string[]>([])

  const webhookQueueRef = useRef(webhookQueue)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    webhookQueueRef.current = webhookQueue
  }, [webhookQueue])

  const addLog = useCallback(
    (msg: string) =>
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]),
    [],
  )

  const updateQueueItem = useCallback((id: string, updates: Partial<WebhookEvent>) => {
    setWebhookQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...updates } : item)))
  }, [])

  const enqueueWebhook = useCallback(
    (event_type: string, entity_id: string | undefined, data: any) => {
      const target_url =
        import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://mock-n8n.example.com/webhook-test'

      if (!target_url.startsWith('http')) {
        addLog(`[Erro] Webhook URL inválida para evento ${event_type}`)
        return
      }

      const id = Math.random().toString(36).substring(2, 9)
      const payload = {
        event_type,
        entity_id,
        data,
        timestamp: new Date().toISOString(),
      }

      const newEvent: WebhookEvent = {
        id,
        event_type,
        entity_id,
        payload,
        status: 'pendente',
        tentativas: 0,
        target_url,
        data_criacao: new Date().toISOString(),
      }

      setWebhookQueue((prev) => [...prev, newEvent])
      addLog(`[Webhook] Evento '${event_type}' enfileirado para envio a n8n.`)
    },
    [addLog],
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
          enqueueWebhook('falha_sistema', demand.id, {
            action: `avaliação da demanda de ${demand.clientName} em ${demand.location} (sem resposta há 72h)`,
          })
          addLog(`[Cron] Demanda de ${demand.clientName} atualizada para Impossível (>72h).`)
        } else if (type === '48h') {
          enqueueWebhook('lembrete_prazo', demand.id, {
            tipo: '48h',
            clientName: demand.clientName,
            location: demand.location,
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
          enqueueWebhook('lembrete_prazo', demand.id, {
            tipo: '24h',
            clientName: demand.clientName,
            location: demand.location,
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

  const processWebhookCron = useCallback(async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    const pendingItems = webhookQueueRef.current.filter(
      (q) => q.status === 'pendente' || (q.status === 'falha' && q.tentativas < 3),
    )

    if (pendingItems.length > 0) {
      addLog(`[Cron n8n] Iniciando processamento de ${pendingItems.length} webhooks pendentes...`)
    }

    for (const item of pendingItems) {
      let success = false
      let attempts = item.tentativas

      updateQueueItem(item.id, { status: 'processando' })

      while (!success && attempts < 3) {
        attempts++
        try {
          await new Promise((r) => setTimeout(r, 400))

          const isMockFailure = Math.random() < 0.25
          if (isMockFailure) {
            throw new Error('HTTP 502 Bad Gateway - Connection refused')
          }

          success = true
          updateQueueItem(item.id, {
            status: 'enviado',
            tentativas: attempts,
            data_envio: new Date().toISOString(),
            erro_mensagem: undefined,
          })
          addLog(`[Webhook] Sucesso: '${item.event_type}' entregue ao n8n.`)
          toast({
            title: 'Sincronização n8n',
            description: `Evento ${item.event_type} entregue com sucesso.`,
            className: 'bg-emerald-600 text-white',
          })
        } catch (err: any) {
          updateQueueItem(item.id, {
            status: 'falha',
            tentativas: attempts,
            erro_mensagem: err.message,
          })
          addLog(
            `[Webhook] Falha: '${item.event_type}' (Tentativa ${attempts}/3). Erro: ${err.message}`,
          )

          if (attempts < 3) {
            const delay = [1000, 2000, 4000][attempts - 1]
            addLog(`[Webhook] Aguardando ${delay}ms para tentar novamente...`)
            await new Promise((r) => setTimeout(r, delay))
          } else {
            addLog(`[Webhook] Esgotadas as 3 tentativas para o evento '${item.event_type}'.`)
            toast({
              title: 'Falha na Integração n8n',
              description: `O evento ${item.event_type} falhou definitivamente.`,
              variant: 'destructive',
            })
          }
        }
      }
    }

    isProcessingRef.current = false
  }, [addLog, updateQueueItem])

  useEffect(() => {
    const intervalId = setInterval(processWebhookCron, 300000)
    const initialTimeout = setTimeout(processWebhookCron, 3000)

    return () => {
      clearInterval(intervalId)
      clearTimeout(initialTimeout)
    }
  }, [processWebhookCron])

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

    const dLocs = d.location
      .toLowerCase()
      .split(',')
      .map((s) => s.trim())

    return allDemands.filter((x) => {
      if (x.id === d.id) return false
      if (x.type !== d.type) return false

      const xLocs = x.location
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
      return xLocs.some((l) => dLocs.includes(l))
    })
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
        addDemand: (d) => {
          const newDemand = {
            ...d,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
          } as Demand
          setAllDemands((p) => [newDemand, ...p])
          enqueueWebhook('nova_demanda', newDemand.id, newDemand)
        },
        updateDemandStatus: (i, s) => {
          setAllDemands((p) => {
            const next = p.map((d) => (d.id === i ? { ...d, status: s } : d))
            const updated = next.find((x) => x.id === i)
            if (updated && s === 'Em Captação') {
              enqueueWebhook('confirmacao_gestor', updated.id, updated)
            } else if (updated && s === 'Visita') {
              enqueueWebhook('visita_agendada', updated.id, updated)
            }
            return next
          })
        },
        submitDemandResponse: (id, action, payload) => {
          const demand = allDemands.find((d) => d.id === id)
          if (action === 'encontrei' && demand) {
            enqueueWebhook('imovel_captado', demand.id, {
              ...demand,
              location: payload?.endereco || demand.location,
            })
          }
          return { success: true, message: '' }
        },
        submitIndependentCapture: (payload) => {
          enqueueWebhook('imovel_captado', 'independente', {
            location: payload?.endereco || 'Desconhecida',
            clientName: 'Geral',
            id: 'independente',
          })
        },
        addPoints,
        getSimilarDemands,
        enqueueWebhook,
        processWebhookCron,
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
