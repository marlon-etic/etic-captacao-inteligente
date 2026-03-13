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
  AppNotification,
} from '@/types'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'

interface AppState {
  currentUser: User | null
  sessionExpiresAt: number | null
  users: User[]
  demands: Demand[]
  looseProperties: CapturedProperty[]
  webhookQueue: WebhookEvent[]
  auditLogs: string[]
  notifications: AppNotification[]
  markNotificationAsRead: (id: string) => void
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
  logContactAttempt: (
    demandId: string,
    code: string,
    method: 'whatsapp' | 'interno',
    message?: string,
  ) => void
  logSolicitorContactAttempt: (
    demandId: string,
    method: 'whatsapp' | 'email' | 'interno',
    message?: string,
  ) => void
  getMatchesForProperty: (property: CapturedProperty) => { demand: Demand; score: number }[]
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
    phone: '5511999999999',
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
    phone: '5511988888888',
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
    phone: '5511977777777',
    tipo_demanda: 'vendas',
    tipos_demanda_solicitados: ['locacao', 'vendas'],
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
  {
    id: '5',
    name: 'Admin Sistema',
    email: 'admin@etic.com',
    role: 'admin',
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
        propertyType: 'Venda',
        bedrooms: 3,
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
        propertyType: 'Venda',
        bedrooms: 4,
      },
    ],
  },
  {
    ...createDem('d4', 'Fernanda Lima', 'Centro', 73, 'Até 90 dias ou +'),
    type: 'Aluguel',
    budget: 4500,
    minBudget: 3000,
    maxBudget: 5000,
    description: 'Procuro apartamento para alugar com urgência próximo ao metrô.',
  },
]

