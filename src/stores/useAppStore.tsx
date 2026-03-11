import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import {
  User,
  Demand,
  DemandStatus,
  UserStats,
  WebhookEvent,
  PropertyAction,
  PropertyActionType,
  CapturedProperty,
} from '@/types'
import { toast } from '@/hooks/use-toast'

interface AppState {
  currentUser: User | null
  sessionExpiresAt: number | null
  users: User[]
  demands: Demand[]
  looseProperties: CapturedProperty[]
  webhookQueue: WebhookEvent[]
  auditLogs: string[]
  login: (email: string, password?: string) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => void
  addDemand: (demand: Partial<Demand>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  submitDemandResponse: (id: string, action: 'encontrei' | 'nao_encontrei', payload: any) => any
  submitIndependentCapture: (payload: any) => void
  claimLooseProperty: (code: string, demandId: string) => { success: boolean; message: string }
  addPoints: (amount: number, userId?: string) => void
  getSimilarDemands: (id: string) => Demand[]
  triggerCron: () => void
  enqueueWebhook: (event_type: string, entity_id: string | undefined, data: any) => void
  processWebhookCron: () => Promise<void>
  scheduleVisit: (id: string, payload: any) => void
  closeDeal: (id: string, payload: any) => void
  scheduleVisitByCode: (code: string, payload: any) => void
  submitProposalByCode: (code: string, payload: any) => void
  closeDealByCode: (code: string, payload: any) => void
  prioritizeDemand: (id: string, count: number) => void
  markDemandLost: (id: string, reason: string, obs?: string) => void
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
    status: 'ativo',
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
    status: 'ativo',
    points: 800,
    dailyPoints: 0,
    weeklyPoints: 200,
    monthlyPoints: 800,
    badges: ['🚀 Rastreador Rápido'],
    stats: { ...defaultStats, responseCount: 10, responseTimeSum: 120 },
  },
  {
    id: '3',
    name: 'Roberto Corretor',
    email: 'corretor@etic.com',
    role: 'corretor',
    status: 'ativo',
    tipo_demanda: 'vendas',
    points: 950,
    dailyPoints: 50,
    weeklyPoints: 300,
    monthlyPoints: 950,
    badges: ['⭐ Negociador Estrela'],
    stats: { ...defaultStats, negociosFechados: 5 },
  },
  {
    id: '4',
    name: 'Mariana Gestora',
    email: 'gestor@etic.com',
    role: 'gestor',
    status: 'ativo',
    points: 0,
    dailyPoints: 0,
    weeklyPoints: 0,
    monthlyPoints: 0,
    badges: [],
    stats: { ...defaultStats },
  },
]

const createHistoryItem = (
  type: PropertyActionType,
  desc: string,
  hoursAgo: number,
  userId: string = '1',
  userName: string = 'Ana Silva',
  userRole: User['role'] = 'captador',
): PropertyAction => ({
  id: Math.random().toString(36).substr(2, 9),
  type,
  description: desc,
  timestamp: new Date(Date.now() - hoursAgo * 3600000).toISOString(),
  userId,
  userName,
  userRole,
})

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
  bathrooms: 2,
  parkingSpots: 2,
  description: 'Demanda de teste',
  timeframe,
  type: 'Venda',
  status: 'Pendente',
  createdBy: '2',
  assignedTo: '1',
  createdAt: new Date(Date.now() - hrs * 3600000).toISOString(),
})

const initialDemands: Demand[] = [
  createDem('d1', 'João Pedro', 'Jardins', 5, 'Urgente'),
  {
    ...createDem('d2', 'Maria Silva', 'Moema', 25, 'Até 15 dias'),
    status: 'Captado sob demanda',
    assignedTo: '1',
    capturedProperties: [
      {
        code: 'AP-452',
        value: 950000,
        neighborhood: 'Moema',
        bairro_tipo: 'listado',
        docCompleta: true,
        obs: 'Apartamento recém reformado',
        photoUrl: 'https://img.usecurling.com/p/400/300?q=apartment&seed=d2_1',
        capturedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        history: [
          createHistoryItem('captacao', 'Imóvel captado e vinculado à demanda (1º imóvel)', 48),
        ],
        numero_imovel_para_demanda: 1,
        demandas_atendidas_ids: ['d2'],
        tipo_vinculacao: 'vinculado',
        captador_id: '1',
        captador_name: 'Ana Silva',
      },
    ],
  },
  {
    ...createDem('d3', 'Carlos Santos', 'Pinheiros', 49, 'Até 30 dias'),
    status: 'Visita',
    assignedTo: '1',
    capturedProperties: [
      {
        code: 'CS-881',
        value: 1150000,
        neighborhood: 'Pinheiros',
        bairro_tipo: 'listado',
        docCompleta: false,
        visitaDate: new Date().toISOString().split('T')[0],
        visitaTime: '14:30',
        photoUrl: 'https://img.usecurling.com/p/400/300?q=house&seed=d3_1',
        capturedAt: new Date(Date.now() - 48 * 3600000).toISOString(),
        history: [
          createHistoryItem(
            'visita_agendada',
            `Visita agendada para ${new Date().toLocaleDateString('pt-BR')} às 14:30`,
            24,
          ),
          createHistoryItem('captacao', 'Imóvel captado e vinculado à demanda (1º imóvel)', 48),
        ],
        numero_imovel_para_demanda: 1,
        demandas_atendidas_ids: ['d3'],
        tipo_vinculacao: 'vinculado',
        captador_id: '1',
        captador_name: 'Ana Silva',
      },
    ],
  },
  createDem('d4', 'Fernanda Lima', 'Centro', 73, 'Até 90 dias ou +'),
]

const initialLooseProperties: CapturedProperty[] = [
  {
    code: 'LP-101',
    value: 900000,
    neighborhood: 'Pinheiros',
    bairro_tipo: 'listado',
    docCompleta: true,
    photoUrl: 'https://img.usecurling.com/p/400/300?q=house&seed=lp1',
    capturedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    tipo_vinculacao: 'solto',
    captador_id: '1',
    captador_name: 'Ana Silva',
    history: [createHistoryItem('captacao', 'Imóvel captado como disponível para todos', 24)],
  },
]