const initialLooseProperties: CapturedProperty[] = [
  {
    code: 'LP-101',
    value: 900000,
    neighborhood: 'Jardins',
    bairro_tipo: 'listado',
    docCompleta: true,
    photoUrl: 'https://img.usecurling.com/p/400/300?q=house&seed=lp1',
    capturedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    tipo_vinculacao: 'solto',
    status_reivindicacao: 'disponivel',
    captador_id: '1',
    captador_name: 'Ana Silva',
    propertyType: 'Venda',
    bedrooms: 3,
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
        if (Date.now() < expiresAt && user) return user
      }
    } catch {
      // ignore
    }
    return null
  })

  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('etic_session')
      if (stored) {
        const { expiresAt } = JSON.parse(stored)
        if (Date.now() < expiresAt) return expiresAt
      }
    } catch {
      // ignore
    }
    return null
  })

  const [users, setUsers] = useState<User[]>(() => {
    try {
      const raw = localStorage.getItem('etic_state_sync')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.users && Array.isArray(parsed.users)) {
          const merged = [...parsed.users]
          mockUsers.forEach((mu) => {
            if (!merged.find((u) => u.email === mu.email)) {
              merged.push(mu)
            }
          })
          return merged
        }
      }
    } catch {
      // ignore
    }
    return mockUsers
  })

  const [allDemands, setAllDemands] = useState<Demand[]>(initialDemands)
  const [looseProperties, setLooseProperties] = useState<CapturedProperty[]>(initialLooseProperties)
  const [webhookQueue, setWebhookQueue] = useState<WebhookEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<string[]>([])
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const raw = localStorage.getItem('etic_state_sync')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.notifications && Array.isArray(parsed.notifications)) {
          return parsed.notifications
        }
      }
    } catch {
      // ignore
    }
    return []
  })

  const webhookQueueRef = useRef(webhookQueue)
  const loosePropertiesRef = useRef(looseProperties)
  const isProcessingRef = useRef(false)
  const prevLooseRef = useRef<CapturedProperty[]>([])

  useEffect(() => {
    webhookQueueRef.current = webhookQueue
  }, [webhookQueue])

  useEffect(() => {
    loosePropertiesRef.current = looseProperties
  }, [looseProperties])

  // Real-time toast logic for new available loose properties
  useEffect(() => {
    if (!currentUser) return

    const newProps = looseProperties.filter(
      (p) => !prevLooseRef.current.find((old) => old.code === p.code),
    )

    newProps.forEach((np) => {
      if (np.status_reivindicacao === 'disponivel') {
        let isEligible = false
        if (np.propertyType === 'Aluguel') {
          isEligible =
            currentUser.role === 'sdr' ||
            (currentUser.role === 'corretor' &&
              currentUser.tipos_demanda_solicitados?.includes('locacao'))
        } else if (np.propertyType === 'Venda') {
          isEligible = currentUser.role === 'corretor'
        }

        if (isEligible && np.captador_id !== currentUser.id) {
          toast({
            title:
              np.propertyType === 'Aluguel'
                ? '🏠 NOVO IMÓVEL DE ALUGUEL!'
                : '🏢 NOVO IMÓVEL DE VENDA!',
            description: `${np.neighborhood} | R$ ${np.value} | ${np.bedrooms || 0} dorms.`,
            action: (
              <ToastAction
                altText="Ver Imóvel"
                onClick={() => {
                  // Direct the user visually if they are not already there
                }}
              >
                Ver
              </ToastAction>
            ),
            duration: 8000,
          })
        }
      }
    })

    prevLooseRef.current = looseProperties
  }, [looseProperties, currentUser])

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
      nextNotifs?: AppNotification[],
    ) => {
      const payload = {
        demands: nextDemands,
        users: nextUsers,
        looseProperties: nextLoose || loosePropertiesRef.current,
        notifications: nextNotifs || notifications,
        lastAction: actionMsg,
        timestamp: Date.now(),
      }
      const raw = JSON.stringify(payload)
      localStorage.setItem('etic_state_sync', raw)
      try {
        const bc = new BroadcastChannel('etic-ws-sync')
        bc.postMessage(payload)
        bc.close()
      } catch {
        // ignore
      }
    },
    [notifications],
  )

  const handleSync = useCallback((payloadRaw: string | null) => {
    if (!payloadRaw) return
    try {
      const parsed = JSON.parse(payloadRaw)

      setAllDemands((prev) => {
        if (parsed.demands && JSON.stringify(prev) !== JSON.stringify(parsed.demands))
          return parsed.demands
        return prev
      })

      setUsers((prev) => {
        if (!parsed.users || !Array.isArray(parsed.users)) return prev
        const merged = [...parsed.users]
        let added = false
        mockUsers.forEach((mu) => {
          if (!merged.find((u) => u.email === mu.email)) {
            merged.push(mu)
            added = true
          }
        })
        if (added || JSON.stringify(prev) !== JSON.stringify(merged)) {
          return merged
        }
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

      setNotifications((prev) => {
        if (parsed.notifications && JSON.stringify(prev) !== JSON.stringify(parsed.notifications)) {
          return parsed.notifications
        }
        return prev
      })

      setCurrentUser((prev) => {
        if (!prev) return prev
        const updatedCurrent = parsed.users?.find((u: User) => u.id === prev.id)
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
    } catch {
      // ignore
    }
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
    } catch {
      // ignore
    }

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

  const addPoints = useCallback(
    (amount: number, userId?: string) => {
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
    },
    [currentUser],
  )

  const triggerCron = useCallback(() => {
    const now = Date.now()
    const actions: Array<{ type: string; demand: Demand; oldAssignedTo?: string }> = []

    setAllDemands((prev) => {
      let changed = false
      const next = prev.map((d) => {
        const updated = { ...d }
        const createdAtMs = new Date(d.createdAt).getTime()
        const hrsSinceCreation = (now - createdAtMs) / 3600000

        if (d.status === 'Pendente' && !d.isExtension48h) {
          if (hrsSinceCreation >= 24 && !d.reassigned_24h) {
            updated.reassigned_24h = true
            updated.isRepescagem = true
            const oldAssignedTo = d.assignedTo
            updated.assignedTo = undefined
            actions.push({ type: 'reassign_24h', demand: updated, oldAssignedTo })
            changed = true
          } else if (hrsSinceCreation >= 12 && hrsSinceCreation < 24 && !d.notificada_12h) {
            updated.notificada_12h = true
            actions.push({ type: 'notify_12h', demand: updated })
            changed = true
          }
        } else if (d.status === 'Pendente' && d.isExtension48h && d.extensionRequestedAt) {
          const extMs = new Date(d.extensionRequestedAt).getTime()
          const hrsSinceExt = (now - extMs) / 3600000
          if (hrsSinceExt >= 48 && !d.notificada_ext_48h) {
            updated.notificada_ext_48h = true
            updated.status = 'Impossível'
            actions.push({ type: 'notify_ext_48h_fail', demand: updated })
            changed = true
          } else if (hrsSinceExt >= 24 && hrsSinceExt < 48 && !d.notificada_ext_24h) {
            updated.notificada_ext_24h = true
            actions.push({ type: 'notify_ext_24h', demand: updated })
            changed = true
          }
        }

        return updated
      })
      return changed ? next : prev
    })

    setTimeout(() => {
      actions.forEach(({ type, demand, oldAssignedTo }) => {
        if (type === 'reassign_24h') {
          if (oldAssignedTo) {
            addPoints(-20, oldAssignedTo)
            const newNotif = {
              id: Math.random().toString(36).substr(2, 9),
              userId: oldAssignedTo,
              message: `❌ Demanda de ${demand.clientName} foi repassada para outro captador (Prazo 24h esgotado). -20 pts`,
              read: false,
              createdAt: new Date().toISOString(),
            }
            setNotifications((p) => [newNotif, ...p])
          }
          addLog(`[Cron] Demanda ${demand.clientName} repassada (24h esgotado).`)
        } else if (type === 'notify_12h') {
          if (demand.assignedTo) {
            const newNotif = {
              id: Math.random().toString(36).substr(2, 9),
              userId: demand.assignedTo,
              message: `⏰ Você tem 12h para responder a demanda de ${demand.clientName}`,
              read: false,
              createdAt: new Date().toISOString(),
            }
            setNotifications((p) => [newNotif, ...p])
          }
        } else if (type === 'notify_ext_24h') {
          if (demand.assignedTo) {
            const newNotif = {
              id: Math.random().toString(36).substr(2, 9),
              userId: demand.assignedTo,
              message: `Você ainda está buscando imóvel para ${demand.clientName}`,
              read: false,
              createdAt: new Date().toISOString(),
            }
            setNotifications((p) => [newNotif, ...p])
          }
        } else if (type === 'notify_ext_48h_fail') {
          addLog(
            `[Cron] Demanda ${demand.clientName} marcada como Impossível (48h extra esgotado).`,
          )
        }
      })
    }, 100)
  }, [addLog, addPoints])

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

  const checkDemandAccess = (demand: Demand | undefined, property?: CapturedProperty) => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'gestor') return true

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

    if (currentUser?.role === 'captador') {
      if (property && property.captador_id !== currentUser.id) {
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
        toast({ variant: 'destructive', description: 'Nenhum imóvel encontrado' })
        return
      }
      const prop = demand.capturedProperties![propIndex]
      if (!checkDemandAccess(demand, prop)) return

      const formattedDate = new Date(payload.date + 'T00:00:00').toLocaleDateString('pt-BR')
      const action = createAction(
        'visita_agendada',
        `Visita agendada para ${formattedDate} às ${payload.time}`,
        payload.obs,
      )

      const updatedProps = [...(demand.capturedProperties || [])]
      updatedProps[propIndex] = {
        ...prop,
        visitaDate: payload.date,
        visitaTime: payload.time,
        visitaObs: payload.obs,
        history: action ? [action, ...(prop.history || [])] : prop.history,
      }

      const updatedDemand = {
        ...demand,
        status: 'Visita' as DemandStatus,
        capturedProperties: updatedProps,
      }

      const nextDemands = allDemands.map((d) => (d.id === demand!.id ? updatedDemand : d))
      setAllDemands(nextDemands)

      let nextUsers = users
      const captadorId = prop.captador_id
      if (captadorId) {
        nextUsers = nextUsers.map((u) =>
          u.id === captadorId
            ? { ...u, points: u.points + 25, dailyPoints: u.dailyPoints + 25 }
            : u,
        )
        setUsers(nextUsers)

        if (currentUser?.id === captadorId) {
          setCurrentUser((prev) =>
            prev ? { ...prev, points: prev.points + 25, dailyPoints: prev.dailyPoints + 25 } : prev,
          )
        }
      }

      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        userId: captadorId || '',
        message: `Visita agendada para o seu imóvel ${code} por ${currentUser?.name}. (+25 pts)`,
        read: false,
        createdAt: new Date().toISOString(),
      }

      const nextNotifs = captadorId ? [newNotif, ...notifications] : notifications
      if (captadorId) setNotifications(nextNotifs)

      enqueueWebhook('visita_agendada', demand.id, updatedProps[propIndex])
      const msg = `Status alterado para Visita Agendada: Imóvel ${code} por ${currentUser?.name || 'Sistema'}`
      addLog(msg)
      toast({ title: 'Visita Agendada', description: 'O status foi sincronizado com sucesso.' })
      broadcastState(nextDemands, nextUsers, msg, undefined, nextNotifs)
    },
    [
      allDemands,
      currentUser,
      users,
      notifications,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
    ],
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
        toast({ variant: 'destructive', description: 'Nenhum imóvel encontrado' })
        return
      }

      const prop = demand.capturedProperties![propIndex]
      if (!checkDemandAccess(demand, prop)) return

      const formattedVal = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(payload.value)
      const action = createAction('proposta', `Proposta de ${formattedVal} registrada`, payload.obs)

      const updatedProps = [...(demand.capturedProperties || [])]
      updatedProps[propIndex] = {
        ...prop,
        propostaDate: payload.date,
        propostaValue: payload.value,
        propostaObs: payload.obs,
        propostaStatus: 'em análise' as const,
        history: action ? [action, ...(prop.history || [])] : prop.history,
      }

      const updatedDemand = {
        ...demand,
        status: 'Proposta' as DemandStatus,
        capturedProperties: updatedProps,
      }

      const nextDemands = allDemands.map((d) => (d.id === demand!.id ? updatedDemand : d))
      setAllDemands(nextDemands)

      let nextNotifs = notifications
      if (prop.captador_id) {
        const newNotif = {
          id: Math.random().toString(36).substr(2, 9),
          userId: prop.captador_id,
          message: `Nova proposta registrada no seu imóvel ${code} por ${currentUser?.name}.`,
          read: false,
          createdAt: new Date().toISOString(),
        }
        nextNotifs = [newNotif, ...notifications]
        setNotifications(nextNotifs)
      }

      enqueueWebhook('proposta_enviada', demand.id, updatedProps[propIndex])
      const msg = `Status alterado para Proposta: Imóvel ${code} por ${currentUser?.name || 'Sistema'}`
      addLog(msg)
      toast({ title: 'Proposta Registrada', description: 'O status foi atualizado com sucesso.' })
      broadcastState(nextDemands, users, msg, undefined, nextNotifs)
    },
    [
      allDemands,
      currentUser,
      users,
      notifications,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
    ],
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
        toast({ variant: 'destructive', description: 'Nenhum imóvel encontrado' })
        return
      }

      const prop = demand.capturedProperties![propIndex]
      if (!checkDemandAccess(demand, prop)) return

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
        ...prop,
        fechamentoDate: payload.date,
        fechamentoValue: payload.value,
        fechamentoType: payload.type,
        fechamentoObs: payload.obs,
        history: action ? [action, ...(prop.history || [])] : prop.history,
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
      const captadorId = prop.captador_id
      if (captadorId) {
        nextUsers = users.map((u) =>
          u.id === captadorId
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
        if (currentUser?.id === captadorId) {
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

      const newNotif = {
        id: Math.random().toString(36).substr(2, 9),
        userId: captadorId || '',
        message: `Negócio fechado no seu imóvel ${code} por ${currentUser?.name}! (+${earnedPoints} pts)${aboveBudgetInfo}`,
        read: false,
        createdAt: new Date().toISOString(),
      }

      const nextNotifs = captadorId ? [newNotif, ...notifications] : notifications
      if (captadorId) setNotifications(nextNotifs)

      const msg = `Status alterado para Negócio Fechado: Imóvel ${code} por ${currentUser?.name || 'Sistema'}. Pontos gerados: ${earnedPoints}`
      addLog(msg)
      toast({
        title: 'Negócio Fechado! 🎉',
        description: `O status foi atualizado. +${earnedPoints} pontos concedidos ao captador.`,
        className: 'bg-emerald-600 text-white border-emerald-600',
      })
      broadcastState(nextDemands, nextUsers, msg, undefined, nextNotifs)
    },
    [
      allDemands,
      currentUser,
      users,
      notifications,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
    ],
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
      toast({ title: 'Demanda marked como perdida', description: 'O status foi atualizado.' })
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState, createAction],
  )

  const logContactAttempt = useCallback(
    (demandId: string, code: string, method: 'whatsapp' | 'interno', message?: string) => {
      let demand = allDemands.find((d) => d.id === demandId)
      if (!demand) return

      const propIndex = demand.capturedProperties?.findIndex((p) => p.code === code) ?? -1
      if (propIndex === -1) return

      const prop = demand.capturedProperties![propIndex]

      if (!checkDemandAccess(demand, prop)) return

      const typeStr = method === 'whatsapp' ? 'WhatsApp' : 'Chat Interno'
      const action = createAction(
        'contato_captador',
        `${currentUser?.name} entrou em contato (${typeStr})`,
        message || `Contato via ${typeStr}`,
      )

      if (!action) return

      const nextProps = [...demand.capturedProperties!]
      nextProps[propIndex] = {
        ...prop,
        history: [action, ...(prop.history || [])],
      }

      const updatedDemand = { ...demand, capturedProperties: nextProps }
      const nextDemands = allDemands.map((d) => (d.id === demandId ? updatedDemand : d))

      setAllDemands(nextDemands)

      let nextNotifs = notifications
      const targetUserId = currentUser?.role === 'captador' ? demand.createdBy : prop.captador_id

      if (targetUserId) {
        const roleName = currentUser?.role === 'captador' ? 'Captador' : 'SDR/Corretor'
        const notifMsg = `${roleName} ${currentUser?.name} enviou uma mensagem sobre o imóvel ${code}.`

        const newNotif = {
          id: Math.random().toString(36).substr(2, 9),
          userId: targetUserId,
          message: notifMsg,
          read: false,
          createdAt: new Date().toISOString(),
        }
        nextNotifs = [newNotif, ...notifications]
        setNotifications(nextNotifs)
      }

      const broadcastMsg = `${currentUser?.name} entrou em contato sobre imóvel ${code}`
      broadcastState(nextDemands, users, broadcastMsg, undefined, nextNotifs)

      enqueueWebhook('contato_captador_registrado', demandId, {
        imovel_code: code,
        sdr_corretor_id: currentUser?.role !== 'captador' ? currentUser?.id : demand.createdBy,
        captador_id: prop.captador_id,
        tipo_contato: method,
        status: 'registrado',
        mensagem: message,
      })

      if (method === 'interno') {
        toast({
          title: 'Mensagem Enviada',
          description: `Sua mensagem foi enviada com sucesso.`,
        })
      }
    },
    [allDemands, currentUser, users, notifications, createAction, broadcastState, enqueueWebhook],
  )

  const logSolicitorContactAttempt = useCallback(
    (demandId: string, method: 'whatsapp' | 'email' | 'interno', message?: string) => {
      let demand = allDemands.find((d) => d.id === demandId)
      if (!demand) return

      setAllDemands((prev) => {
        const next = prev.map((d) => {
          if (d.id === demandId) {
            return { ...d, lastContactedSolicitorAt: new Date().toISOString() }
          }
          return d
        })
        broadcastState(next, users, `Contato com solicitante registrado`)
        return next
      })

      let nextNotifs = notifications
      if (method === 'interno') {
        const newNotif = {
          id: Math.random().toString(36).substr(2, 9),
          userId: demand.createdBy,
          message: `Captador ${currentUser?.name} enviou uma dúvida sobre a demanda de ${demand.clientName}${message ? `: ${message}` : '.'}`,
          read: false,
          createdAt: new Date().toISOString(),
        }
        nextNotifs = [newNotif, ...notifications]
        setNotifications(nextNotifs)
      }

      enqueueWebhook('contato_solicitante_registrado', demandId, {
        sdr_corretor_id: demand.createdBy,
        captador_id: currentUser?.id,
        tipo_contato: method,
        status: 'registrado',
        mensagem: message,
      })

      if (method === 'interno') {
        toast({
          title: 'Mensagem Enviada',
          description: `Sua mensagem foi enviada ao solicitante com sucesso.`,
        })
      }
    },
    [allDemands, currentUser, users, notifications, broadcastState, enqueueWebhook],
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
        notifications,
        triggerCron,
        markNotificationAsRead: (id: string) => {
          setNotifications((prev) => {
            const next = prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            broadcastState(allDemands, users, undefined, loosePropertiesRef.current, next)
            return next
          })
        },
        getMatchesForProperty: (property: CapturedProperty) => {
          if (property.tipo_vinculacao === 'vinculado') return []

          const matches = allDemands
            .map((demand) => {
              if (
                ['Perdida', 'Impossível', 'Sem demanda', 'Negócio', 'Arquivado'].includes(
                  demand.status,
                )
              )
                return null
              if (property.propertyType && demand.type && property.propertyType !== demand.type)
                return null

              let score = 0

              const pLoc = property.neighborhood?.toLowerCase() || ''
              const dLocs =
                demand.location
                  ?.toLowerCase()
                  .split(',')
                  .map((s) => s.trim()) || []
              if (dLocs.some((dLoc) => dLoc.includes(pLoc) || pLoc.includes(dLoc))) {
                score += 40
              }

              const budgetMax = (demand.maxBudget || demand.budget || 0) * 1.1
              const budgetMin = (demand.minBudget || 0) * 0.9
              if (property.value >= budgetMin && property.value <= budgetMax) {
                score += 30
              }

              if (property.bedrooms && demand.bedrooms) {
                if (property.bedrooms >= demand.bedrooms) score += 20
              } else {
                score += 10
              }

              if (score > 0) return { demand, score }
              return null
            })
            .filter(Boolean) as { demand: Demand; score: number }[]

          return matches.sort((a, b) => b.score - a.score).slice(0, 3)
        },
        login: async (email, password) => {
          const cleanEmail = email.toLowerCase().trim()
          const cleanPass = password?.trim()

          let user = users.find((u) => u.email.toLowerCase() === cleanEmail)

          if (!user) {
            user = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail)
          }

          if (!user || (cleanPass && cleanPass !== '123456' && cleanPass !== 'Password1')) {
            throw new Error(
              'Erro ao acessar o perfil. Verifique suas credenciais e tente novamente',
            )
          }

          const expiresAt = Date.now() + 86400000 // 24h

          setUsers((prev) => {
            if (!prev.find((u) => u.id === user!.id)) {
              return [...prev, user!]
            }
            return prev
          })

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
          if (!demand) return { success: false, message: 'Demanda não encontrada' }
          if (!checkDemandAccess(demand)) return { success: false, message: 'Acesso negado' }

          if (action === 'encontrei') {
            if (['Perdida', 'Impossível', 'Sem demanda', 'Negócio'].includes(demand.status)) {
              return {
                success: false,
                message: 'Não é possível vincular a uma demanda fechada',
              }
            }
            if (payload?.propertyType && payload.propertyType !== demand.type) {
              return {
                success: false,
                message: 'Tipo de imóvel não corresponde ao tipo de demanda',
              }
            }
            if (currentUser?.status === 'inativo') {
              return { success: false, message: 'Seu acesso foi desativado' }
            }

            const existingProps = demand.capturedProperties || []
            if (existingProps.length >= 100) {
              return { success: false, message: 'Limite de 100 imóveis por demanda atingido' }
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
              propertyType: demand.type,
              bedrooms: payload?.bedrooms,
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
            return { success: true, message: '' }
          } else if (action === 'nao_encontrei') {
            const hAction = createAction('perdido', `Sinalizou não encontrado: ${payload.reason}`)
            let updatedDemand = { ...demand }

            if (payload.continueSearch) {
              updatedDemand.isExtension48h = true
              updatedDemand.extensionRequestedAt = new Date().toISOString()
              if (updatedDemand.capturedProperties && hAction) {
                updatedDemand.capturedProperties = updatedDemand.capturedProperties.map((p) => ({
                  ...p,
                  history: [hAction, ...(p.history || [])],
                }))
              }
              toast({
                title: 'Busca Estendida',
                description: 'Você tem mais 48h para buscar um imóvel para este cliente.',
                className: 'bg-orange-600 text-white border-orange-600',
              })
            } else {
              updatedDemand.status = 'Perdida'
              updatedDemand.lostReason = payload.reason
              if (updatedDemand.capturedProperties && hAction) {
                updatedDemand.capturedProperties = updatedDemand.capturedProperties.map((p) => ({
                  ...p,
                  history: [hAction, ...(p.history || [])],
                }))
              }
              toast({ title: 'Demanda Perdida', description: 'Removida do seu painel.' })
            }

            setAllDemands((p) => {
              const next = p.map((d) => (d.id === id ? updatedDemand : d))
              broadcastState(next, users, 'Ação não encontrei registrada')
              return next
            })
            return { success: true, message: '' }
          }
          return { success: false, message: 'Ação desconhecida' }
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
            status_reivindicacao: 'disponivel',
            captador_id: currentUser?.id,
            captador_name: currentUser?.name,
            propertyType: payload.propertyType,
            bedrooms: payload.bedrooms,
          }

          let hasEligible = false
          const eligibleUsers = users.filter((u) => {
            if (u.status === 'inativo') return false
            if (payload.propertyType === 'Aluguel') {
              if (
                u.role === 'sdr' ||
                (u.role === 'corretor' && u.tipos_demanda_solicitados?.includes('locacao'))
              ) {
                hasEligible = true
                return true
              }
            } else if (payload.propertyType === 'Venda') {
              if (u.role === 'corretor') {
                hasEligible = true
                return true
              }
            }
            return false
          })

          if (!hasEligible) {
            addLog(`Nenhum usuário disponível para este tipo de imóvel (${payload.propertyType})`)
          }

          const newNotifs = eligibleUsers.map((u) => ({
            id: Math.random().toString(36).substr(2, 9),
            userId: u.id,
            message: `${payload.propertyType === 'Aluguel' ? '🏠' : '🏢'} NOVO IMÓVEL DISPONÍVEL! ${payload.propertyType} em ${payload.neighborhood}, R$ ${payload.value}, ${payload.bedrooms || 0} dorms.`,
            read: false,
            createdAt: new Date().toISOString(),
          }))

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

            setNotifications((prevN) => [...newNotifs, ...prevN])

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

            const demand = prevDemands[demandIndex]

            if (['Perdida', 'Impossível', 'Sem demanda', 'Negócio'].includes(demand.status)) {
              message = 'Não é possível vincular a uma demanda fechada'
              return prevDemands
            }

            const propIndex = loosePropertiesRef.current.findIndex((p) => p.code === code)
            if (propIndex === -1) {
              message = 'Imóvel não encontrado'
              return prevDemands
            }

            const prop = loosePropertiesRef.current[propIndex]

            if (prop.status_reivindicacao && prop.status_reivindicacao !== 'disponivel') {
              message = 'Este imóvel já foi reivindicado'
              return prevDemands
            }

            if (currentUser?.role === 'captador' && currentUser.id !== prop.captador_id) {
              message = 'Você não tem permissão para reivindicar este imóvel'
              return prevDemands
            }

            if (prop.propertyType && demand.type && prop.propertyType !== demand.type) {
              message = 'Tipo de imóvel não corresponde ao tipo de demanda'
              return prevDemands
            }

            const action = createAction(
              'captacao',
              `Imóvel reivindicado e vinculado à demanda de ${demand.clientName}`,
            )

            const newProp: CapturedProperty = {
              ...prop,
              tipo_vinculacao: 'vinculado',
              status_reivindicacao: 'reivindicado',
              usuario_reivindicou_id: currentUser?.id,
              data_reivindicacao: new Date().toISOString(),
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

            const nextLoose = loosePropertiesRef.current.map((p) => (p.code === code ? newProp : p))
            setLooseProperties(nextLoose)

            let nextNotifs = [...notifications]

            if (prop.captador_id) {
              const newNotif = {
                id: Math.random().toString(36).substr(2, 9),
                userId: prop.captador_id,
                message: `Seu imóvel solto ${prop.code} foi reivindicado por ${currentUser?.name} para cliente ${demand.clientName}.`,
                read: false,
                createdAt: new Date().toISOString(),
              }
              nextNotifs = [newNotif, ...nextNotifs]
            }

            const othersNotifs = users
              .filter(
                (u) => u.id !== currentUser?.id && u.role !== 'captador' && u.role !== 'admin',
              )
              .map((u) => ({
                id: Math.random().toString(36).substr(2, 9),
                userId: u.id,
                message: `Imóvel ${code} foi reivindicado por outro usuário.`,
                read: false,
                createdAt: new Date().toISOString(),
              }))

            nextNotifs = [...othersNotifs, ...nextNotifs]
            setNotifications(nextNotifs)

            enqueueWebhook('imovel_reivindicado', demandId, {
              mensagem: `Seu imóvel foi vinculado a ${demand.clientName}`,
              captadorId: prop.captador_id,
            })

            const nextDemands = prevDemands.map((d) => (d.id === demandId ? updatedDemand : d))

            broadcastState(nextDemands, users, 'Imóvel reivindicado', nextLoose, nextNotifs)
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
        logContactAttempt,
        logSolicitorContactAttempt,
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