const AppContext = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('etic_session')
      if (stored) {
        const { user, expiresAt } = JSON.parse(stored)
        if (Date.now() < expiresAt) return user
      }
    } catch {}
    return null
  })

  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('etic_session')
      if (stored) {
        const { expiresAt } = JSON.parse(stored)
        if (Date.now() < expiresAt) return expiresAt
      }
    } catch {}
    return null
  })

  const [users, setUsers] = useState<User[]>(mockUsers)
  const [allDemands, setAllDemands] = useState<Demand[]>(initialDemands)
  const [looseProperties, setLooseProperties] = useState<CapturedProperty[]>(initialLooseProperties)
  const [webhookQueue, setWebhookQueue] = useState<WebhookEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<string[]>([])

  const webhookQueueRef = useRef(webhookQueue)
  const loosePropertiesRef = useRef(looseProperties)
  const isProcessingRef = useRef(false)

  useEffect(() => {
    webhookQueueRef.current = webhookQueue
  }, [webhookQueue])

  useEffect(() => {
    loosePropertiesRef.current = looseProperties
  }, [looseProperties])

  const addLog = useCallback(
    (msg: string) =>
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]),
    [],
  )

  const broadcastState = useCallback(
    (
      nextDemands: Demand[],
      nextUsers: User[],
      actionMsg?: string,
      nextLoose?: CapturedProperty[],
    ) => {
      const payload = {
        demands: nextDemands,
        users: nextUsers,
        looseProperties: nextLoose || loosePropertiesRef.current,
        lastAction: actionMsg,
        timestamp: Date.now(),
      }
      const raw = JSON.stringify(payload)
      localStorage.setItem('etic_state_sync', raw)
      try {
        const bc = new BroadcastChannel('etic-ws-sync')
        bc.postMessage(payload)
        bc.close()
      } catch {}
    },
    [],
  )

  const handleSync = useCallback((payloadRaw: string | null) => {
    if (!payloadRaw) return
    try {
      const parsed = JSON.parse(payloadRaw)

      setAllDemands((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(parsed.demands)) return parsed.demands
        return prev
      })

      setUsers((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(parsed.users)) return parsed.users
        return prev
      })

      setLooseProperties((prev) => {
        if (
          parsed.looseProperties &&
          JSON.stringify(prev) !== JSON.stringify(parsed.looseProperties)
        ) {
          return parsed.looseProperties
        }
        return prev
      })

      setCurrentUser((prev) => {
        if (!prev) return prev
        const updatedCurrent = parsed.users.find((u: User) => u.id === prev.id)
        if (updatedCurrent && JSON.stringify(prev) !== JSON.stringify(updatedCurrent)) {
          return updatedCurrent
        }
        return prev
      })

      const lastSyncTs = Number(sessionStorage.getItem('etic_last_processed_ts') || '0')
      if (parsed.timestamp && parsed.timestamp > lastSyncTs) {
        sessionStorage.setItem('etic_last_processed_ts', String(parsed.timestamp))
        if (parsed.lastAction) {
          setAuditLogs((prev) => [
            `[${new Date().toLocaleTimeString()}] (Sincronizado) ${parsed.lastAction}`,
            ...prev,
          ])
        }
      }
    } catch {}
  }, [])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'etic_state_sync') handleSync(e.newValue)
    }
    window.addEventListener('storage', onStorage)

    let bc: BroadcastChannel | null = null
    try {
      bc = new BroadcastChannel('etic-ws-sync')
      bc.onmessage = (e) => handleSync(JSON.stringify(e.data))
    } catch {}

    const interval = setInterval(() => {
      const raw = localStorage.getItem('etic_state_sync')
      handleSync(raw)
    }, 5000)

    return () => {
      window.removeEventListener('storage', onStorage)
      bc?.close()
      clearInterval(interval)
    }
  }, [handleSync])

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
      const payload = { event_type, entity_id, data, timestamp: new Date().toISOString() }

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
            action: `avaliação da demanda de ${demand.clientName} (sem resposta há 72h)`,
          })
          addLog(`[Cron] Demanda de ${demand.clientName} atualizada para Impossível (>72h).`)
        } else if (type === '48h') {
          enqueueWebhook('lembrete_prazo', demand.id, {
            tipo: '48h',
            clientName: demand.clientName,
            location: demand.location,
          })
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

    for (const item of pendingItems) {
      let success = false
      let attempts = item.tentativas

      updateQueueItem(item.id, { status: 'processando' })

      while (!success && attempts < 3) {
        attempts++
        try {
          await new Promise((r) => setTimeout(r, 400))
          success = true
          updateQueueItem(item.id, {
            status: 'enviado',
            tentativas: attempts,
            data_envio: new Date().toISOString(),
            erro_mensagem: undefined,
          })
          addLog(`[Webhook] Sucesso: '${item.event_type}' entregue ao n8n.`)
        } catch (err: any) {
          updateQueueItem(item.id, {
            status: 'falha',
            tentativas: attempts,
            erro_mensagem: err.message,
          })
          addLog(
            `[Webhook] Falha: '${item.event_type}' (Tentativa ${attempts}/3). Erro: ${err.message}`,
          )
        }
      }
    }
    isProcessingRef.current = false
  }, [addLog, updateQueueItem])

  useEffect(() => {
    const intervalId = setInterval(processWebhookCron, 300000)
    return () => clearInterval(intervalId)
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

  const createAction = useCallback(
    (type: PropertyActionType, desc: string, obs?: string): PropertyAction | null => {
      if (!currentUser) return null
      return {
        id: Math.random().toString(36).substr(2, 9),
        type,
        timestamp: new Date().toISOString(),
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        description: desc,
        observations: obs,
      }
    },
    [currentUser],
  )

  const checkDemandAccess = (demand: Demand | undefined) => {
    if (currentUser?.role === 'corretor' || currentUser?.role === 'sdr') {
      if (!demand || demand.createdBy !== currentUser.id) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este recurso.',
        })
        return false
      }
    }
    return true
  }

  const scheduleVisitByCode = useCallback(
    (code: string, payload: any) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemands) {
        const idx = d.capturedProperties?.findIndex((p) => p.code === code) ?? -1
        if (idx !== -1) {
          demand = d
          propIndex = idx
          break
        }
      }

      if (!demand) {
        toast({ variant: 'destructive', description: 'Imóvel não encontrado' })
        return
      }
      if (!checkDemandAccess(demand)) return
      if (currentUser?.role === 'captador' && demand.assignedTo !== currentUser.id) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este recurso.',
        })
        return
      }

      const formattedDate = new Date(payload.date + 'T00:00:00').toLocaleDateString('pt-BR')
      const action = createAction(
        'visita_agendada',
        `Visita agendada para ${formattedDate} às ${payload.time}`,
        payload.obs,
      )

      const updatedProps = [...(demand.capturedProperties || [])]
      updatedProps[propIndex] = {
        ...updatedProps[propIndex],
        visitaDate: payload.date,
        visitaTime: payload.time,
        visitaObs: payload.obs,
        history: action
          ? [action, ...(updatedProps[propIndex].history || [])]
          : updatedProps[propIndex].history,
      }

      const updatedDemand = {
        ...demand,
        status: 'Visita' as DemandStatus,
        capturedProperties: updatedProps,
      }

      const nextDemands = allDemands.map((d) => (d.id === demand!.id ? updatedDemand : d))
      setAllDemands(nextDemands)
      enqueueWebhook('visita_agendada', demand.id, updatedProps[propIndex])
      const msg = `Status alterado para Visita Agendada: Imóvel ${code} por ${currentUser?.name || 'Sistema'}`
      addLog(msg)
      toast({ title: 'Visita Agendada', description: 'O status foi sincronizado com sucesso.' })
      broadcastState(nextDemands, users, msg)
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState, createAction],
  )

  const submitProposalByCode = useCallback(
    (code: string, payload: any) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemands) {
        const idx = d.capturedProperties?.findIndex((p) => p.code === code) ?? -1
        if (idx !== -1) {
          demand = d
          propIndex = idx
          break
        }
      }

      if (!demand) {
        toast({ variant: 'destructive', description: 'Imóvel não encontrado' })
        return
      }
      if (!checkDemandAccess(demand)) return
      if (currentUser?.role === 'captador' && demand.assignedTo !== currentUser.id) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este recurso.',
        })
        return
      }

      const formattedVal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(payload.value)
      const action = createAction('proposta', `Proposta de ${formattedVal} registrada`, payload.obs)

      const updatedProps = [...(demand.capturedProperties || [])]
      updatedProps[propIndex] = {
        ...updatedProps[propIndex],
        propostaDate: payload.date,
        propostaValue: payload.value,
        propostaObs: payload.obs,
        propostaStatus: 'em análise' as const,
        history: action
          ? [action, ...(updatedProps[propIndex].history || [])]
          : updatedProps[propIndex].history,
      }

      const updatedDemand = {
        ...demand,
        status: 'Proposta' as DemandStatus,
        capturedProperties: updatedProps,
      }

      const nextDemands = allDemands.map((d) => (d.id === demand!.id ? updatedDemand : d))
      setAllDemands(nextDemands)
      enqueueWebhook('proposta_enviada', demand.id, updatedProps[propIndex])
      const msg = `Status alterado para Proposta: Imóvel ${code} por ${currentUser?.name || 'Sistema'}`
      addLog(msg)
      toast({ title: 'Proposta Registrada', description: 'O status foi atualizado com sucesso.' })
      broadcastState(nextDemands, users, msg)
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState, createAction],
  )

  const closeDealByCode = useCallback(
    (code: string, payload: any) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemands) {
        const idx = d.capturedProperties?.findIndex((p) => p.code === code) ?? -1
        if (idx !== -1) {
          demand = d
          propIndex = idx
          break
        }
      }

      if (!demand) {
        toast({ variant: 'destructive', description: 'Imóvel não encontrado' })
        return
      }
      if (!checkDemandAccess(demand)) return
      if (currentUser?.role === 'captador' && demand.assignedTo !== currentUser.id) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este recurso.',
        })
        return
      }

      let earnedPoints = 100
      const budgetTarget = demand.maxBudget || demand.budget || 0
      let aboveBudgetInfo = ''
      if (budgetTarget > 0 && payload.value > budgetTarget) {
        earnedPoints += 50
        aboveBudgetInfo = ' (+50 valor acima do orçamento)'
      }
      if (demand.isPrioritized) {
        earnedPoints += 25
      }

      const formattedVal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(payload.value)
      const action = createAction(
        'negocio',
        `Negócio Fechado (${payload.type}) no valor de ${formattedVal}`,
        payload.obs,
      )

      const updatedProps = [...(demand.capturedProperties || [])]
      updatedProps[propIndex] = {
        ...updatedProps[propIndex],
        fechamentoDate: payload.date,
        fechamentoValue: payload.value,
        fechamentoType: payload.type,
        fechamentoObs: payload.obs,
        history: action
          ? [action, ...(updatedProps[propIndex].history || [])]
          : updatedProps[propIndex].history,
      }

      const updatedDemand = {
        ...demand,
        status: 'Negócio' as DemandStatus,
        capturedProperties: updatedProps,
      }

      const nextDemands = allDemands.map((d) => (d.id === demand!.id ? updatedDemand : d))
      setAllDemands(nextDemands)
      enqueueWebhook('negocio_fechado', demand.id, updatedProps[propIndex])

      let nextUsers = users
      if (demand.assignedTo) {
        nextUsers = users.map((u) =>
          u.id === demand!.assignedTo
            ? {
                ...u,
                points: u.points + earnedPoints,
                dailyPoints: u.dailyPoints + earnedPoints,
                weeklyPoints: u.weeklyPoints + earnedPoints,
                monthlyPoints: u.monthlyPoints + earnedPoints,
                stats: {
                  ...u.stats,
                  negociosFechados: u.stats.negociosFechados + 1,
                },
              }
            : u,
        )
        setUsers(nextUsers)
        if (currentUser?.id === demand.assignedTo) {
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  points: prev.points + earnedPoints,
                  dailyPoints: prev.dailyPoints + earnedPoints,
                  weeklyPoints: prev.weeklyPoints + earnedPoints,
                  monthlyPoints: prev.monthlyPoints + earnedPoints,
                  stats: {
                    ...prev.stats,
                    negociosFechados: prev.stats.negociosFechados + 1,
                  },
                }
              : prev,
          )
        }
      }

      const msg = `Status alterado para Negócio Fechado: Imóvel ${code} por ${currentUser?.name || 'Sistema'}. Pontos gerados: ${earnedPoints}`
      addLog(msg)
      toast({
        title: 'Negócio Fechado! 🎉',
        description: `O status foi atualizado. +${earnedPoints} pontos ganhos!${aboveBudgetInfo}`,
        className: 'bg-emerald-600 text-white border-emerald-600',
      })
      broadcastState(nextDemands, nextUsers, msg)
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState, createAction],
  )

  const prioritizeDemand = useCallback(
    (id: string, count: number) => {
      const demand = allDemands.find((d) => d.id === id)
      if (!checkDemandAccess(demand)) return

      setAllDemands((prev) => {
        const next = prev.map((d) =>
          d.id === id ? { ...d, isPrioritized: true, interestedClientsCount: count } : d,
        )
        broadcastState(next, users, 'Demanda priorizada')
        return next
      })
      enqueueWebhook('demanda_priorizada', id, { count })
      addLog(`Demanda priorizada (ID: ${id}) com ${count} interessados`)
      toast({
        title: 'Demanda priorizada!',
        description: 'Os captadores foram notificados',
        className: 'bg-pink-600 text-white border-pink-600',
      })
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState],
  )

  const markDemandLost = useCallback(
    (id: string, reason: string, obs?: string) => {
      const demand = allDemands.find((d) => d.id === id)
      if (!checkDemandAccess(demand)) return

      const action = createAction('perdido', `Demanda marcada como perdida: ${reason}`, obs)

      setAllDemands((prev) => {
        const next = prev.map((d) => {
          if (d.id === id) {
            const updatedDemand = {
              ...d,
              status: 'Perdida' as DemandStatus,
              lostReason: reason,
              lostObs: obs,
            }
            if (updatedDemand.capturedProperties && action) {
              updatedDemand.capturedProperties = updatedDemand.capturedProperties.map((p) => ({
                ...p,
                history: [action, ...(p.history || [])],
              }))
            }
            return updatedDemand
          }
          return d
        })
        broadcastState(next, users, 'Demanda perdida')
        return next
      })
      enqueueWebhook('demanda_perdida', id, { reason, obs })
      addLog(`Demanda perdida (ID: ${id}) motivo: ${reason}`)
      toast({ title: 'Demanda marcada como perdida', description: 'O status foi atualizado.' })
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState, createAction],
  )

  const getSimilarDemands = useCallback(
    (id: string) => {
      const listToSearch =
        currentUser?.role === 'corretor' || currentUser?.role === 'sdr'
          ? allDemands.filter((d) => d.createdBy === currentUser.id)
          : allDemands
      const d = listToSearch.find((x) => x.id === id)
      if (!d) return []
      const dLocs = d.location
        .toLowerCase()
        .split(',')
        .map((s) => s.trim())
      return listToSearch.filter((x) => {
        if (x.id === d.id || x.type !== d.type) return false
        return x.location
          .toLowerCase()
          .split(',')
          .map((s) => s.trim())
          .some((l) => dLocs.includes(l))
      })
    },
    [allDemands, currentUser],
  )

  const visibleDemands = useMemo(() => {
    if (currentUser?.role === 'corretor' || currentUser?.role === 'sdr') {
      return allDemands.filter((d) => d.createdBy === currentUser.id)
    }
    return allDemands
  }, [allDemands, currentUser])

  return (
    <AppContext.Provider
      value={{
        currentUser,
        sessionExpiresAt,
        users,
        demands: visibleDemands,
        looseProperties,
        webhookQueue,
        auditLogs,
        triggerCron,
        login: async (email, password) => {
          const user = users.find((u) => u.email === email)
          if (!user || (password && password !== '123456' && password !== 'Password1')) {
            throw new Error(
              'Erro ao acessar o perfil. Verifique suas credenciais e tente novamente',
            )
          }
          const expiresAt = Date.now() + 86400000 // 24h
          setCurrentUser(user)
          setSessionExpiresAt(expiresAt)
          localStorage.setItem('etic_session', JSON.stringify({ user, expiresAt }))
        },
        logout: () => {
          setCurrentUser(null)
          setSessionExpiresAt(null)
          localStorage.removeItem('etic_session')
        },
        requestPasswordReset: (email) => {
          // just a mock
        },
        addDemand: (d) => {
          if (currentUser?.role === 'corretor' && d.type !== 'Venda') {
            toast({
              variant: 'destructive',
              title: 'Acesso negado',
              description: 'Corretores só podem criar demandas de Venda.',
            })
            return
          }
          const newDemand = {
            ...d,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
          } as Demand
          setAllDemands((p) => {
            const next = [newDemand, ...p]
            broadcastState(next, users, 'Nova demanda')
            return next
          })
          enqueueWebhook('nova_demanda', newDemand.id, newDemand)
        },
        updateDemandStatus: (i, s) => {
          if (!checkDemandAccess(allDemands.find((d) => d.id === i))) return

          setAllDemands((p) => {
            const next = p.map((d) => (d.id === i ? { ...d, status: s } : d))
            const updated = next.find((x) => x.id === i)
            if (updated && s === 'Em Captação')
              enqueueWebhook('confirmacao_gestor', updated.id, updated)
            broadcastState(next, users, 'Status de demanda atualizado')
            return next
          })
        },
        submitDemandResponse: (id, action, payload) => {
          const demand = allDemands.find((d) => d.id === id)
          if (!checkDemandAccess(demand)) return { success: false, message: 'Acesso negado' }

          if (action === 'encontrei' && demand) {
            if (
              demand.status === 'Perdida' ||
              demand.status === 'Impossível' ||
              demand.status === 'Sem demanda'
            ) {
              return {
                success: false,
                message: 'Não é possível adicionar imóveis a uma demanda fechada',
              }
            }
            if (currentUser?.status === 'inativo') {
              return { success: false, message: 'Seu acesso foi desativado' }
            }

            const existingProps = demand.capturedProperties || []
            if (existingProps.length >= 10) {
              return { success: false, message: 'Limite de 10 imóveis por demanda atingido' }
            }

            const code = payload?.code || `IMV-${Math.floor(Math.random() * 1000)}`
            if (existingProps.some((p) => p.code === code)) {
              return { success: false, message: 'Este imóvel já foi registrado para esta demanda' }
            }

            const isPriority = demand.isPrioritized
            const similarDemands = getSimilarDemands(demand.id)
            const totalInterested = similarDemands.length + 1 + (demand.interestedClientsCount || 0)

            const seq = existingProps.length + 1
            const hAction = createAction(
              'captacao',
              `Imóvel captado e associado à demanda (${seq}º imóvel)`,
            )

            const newProp: CapturedProperty = {
              code,
              value: payload?.value || demand.budget || demand.maxBudget,
              neighborhood:
                payload?.neighborhood || demand.location.split(',')[0] || 'Desconhecido',
              bairro_tipo: payload?.bairro_tipo || 'listado',
              docCompleta: payload?.docCompleta || false,
              obs: payload?.obs,
              photoUrl: `https://img.usecurling.com/p/400/300?q=house&seed=${demand.id}_${seq}`,
              capturedAt: new Date().toISOString(),
              history: hAction ? [hAction] : [],
              numero_imovel_para_demanda: seq,
              demandas_atendidas_ids: [demand.id],
              tipo_vinculacao: 'vinculado',
              captador_id: currentUser?.id,
              captador_name: currentUser?.name,
            }

            const updatedDemand = {
              ...demand,
              status:
                demand.status === 'Pendente' || demand.status === 'Em Captação'
                  ? ('Captado sob demanda' as DemandStatus)
                  : demand.status,
              capturedProperties: [...existingProps, newProp],
            }

            const nextDemands = allDemands.map((d) => (d.id === id ? updatedDemand : d))
            setAllDemands(nextDemands)

            let earnedPoints = 50
            if (isPriority || totalInterested >= 5) {
              earnedPoints += 25
            }

            let nextUsers = users
            if (currentUser) {
              nextUsers = users.map((u) =>
                u.id === currentUser.id
                  ? {
                      ...u,
                      points: u.points + earnedPoints,
                      dailyPoints: u.dailyPoints + earnedPoints,
                      weeklyPoints: u.weeklyPoints + earnedPoints,
                      monthlyPoints: u.monthlyPoints + earnedPoints,
                    }
                  : u,
              )
              setUsers(nextUsers)
              setCurrentUser((prev) =>
                prev && prev.id === currentUser.id
                  ? nextUsers.find((u) => u.id === prev.id) || prev
                  : prev,
              )

              toast({
                title: 'Imóvel Registrado! 🎉',
                description: `Você ganhou +${earnedPoints} pontos por captar este imóvel!`,
                className: 'bg-emerald-600 text-white border-emerald-600',
              })
            }

            broadcastState(
              nextDemands,
              nextUsers,
              `Imóvel captado: ${updatedDemand.clientName}${isPriority ? ' (Priorizado)' : ''}`,
            )

            let msg = `🏠 IMÓVEL CAPTADO! Para ${demand.clientName} por ${currentUser?.name}`
            if (seq > 1)
              msg = `🏠 NOVO IMÓVEL! MAIS um imóvel para ${demand.clientName} (${seq}º imóvel)`

            enqueueWebhook('imovel_captado', demand.id, {
              mensagem: msg,
              imovel: {
                ...newProp,
                bairro_imovel: newProp.neighborhood,
                bairro_tipo: newProp.bairro_tipo,
              },
              cliente: demand.clientName,
            })
          }
          return { success: true, message: '' }
        },
        submitIndependentCapture: (payload) => {
          const code = payload?.code || `IMV-${Math.floor(Math.random() * 1000)}`
          const hAction = createAction('captacao', 'Imóvel captado como disponível para todos')

          const newProp: CapturedProperty = {
            code,
            value: payload.value,
            neighborhood: payload.neighborhood,
            bairro_tipo: payload.bairro_tipo,
            docCompleta: payload.docCompleta,
            obs: payload.obs,
            photoUrl: `https://img.usecurling.com/p/400/300?q=house&seed=${code}`,
            capturedAt: new Date().toISOString(),
            history: hAction ? [hAction] : [],
            tipo_vinculacao: 'solto',
            captador_id: currentUser?.id,
            captador_name: currentUser?.name,
          }

          setLooseProperties((prev) => {
            const nextLoose = [newProp, ...prev]

            let nextUsers = users
            if (currentUser) {
              nextUsers = users.map((u) =>
                u.id === currentUser.id
                  ? {
                      ...u,
                      points: u.points + 35,
                      dailyPoints: u.dailyPoints + 35,
                      weeklyPoints: u.weeklyPoints + 35,
                      monthlyPoints: u.monthlyPoints + 35,
                    }
                  : u,
              )
              setUsers(nextUsers)
              setCurrentUser((prevU) =>
                prevU && prevU.id === currentUser.id
                  ? nextUsers.find((u) => u.id === prevU.id) || prevU
                  : prevU,
              )
            }

            toast({
              title: 'Imóvel Disponível Registrado! 🔓',
              description: `Você ganhou +35 pontos. O imóvel está disponível para todos.`,
              className: 'bg-emerald-600 text-white border-emerald-600',
            })

            broadcastState(allDemands, nextUsers, 'Imóvel solto captado', nextLoose)
            return nextLoose
          })

          enqueueWebhook('imovel_captado_solto', 'independente', {
            mensagem: `🏠 NOVO IMÓVEL! Disponível para todos`,
            imovel: newProp,
          })
        },
        claimLooseProperty: (code, demandId) => {
          let success = false
          let message = ''

          setAllDemands((prevDemands) => {
            const demandIndex = prevDemands.findIndex((d) => d.id === demandId)
            if (demandIndex === -1) {
              message = 'Demanda não encontrada'
              return prevDemands
            }

            const propIndex = loosePropertiesRef.current.findIndex((p) => p.code === code)
            if (propIndex === -1) {
              message = 'Imóvel não encontrado ou já reivindicado'
              return prevDemands
            }

            const prop = loosePropertiesRef.current[propIndex]
            const demand = prevDemands[demandIndex]

            const action = createAction(
              'captacao',
              `Imóvel reivindicado e vinculado à demanda de ${demand.clientName}`,
            )

            const newProp: CapturedProperty = {
              ...prop,
              tipo_vinculacao: 'vinculado',
              demandas_atendidas_ids: [...(prop.demandas_atendidas_ids || []), demandId],
              numero_imovel_para_demanda: (demand.capturedProperties?.length || 0) + 1,
              history: action ? [action, ...(prop.history || [])] : prop.history,
            }

            const updatedDemand = {
              ...demand,
              status:
                demand.status === 'Pendente' || demand.status === 'Em Captação'
                  ? ('Captado sob demanda' as DemandStatus)
                  : demand.status,
              capturedProperties: [...(demand.capturedProperties || []), newProp],
            }

            success = true

            const nextLoose = loosePropertiesRef.current.filter((p) => p.code !== code)
            setLooseProperties(nextLoose)

            enqueueWebhook('imovel_reivindicado', demandId, {
              mensagem: `Seu imóvel foi vinculado a ${demand.clientName}`,
              captadorId: prop.captador_id,
            })

            const nextDemands = prevDemands.map((d) => (d.id === demandId ? updatedDemand : d))

            broadcastState(nextDemands, users, 'Imóvel reivindicado', nextLoose)
            return nextDemands
          })

          return { success, message }
        },
        scheduleVisit: (id, payload) => {},
        closeDeal: (id, payload) => {},
        scheduleVisitByCode,
        submitProposalByCode,
        closeDealByCode,
        prioritizeDemand,
        markDemandLost,
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
