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
  UserPreferences,
  NotificationType,
  NotificationUrgency,
  GroupComment,
  InactiveGroup,
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
  groupComments: GroupComment[]
  inactiveGroups: InactiveGroup[]
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  archiveNotification: (id: string) => void
  updateUserPreferences: (prefs: Partial<UserPreferences['notifications']>) => void
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
  prioritizeDemand: (id: string, reason: string, count: number) => void
  markDemandLost: (id: string, reason: string, obs?: string) => void
  markPropertyLost: (code: string, demandId: string, reason: string, obs?: string) => void
  updatePropertyDetails: (demandId: string, propertyCode: string, payload: any) => void
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
  addGroupComment: (groupId: string, content: string) => void
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

export const defaultPreferences: UserPreferences = {
  notifications: {
    channels: { in_app: true, push: true, email: true },
    types: {
      novo_imovel: true,
      reivindicado: true,
      ja_reivindicado: true,
      demanda_respondida: true,
      perdido: true,
      visita: true,
      negocio: true,
    },
    quietHours: { enabled: false, start: '20:00', end: '08:00' },
  },
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
    preferences: defaultPreferences,
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
    preferences: defaultPreferences,
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
    preferences: defaultPreferences,
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
    preferences: defaultPreferences,
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
    preferences: defaultPreferences,
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
        bathrooms: 2,
        parkingSpots: 2,
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
        bathrooms: 3,
        parkingSpots: 3,
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
    bathrooms: 2,
    parkingSpots: 2,
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
          return parsed.notifications.map((n: any) => ({
            id: n.id,
            usuario_id: n.userId || n.usuario_id,
            tipo_notificacao: n.tipo_notificacao || 'novo_imovel',
            titulo: n.titulo || 'Aviso',
            corpo: n.corpo || n.message || '',
            detalhes: n.detalhes,
            acao_url: n.acao_url,
            acao_botao: n.acao_botao,
            urgencia: n.urgencia || 'baixa',
            canais: n.canais || ['in_app'],
            lida: n.lida !== undefined ? n.lida : n.read || false,
            data_criacao: n.data_criacao || n.createdAt || new Date().toISOString(),
            data_leitura: n.data_leitura,
            arquivada: n.arquivada || false,
          }))
        }
      }
    } catch {
      // ignore
    }
    return []
  })

  const [groupComments, setGroupComments] = useState<GroupComment[]>(() => {
    try {
      const raw = localStorage.getItem('etic_group_comments')
      if (raw) return JSON.parse(raw)
    } catch {
      // ignore
    }
    return [
      {
        id: 'c1',
        groupId: 'Pinheiros-Venda-3',
        userId: '1',
        userName: 'Ana Silva',
        userRole: 'captador',
        content: 'Estou prospectando na região, mas os proprietários estão pedindo acima do valor.',
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
    ]
  })

  const [inactiveGroups] = useState<InactiveGroup[]>([
    {
      id: 'ig1',
      location: 'Moema',
      type: 'Venda',
      bedrooms: 3,
      bathrooms: 2,
      parkingSpots: 2,
      minBudget: 800000,
      maxBudget: 1200000,
      totalClients: 4,
      closedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      outcome: 'Atendido',
    },
    {
      id: 'ig2',
      location: 'Pinheiros',
      type: 'Aluguel',
      bedrooms: 2,
      bathrooms: 1,
      parkingSpots: 1,
      minBudget: 3000,
      maxBudget: 4500,
      totalClients: 2,
      closedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      outcome: 'Perdido',
    },
    {
      id: 'ig3',
      location: 'Jardins',
      type: 'Venda',
      bedrooms: 4,
      bathrooms: 4,
      parkingSpots: 3,
      minBudget: 2000000,
      maxBudget: 3500000,
      totalClients: 1,
      closedAt: new Date(Date.now() - 40 * 86400000).toISOString(),
      outcome: 'Perdido',
    },
  ])

  useEffect(() => {
    localStorage.setItem('etic_group_comments', JSON.stringify(groupComments))
  }, [groupComments])

  const webhookQueueRef = useRef(webhookQueue)
  const loosePropertiesRef = useRef(looseProperties)
  const isProcessingRef = useRef(false)
  const prevLooseRef = useRef<CapturedProperty[]>([])
  const usersRef = useRef(users)
  const allDemandsRef = useRef(allDemands)

  useEffect(() => {
    webhookQueueRef.current = webhookQueue
  }, [webhookQueue])

  useEffect(() => {
    loosePropertiesRef.current = looseProperties
  }, [looseProperties])

  useEffect(() => {
    usersRef.current = users
  }, [users])

  useEffect(() => {
    allDemandsRef.current = allDemands
  }, [allDemands])

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

  const dispatchNotifications = useCallback(
    (drafts: Partial<AppNotification>[]) => {
      let toAdd: AppNotification[] = []
      setNotifications((prev) => {
        const currentUsers = usersRef.current

        drafts.forEach((draft) => {
          const user = currentUsers.find((u) => u.id === draft.usuario_id)
          if (!user || user.status === 'inativo') {
            return
          }

          const prefs = user.preferences || defaultPreferences

          if (!prefs.notifications.types[draft.tipo_notificacao as NotificationType]) {
            return
          }

          let canais = draft.canais || ['in_app']

          if (!prefs.notifications.channels.in_app) canais = canais.filter((c) => c !== 'in_app')
          if (!prefs.notifications.channels.push) canais = canais.filter((c) => c !== 'push')
          if (!prefs.notifications.channels.email) canais = canais.filter((c) => c !== 'email')

          if (prefs.notifications.quietHours.enabled) {
            const now = new Date()
            const curMins = now.getHours() * 60 + now.getMinutes()
            const [sh, sm] = prefs.notifications.quietHours.start.split(':').map(Number)
            const [eh, em] = prefs.notifications.quietHours.end.split(':').map(Number)
            const startMins = sh * 60 + sm
            const endMins = eh * 60 + em

            let inQuiet = false
            if (startMins > endMins) {
              inQuiet = curMins >= startMins || curMins <= endMins
            } else {
              inQuiet = curMins >= startMins && curMins <= endMins
            }

            if (inQuiet) {
              canais = canais.filter((c) => c === 'in_app')
            }
          }

          if (canais.length === 0) canais = ['in_app']

          const notif: AppNotification = {
            id: Math.random().toString(36).substring(2, 9),
            usuario_id: draft.usuario_id!,
            tipo_notificacao: draft.tipo_notificacao as NotificationType,
            titulo: draft.titulo || '',
            corpo: draft.corpo || '',
            detalhes: draft.detalhes,
            acao_url: draft.acao_url,
            acao_botao: draft.acao_botao,
            urgencia: (draft.urgencia as NotificationUrgency) || 'media',
            canais,
            lida: false,
            arquivada: false,
            data_criacao: new Date().toISOString(),
          }

          toAdd.push(notif)

          if (canais.includes('push')) {
            setTimeout(() => {
              if (Math.random() < 0.05) {
                addLog(`[Notificação] Falha no Push para ${user.name}. Retentando em 5 min...`)
              }
            }, 1000)
          }

          if (canais.includes('email')) {
            if (notif.urgencia === 'alta') {
              addLog(`[Notificação] Email imediato enviado para ${user.name} (${notif.titulo})`)
            } else {
              addLog(
                `[Notificação] Email enfileirado para lote (1h) para ${user.name} (${notif.titulo})`,
              )
            }
          }
        })

        if (toAdd.length === 0) return prev
        const next = [...toAdd, ...prev]

        setTimeout(() => {
          broadcastState(
            allDemandsRef.current,
            usersRef.current,
            'Novas notificações',
            loosePropertiesRef.current,
            next,
          )
        }, 0)

        return next
      })
    },
    [addLog, broadcastState],
  )

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
            action: <ToastAction altText="Ver Imóvel">Ver</ToastAction>,
            duration: 8000,
          })
        }
      }
    })

    prevLooseRef.current = looseProperties
  }, [looseProperties, currentUser])

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

  const processWebhookCron = useCallback(async () => {
    if (isProcessingRef.current) return
    isProcessingRef.current = true

    const pendingItems = webhookQueueRef.current.filter(
      (q) => q.status === 'pendente' || (q.status === 'falha' && q.tentativas < 3),
    )

    for (const item of pendingItems) {
      let success = false
      let attempts = item.tentativas

      setWebhookQueue((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: 'processando' } : i)),
      )

      while (!success && attempts < 3) {
        attempts++
        try {
          await new Promise((r) => setTimeout(r, 400))
          success = true
          setWebhookQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? {
                    ...i,
                    status: 'enviado',
                    tentativas: attempts,
                    data_envio: new Date().toISOString(),
                    erro_mensagem: undefined,
                  }
                : i,
            ),
          )
          addLog(`[Webhook] Sucesso: '${item.event_type}' entregue ao n8n.`)
        } catch (err: any) {
          setWebhookQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'falha', tentativas: attempts, erro_mensagem: err.message }
                : i,
            ),
          )
          addLog(
            `[Webhook] Falha: '${item.event_type}' (Tentativa ${attempts}/3). Erro: ${err.message}`,
          )
        }
      }
    }
    isProcessingRef.current = false
  }, [addLog])

  useEffect(() => {
    const intervalId = setInterval(processWebhookCron, 300000)
    return () => clearInterval(intervalId)
  }, [processWebhookCron])

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
      const drafts: Partial<AppNotification>[] = []
      actions.forEach(({ type, demand, oldAssignedTo }) => {
        if (type === 'reassign_24h' && oldAssignedTo) {
          addPoints(-20, oldAssignedTo)
          drafts.push({
            usuario_id: oldAssignedTo,
            tipo_notificacao: 'perdido',
            titulo: '⏰ PRAZO ESGOTADO',
            corpo: `A demanda de ${demand.clientName} foi repassada. (-20 pts)`,
            urgencia: 'baixa',
            canais: ['in_app'],
          })
          addLog(`[Cron] Demanda ${demand.clientName} repassada (24h esgotado).`)
        } else if (type === 'notify_12h' && demand.assignedTo) {
          drafts.push({
            usuario_id: demand.assignedTo,
            tipo_notificacao: 'demanda_respondida',
            titulo: '⏳ 12H RESTANTES',
            corpo: `Você tem 12h para responder a demanda de ${demand.clientName}`,
            urgencia: 'media',
            canais: ['in_app', 'push'],
          })
        } else if (type === 'notify_ext_24h' && demand.assignedTo) {
          drafts.push({
            usuario_id: demand.assignedTo,
            tipo_notificacao: 'demanda_respondida',
            titulo: '🔍 BUSCA ESTENDIDA',
            corpo: `Você ainda está buscando imóvel para ${demand.clientName}`,
            urgencia: 'baixa',
            canais: ['in_app'],
          })
        } else if (type === 'notify_ext_48h_fail') {
          addLog(
            `[Cron] Demanda ${demand.clientName} marcada como Impossível (48h extra esgotado).`,
          )
        }
      })
      if (drafts.length > 0) dispatchNotifications(drafts)
    }, 100)
  }, [addLog, addPoints, dispatchNotifications])

  useEffect(() => {
    const t = setTimeout(triggerCron, 2000)
    const i = setInterval(triggerCron, 20000)
    return () => {
      clearTimeout(t)
      clearInterval(i)
    }
  }, [triggerCron])

  const checkDemandAccess = (demand: Demand | undefined, property?: CapturedProperty) => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'gestor') return true
    if (currentUser?.role === 'corretor' || currentUser?.role === 'sdr') {
      if (!demand || demand.createdBy !== currentUser.id) return false
    }
    if (currentUser?.role === 'captador') {
      if (property && property.captador_id !== currentUser.id) return false
    }
    return true
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

  const scheduleVisitByCode = useCallback(
    (code: string, payload: any) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemands) {
        const idx = d.capturedProperties?.findIndex((p) => p.code === code && !p.discarded) ?? -1
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

        dispatchNotifications([
          {
            usuario_id: captadorId,
            tipo_notificacao: 'visita',
            titulo: '👁️ VISITA AGENDADA!',
            corpo: `Visita agendada para seu imóvel ${code}`,
            detalhes: { data: formattedDate, hora: payload.time, responsavel: currentUser?.name },
            acao_url: `/app/demandas`,
            urgencia: 'media',
            canais: ['in_app', 'push'],
          },
        ])
      }

      enqueueWebhook('visita_agendada', demand.id, updatedProps[propIndex])
      const msg = `Status alterado para Visita Agendada: Imóvel ${code} por ${currentUser?.name || 'Sistema'}`
      addLog(msg)
      toast({ title: 'Visita Agendada', description: 'O status foi sincronizado com sucesso.' })
      broadcastState(nextDemands, nextUsers, msg)
    },
    [
      allDemands,
      currentUser,
      users,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
      dispatchNotifications,
    ],
  )

  const submitProposalByCode = useCallback(
    (code: string, payload: any) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemands) {
        const idx = d.capturedProperties?.findIndex((p) => p.code === code && !p.discarded) ?? -1
        if (idx !== -1) {
          demand = d
          propIndex = idx
          break
        }
      }

      if (!demand) return
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

      if (prop.captador_id) {
        dispatchNotifications([
          {
            usuario_id: prop.captador_id,
            tipo_notificacao: 'demanda_respondida',
            titulo: '📝 NOVA PROPOSTA!',
            corpo: `Nova proposta registrada no seu imóvel ${code}.`,
            detalhes: { valor: formattedVal, responsavel: currentUser?.name },
            urgencia: 'media',
            canais: ['in_app', 'push'],
          },
        ])
      }

      enqueueWebhook('proposta_enviada', demand.id, updatedProps[propIndex])
      const msg = `Status alterado para Proposta: Imóvel ${code}`
      addLog(msg)
      toast({ title: 'Proposta Registrada', description: 'O status foi atualizado com sucesso.' })
      broadcastState(nextDemands, users, msg)
    },
    [
      allDemands,
      currentUser,
      users,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
      dispatchNotifications,
    ],
  )

  const closeDealByCode = useCallback(
    (code: string, payload: any) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemands) {
        const idx = d.capturedProperties?.findIndex((p) => p.code === code && !p.discarded) ?? -1
        if (idx !== -1) {
          demand = d
          propIndex = idx
          break
        }
      }

      if (!demand) return
      const prop = demand.capturedProperties![propIndex]
      if (!checkDemandAccess(demand, prop)) return

      let earnedPoints = 100
      const budgetTarget = demand.maxBudget || demand.budget || 0
      if (budgetTarget > 0 && payload.value > budgetTarget) {
        earnedPoints += 50
      }
      if (demand.isPrioritized) earnedPoints += 25

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
                stats: { ...u.stats, negociosFechados: u.stats.negociosFechados + 1 },
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
                  stats: { ...prev.stats, negociosFechados: prev.stats.negociosFechados + 1 },
                }
              : prev,
          )
        }

        dispatchNotifications([
          {
            usuario_id: captadorId,
            tipo_notificacao: 'negocio',
            titulo: '💰 NEGÓCIO FECHADO!',
            corpo: `Negócio fechado para seu imóvel ${code} - R$ ${formattedVal}`,
            detalhes: {
              sdr_corretor: currentUser?.name,
              cliente: demand.clientName,
            },
            acao_url: `/app/demandas`,
            urgencia: 'alta',
            canais: ['in_app', 'push', 'email'],
          },
        ])
      }

      const msg = `Status alterado para Negócio Fechado: Imóvel ${code}`
      addLog(msg)
      toast({
        title: 'Negócio Fechado! 🎉',
        description: `O status foi atualizado. +${earnedPoints} pontos concedidos.`,
        className: 'bg-emerald-600 text-white border-emerald-600',
      })
      broadcastState(nextDemands, nextUsers, msg)
    },
    [
      allDemands,
      currentUser,
      users,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
      dispatchNotifications,
    ],
  )

  const prioritizeDemand = useCallback(
    (id: string, reason: string, count: number) => {
      const demand = allDemands.find((d) => d.id === id)
      if (!demand) return
      if (
        demand.createdBy !== currentUser?.id &&
        currentUser?.role !== 'admin' &&
        currentUser?.role !== 'gestor'
      ) {
        toast({
          title: 'Erro',
          description: 'Você não tem permissão para esta ação',
          variant: 'destructive',
        })
        return
      }

      const action = createAction('priorizado', `Demanda priorizada: ${reason}`)

      setAllDemands((prev) => {
        const next = prev.map((d) =>
          d.id === id
            ? {
                ...d,
                isPrioritized: true,
                interestedClientsCount: count,
                prioritizeReason: reason,
                motivo_priorizacao: reason,
                data_priorizacao: new Date().toISOString(),
              }
            : d,
        )
        broadcastState(next, users, 'Demanda priorizada')
        return next
      })

      const drafts: Partial<AppNotification>[] = []
      usersRef.current.forEach((u) => {
        if (u.role === 'captador' && u.status === 'ativo') {
          drafts.push({
            usuario_id: u.id,
            tipo_notificacao: 'novo_imovel',
            titulo: `🔴 DEMANDA PRIORIZADA! ${demand.clientName} em ${demand.location}`,
            corpo: `${demand.clientName} em ${demand.location} - ${count} clientes interessados`,
            detalhes: {
              código: demand.id,
              bairro: demand.location,
              valor: demand.maxBudget ? `Até R$ ${demand.maxBudget}` : '-',
              perfil: `${demand.bedrooms || 0} dorms`,
            },
            acao_botao: 'Ver demanda',
            acao_url: '/app/demandas',
            urgencia: 'alta',
            canais: ['in_app', 'push'],
          })
        }
      })
      if (drafts.length > 0) dispatchNotifications(drafts)

      enqueueWebhook('demanda_priorizada', id, { count, reason })
      addLog(`Demanda priorizada (ID: ${id})`)
      toast({
        title: 'Demanda priorizada!',
        description: 'Notificação enviada aos captadores.',
        className: 'bg-pink-600 text-white',
      })
    },
    [
      allDemands,
      currentUser,
      users,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
      dispatchNotifications,
    ],
  )

  const markDemandLost = useCallback(
    (id: string, reason: string, obs?: string) => {
      const demand = allDemands.find((d) => d.id === id)
      if (!demand) return
      if (
        demand.createdBy !== currentUser?.id &&
        currentUser?.role !== 'admin' &&
        currentUser?.role !== 'gestor'
      ) {
        toast({
          title: 'Erro',
          description: 'Você não tem permissão para esta ação',
          variant: 'destructive',
        })
        return
      }

      const action = createAction('perdido', `Demanda perdida: ${reason}`, obs)

      setAllDemands((prev) => {
        const next = prev.map((d) => {
          if (d.id === id) {
            const updated = {
              ...d,
              status: 'Perdida' as DemandStatus,
              lostReason: reason,
              lostObs: obs,
              motivo_perda: reason,
              observacoes_perda: obs,
              data_perda: new Date().toISOString(),
            }
            if (updated.capturedProperties && action) {
              updated.capturedProperties = updated.capturedProperties.map((p) => ({
                ...p,
                history: [action, ...(p.history || [])],
              }))
            }
            return updated
          }
          return d
        })
        broadcastState(next, users, 'Demanda perdida')
        return next
      })

      const activeCaptadores = new Set<string>()
      if (demand.assignedTo) activeCaptadores.add(demand.assignedTo)
      demand.capturedProperties?.forEach((p) => {
        if (p.captador_id) activeCaptadores.add(p.captador_id)
      })

      const drafts: Partial<AppNotification>[] = Array.from(activeCaptadores).map((uId) => ({
        usuario_id: uId,
        tipo_notificacao: 'perdido',
        titulo: `⚫ DEMANDA PERDIDA: ${demand.clientName} em ${demand.location} - Motivo: ${reason}`,
        corpo: `A demanda de ${demand.clientName} em ${demand.location} foi perdida.`,
        detalhes: { motivo: reason },
        urgencia: 'baixa',
        canais: ['in_app'],
      }))

      if (currentUser?.role === 'captador' && demand.createdBy) {
        drafts.push({
          usuario_id: demand.createdBy,
          tipo_notificacao: 'perdido',
          titulo: `⚫ PERDIDO: ${demand.clientName} em ${demand.location} - Motivo: ${reason}`,
          corpo: `O captador mar বহুমarcou a demanda como perdida.`,
          detalhes: { motivo: reason },
          urgencia: 'baixa',
          canais: ['in_app'],
        })
      }

      if (drafts.length > 0) dispatchNotifications(drafts)

      enqueueWebhook('demanda_perdida', id, { reason, obs })
      addLog(`Demanda perdida (ID: ${id})`)
      toast({ title: 'Demanda perdida', description: 'Status atualizado.' })
    },
    [
      allDemands,
      currentUser,
      users,
      enqueueWebhook,
      addLog,
      broadcastState,
      createAction,
      dispatchNotifications,
    ],
  )

  const markPropertyLost = useCallback(
    (code: string, demandId: string, reason: string, obs?: string) => {
      let demand: Demand | undefined
      let propIndex = -1
      for (const d of allDemandsRef.current) {
        if (d.id === demandId) {
          const idx = d.capturedProperties?.findIndex((p) => p.code === code) ?? -1
          if (idx !== -1) {
            demand = d
            propIndex = idx
            break
          }
        }
      }

      if (!demand) {
        toast({ variant: 'destructive', description: 'Demanda ou imóvel não encontrados' })
        return
      }

      const prop = demand.capturedProperties![propIndex]
      if (!checkDemandAccess(demand, prop)) return

      const action = createAction('perdido', `Imóvel dispensado: ${reason}`, obs)

      let releasedToLoose = false

      const updatedProps = [...(demand.capturedProperties || [])]
      updatedProps[propIndex] = {
        ...prop,
        discarded: true,
        discardReason: reason,
        history: action ? [action, ...(prop.history || [])] : prop.history,
      }

      const activeProps = updatedProps.filter((p) => !p.discarded)
      let newDemandStatus = demand.status
      if (
        activeProps.length === 0 &&
        (demand.status === 'Captado sob demanda' ||
          demand.status === 'Visita' ||
          demand.status === 'Proposta')
      ) {
        newDemandStatus = 'Em Captação'
      }

      const updatedDemand = {
        ...demand,
        status: newDemandStatus,
        capturedProperties: updatedProps,
      }

      let nextLoose = loosePropertiesRef.current
      if (prop.tipo_vinculacao === 'solto' || prop.tipo_vinculacao === 'vinculado') {
        const looseIdx = nextLoose.findIndex((lp) => lp.code === code)
        if (looseIdx !== -1) {
          releasedToLoose = true
          nextLoose = nextLoose.map((lp) =>
            lp.code === code
              ? {
                  ...lp,
                  status_reivindicacao: 'disponivel',
                  usuario_reivindicou_id: undefined,
                  data_reivindicacao: undefined,
                  demandas_atendidas_ids: lp.demandas_atendidas_ids?.filter(
                    (id) => id !== demandId,
                  ),
                  history: action ? [action, ...(lp.history || [])] : lp.history,
                }
              : lp,
          )
          setLooseProperties(nextLoose)
        }
      }

      const nextDemands = allDemandsRef.current.map((d) => (d.id === demandId ? updatedDemand : d))
      setAllDemands(nextDemands)

      const drafts: Partial<AppNotification>[] = []

      if (prop.captador_id) {
        drafts.push({
          usuario_id: prop.captador_id,
          tipo_notificacao: 'perdido',
          titulo: '❌ IMÓVEL DISPENSADO',
          corpo: `Seu imóvel ${code} foi dispensado pelo cliente ${demand.clientName}.`,
          detalhes: { motivo: reason },
          urgencia: 'media',
          canais: ['in_app', 'push'],
        })
      }

      if (releasedToLoose) {
        const eligibleUsers = usersRef.current.filter((u) => {
          if (u.id === currentUser?.id || u.status === 'inativo') return false
          if (prop.propertyType === 'Aluguel') {
            return (
              u.role === 'sdr' ||
              (u.role === 'corretor' && u.tipos_demanda_solicitados?.includes('locacao'))
            )
          } else if (prop.propertyType === 'Venda') {
            return u.role === 'corretor'
          }
          return false
        })

        eligibleUsers.forEach((u) => {
          drafts.push({
            usuario_id: u.id,
            tipo_notificacao: 'novo_imovel',
            titulo: '♻️ IMÓVEL DISPONÍVEL NOVAMENTE',
            corpo: `O imóvel ${code} (${prop.neighborhood}) voltou para a base e está disponível.`,
            acao_url: '/app/demandas',
            urgencia: 'alta',
            canais: ['in_app'],
          })
        })
      }

      if (drafts.length > 0) dispatchNotifications(drafts)
      enqueueWebhook('imovel_dispensado', demandId, { code, reason })

      const msg = `Imóvel ${code} dispensado e retornado à base`
      addLog(msg)
      toast({
        title: 'Imóvel Dispensado',
        description: 'O imóvel foi marcado como descartado e voltou para a base se aplicável.',
      })
      broadcastState(nextDemands, usersRef.current, msg, nextLoose)
    },
    [
      checkDemandAccess,
      createAction,
      currentUser?.id,
      dispatchNotifications,
      enqueueWebhook,
      addLog,
      broadcastState,
    ],
  )

  const updatePropertyDetails = useCallback(
    (demandId: string, propertyCode: string, payload: any) => {
      if (
        currentUser?.role !== 'captador' &&
        currentUser?.role !== 'admin' &&
        currentUser?.role !== 'gestor'
      ) {
        toast({
          title: 'Erro',
          description: 'Você não tem permissão para esta ação',
          variant: 'destructive',
        })
        return
      }

      setAllDemands((prev) => {
        const next = prev.map((d) => {
          if (d.id === demandId) {
            const updatedProps = d.capturedProperties?.map((p) => {
              if (p.code === propertyCode) {
                const action = createAction(
                  'captacao',
                  `Detalhes do imóvel atualizados por ${currentUser?.name}`,
                )
                return {
                  ...p,
                  code: payload.code || p.code,
                  neighborhood: payload.neighborhood || p.neighborhood,
                  value: payload.value !== undefined ? payload.value : p.value,
                  bedrooms: payload.bedrooms !== undefined ? payload.bedrooms : p.bedrooms,
                  bathrooms: payload.bathrooms !== undefined ? payload.bathrooms : p.bathrooms,
                  parkingSpots:
                    payload.parkingSpots !== undefined ? payload.parkingSpots : p.parkingSpots,
                  obs: payload.obs !== undefined ? payload.obs : p.obs,
                  history: action ? [action, ...(p.history || [])] : p.history,
                }
              }
              return p
            })
            return { ...d, capturedProperties: updatedProps }
          }
          return d
        })
        broadcastState(next, users, `Imóvel ${propertyCode} atualizado`)
        return next
      })
    },
    [currentUser, users, createAction, broadcastState],
  )

  const logContactAttempt = useCallback(
    (demandId: string, code: string, method: 'whatsapp' | 'interno', message?: string) => {
      let demand = allDemands.find((d) => d.id === demandId)
      if (!demand) return
      const propIndex = demand.capturedProperties?.findIndex((p) => p.code === code) ?? -1
      if (propIndex === -1) return
      const prop = demand.capturedProperties![propIndex]
      if (!checkDemandAccess(demand, prop)) return

      const action = createAction(
        'contato_captador',
        `${currentUser?.name} enviou mensagem (${method})`,
        message,
      )

      if (!action) return
      const nextProps = [...demand.capturedProperties!]
      nextProps[propIndex] = { ...prop, history: [action, ...(prop.history || [])] }
      const updatedDemand = { ...demand, capturedProperties: nextProps }
      const nextDemands = allDemands.map((d) => (d.id === demandId ? updatedDemand : d))
      setAllDemands(nextDemands)

      const targetUserId = currentUser?.role === 'captador' ? demand.createdBy : prop.captador_id
      if (targetUserId) {
        dispatchNotifications([
          {
            usuario_id: targetUserId,
            tipo_notificacao: 'demanda_respondida',
            titulo: '💬 NOVA MENSAGEM',
            corpo: `${currentUser?.name} enviou uma mensagem sobre o imóvel ${code}.`,
            detalhes: { mensagem: message },
            urgencia: 'media',
            canais: ['in_app', 'push'],
          },
        ])
      }

      broadcastState(nextDemands, users, `Mensagem sobre imóvel ${code}`)
      enqueueWebhook('contato_registrado', demandId, { code, status: 'registrado' })
      if (method === 'interno')
        toast({ title: 'Enviada', description: `Mensagem enviada com sucesso.` })
    },
    [
      allDemands,
      currentUser,
      users,
      createAction,
      broadcastState,
      enqueueWebhook,
      dispatchNotifications,
    ],
  )

  const logSolicitorContactAttempt = useCallback(
    (demandId: string, method: 'whatsapp' | 'email' | 'interno', message?: string) => {
      let demand = allDemands.find((d) => d.id === demandId)
      if (!demand) return

      setAllDemands((prev) => {
        const next = prev.map((d) =>
          d.id === demandId ? { ...d, lastContactedSolicitorAt: new Date().toISOString() } : d,
        )
        broadcastState(next, users, `Contato registrado`)
        return next
      })

      if (method === 'interno') {
        dispatchNotifications([
          {
            usuario_id: demand.createdBy,
            tipo_notificacao: 'demanda_respondida',
            titulo: '💬 NOVA DÚVIDA',
            corpo: `${currentUser?.name} enviou dúvida sobre demanda ${demand.clientName}`,
            detalhes: { mensagem: message },
            urgencia: 'media',
            canais: ['in_app', 'push'],
          },
        ])
        toast({ title: 'Enviada', description: `Mensagem enviada com sucesso.` })
      }
    },
    [allDemands, currentUser, users, broadcastState, dispatchNotifications],
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

  const addGroupComment = useCallback(
    (groupId: string, content: string) => {
      if (!currentUser) return
      const newComment: GroupComment = {
        id: Math.random().toString(36).substring(2, 9),
        groupId,
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role,
        content,
        createdAt: new Date().toISOString(),
      }
      setGroupComments((prev) => [...prev, newComment])
      addLog(`Novo comentário no grupo ${groupId}`)
    },
    [currentUser, addLog],
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
        groupComments,
        inactiveGroups,
        addGroupComment,
        triggerCron,
        markNotificationAsRead: (id: string) => {
          setNotifications((prev) => {
            const next = prev.map((n) =>
              n.id === id ? { ...n, lida: true, data_leitura: new Date().toISOString() } : n,
            )
            setTimeout(() => {
              broadcastState(
                allDemandsRef.current,
                usersRef.current,
                undefined,
                loosePropertiesRef.current,
                next,
              )
            }, 0)
            return next
          })
        },
        markAllNotificationsAsRead: () => {
          if (!currentUser) return
          setNotifications((prev) => {
            const next = prev.map((n) =>
              n.usuario_id === currentUser.id && !n.lida
                ? { ...n, lida: true, data_leitura: new Date().toISOString() }
                : n,
            )
            setTimeout(() => {
              broadcastState(
                allDemandsRef.current,
                usersRef.current,
                undefined,
                loosePropertiesRef.current,
                next,
              )
            }, 0)
            return next
          })
        },
        archiveNotification: (id: string) => {
          setNotifications((prev) => {
            const next = prev.map((n) => (n.id === id ? { ...n, arquivada: true } : n))
            setTimeout(() => {
              broadcastState(
                allDemandsRef.current,
                usersRef.current,
                undefined,
                loosePropertiesRef.current,
                next,
              )
            }, 0)
            return next
          })
        },
        updateUserPreferences: (prefs) => {
          setCurrentUser((prev) => {
            if (!prev) return prev
            const currentPrefs = prev.preferences || defaultPreferences
            const nextPrefs: UserPreferences = {
              ...currentPrefs,
              notifications: {
                ...currentPrefs.notifications,
                ...prefs,
                channels: { ...currentPrefs.notifications.channels, ...prefs.channels },
                types: { ...currentPrefs.notifications.types, ...prefs.types },
                quietHours: { ...currentPrefs.notifications.quietHours, ...prefs.quietHours },
              },
            }
            const nextUser = { ...prev, preferences: nextPrefs }
            setUsers((uList) => uList.map((u) => (u.id === prev.id ? nextUser : u)))
            return nextUser
          })
          toast({
            title: 'Preferências Salvas',
            description: 'Suas configurações de alerta foram atualizadas.',
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
              if (dLocs.some((dLoc) => dLoc.includes(pLoc) || pLoc.includes(dLoc))) score += 40
              const budgetMax = (demand.maxBudget || demand.budget || 0) * 1.1
              const budgetMin = (demand.minBudget || 0) * 0.9
              if (property.value >= budgetMin && property.value <= budgetMax) score += 30
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
          if (!user) user = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail)
          if (!user || (cleanPass && cleanPass !== '123456' && cleanPass !== 'Password1')) {
            throw new Error('Erro ao acessar o perfil. Verifique suas credenciais')
          }
          const expiresAt = Date.now() + 86400000
          setUsers((prev) => {
            if (!prev.find((u) => u.id === user!.id)) return [...prev, user!]
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
          // TODO: implementar
        },
        addDemand: (d) => {
          if (currentUser?.role === 'corretor' && d.type !== 'Venda') {
            toast({
              variant: 'destructive',
              title: 'Acesso negado',
              description: 'Somente vendas.',
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
          setAllDemands((p) => {
            const next = p.map((d) => (d.id === i ? { ...d, status: s } : d))
            broadcastState(next, users, 'Status atualizado')
            return next
          })
        },
        submitDemandResponse: (id, action, payload) => {
          const demand = allDemands.find((d) => d.id === id)
          if (!demand) return { success: false, message: 'Não encontrada' }
          if (!checkDemandAccess(demand)) return { success: false, message: 'Acesso negado' }

          if (action === 'encontrei') {
            const existingProps = demand.capturedProperties || []
            const code = payload?.code || `IMV-${Math.floor(Math.random() * 1000)}`
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
              bathrooms: payload?.bathrooms,
              parkingSpots: payload?.parkingSpots,
            }

            const updatedDemand = {
              ...demand,
              status:
                demand.status === 'Pendente' || demand.status === 'Em Captação'
                  ? ('Captado sob demanda' as DemandStatus)
                  : demand.status,
              capturedProperties: [...existingProps, newProp],
            }

            setAllDemands((prev) => prev.map((d) => (d.id === id ? updatedDemand : d)))

            if (currentUser) addPoints(50, currentUser.id)

            dispatchNotifications([
              {
                usuario_id: demand.createdBy,
                tipo_notificacao: 'demanda_respondida',
                titulo: `✅ IMÓVEL CAPTADO! ${code} para ${demand.clientName}`,
                corpo: `Um novo imóvel foi captado para ${demand.clientName} em ${demand.location}`,
                detalhes: { captador: currentUser?.name, codigo: code },
                acao_url: `/app/demandas`,
                urgencia: 'alta',
                canais: ['in_app', 'push', 'email'],
              },
            ])

            toast({
              title: 'Imóvel Registrado! 🎉',
              description: `Você ganhou +50 pontos!`,
              className: 'bg-emerald-600 text-white',
            })
            return { success: true, message: '' }
          } else if (action === 'nao_encontrei') {
            const hAction = createAction('perdido', `Não encontrado: ${payload.reason}`)
            let updatedDemand = { ...demand }
            if (payload.continueSearch) {
              updatedDemand.isExtension48h = true
              updatedDemand.extensionRequestedAt = new Date().toISOString()
            } else {
              updatedDemand.status = 'Perdida'
              updatedDemand.lostReason = payload.reason
              updatedDemand.motivo_perda = payload.reason
              updatedDemand.data_perda = new Date().toISOString()
            }
            if (updatedDemand.capturedProperties && hAction) {
              updatedDemand.capturedProperties = updatedDemand.capturedProperties.map((p) => ({
                ...p,
                history: [hAction, ...(p.history || [])],
              }))
            }

            setAllDemands((p) => {
              const next = p.map((d) => (d.id === id ? updatedDemand : d))
              broadcastState(next, users, 'Ação registrada')
              return next
            })

            dispatchNotifications([
              {
                usuario_id: demand.createdBy,
                tipo_notificacao: 'perdido',
                titulo: `❌ NÃO ENCONTROU: ${demand.clientName} em ${demand.location}`,
                corpo: payload.continueSearch
                  ? `Captador pediu extensão para ${demand.clientName}`
                  : `Captador não encontrou imóvel para ${demand.clientName}`,
                detalhes: { motivo: payload.reason },
                urgencia: 'baixa',
                canais: ['in_app'],
              },
            ])

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
            bathrooms: payload.bathrooms,
            parkingSpots: payload.parkingSpots,
          }

          const eligibleUsers = users.filter((u) => {
            if (u.status === 'inativo') return false
            if (payload.propertyType === 'Aluguel') {
              return (
                u.role === 'sdr' ||
                (u.role === 'corretor' && u.tipos_demanda_solicitados?.includes('locacao'))
              )
            } else if (payload.propertyType === 'Venda') {
              return u.role === 'corretor'
            }
            return false
          })

          setLooseProperties((prev) => {
            const nextLoose = [newProp, ...prev]
            if (currentUser) addPoints(35, currentUser.id)
            broadcastState(
              allDemandsRef.current,
              usersRef.current,
              'Imóvel solto captado',
              nextLoose,
            )
            return nextLoose
          })

          const drafts: Partial<AppNotification>[] = eligibleUsers.map((u) => ({
            usuario_id: u.id,
            tipo_notificacao: 'novo_imovel',
            titulo: '🏠 NOVO IMÓVEL DISPONÍVEL!',
            corpo: `${payload.propertyType} em ${payload.neighborhood}, R$ ${payload.value}`,
            detalhes: {
              codigo: code,
              dorms: payload.bedrooms || 0,
              banheiros: payload.bathrooms || 1,
              vagas: payload.parkingSpots || 0,
            },
            acao_botao: '✅ Usar para meu cliente',
            acao_url: `/app/demandas`,
            urgencia: 'alta',
            canais: ['in_app', 'push', 'email'],
          }))

          dispatchNotifications(drafts)
          enqueueWebhook('imovel_captado_solto', 'independente', { imovel: newProp })
          toast({
            title: 'Imóvel Disponível! 🔓',
            description: `+35 pontos ganhos.`,
            className: 'bg-emerald-600 text-white',
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

            const action = createAction(
              'captacao',
              `Imóvel reivindicado e vinculado a ${demand.clientName}`,
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
                  ? 'Captado sob demanda'
                  : demand.status,
              capturedProperties: [...(demand.capturedProperties || []), newProp],
            }

            success = true
            const nextLoose = loosePropertiesRef.current.map((p) => (p.code === code ? newProp : p))
            setLooseProperties(nextLoose)

            const drafts: Partial<AppNotification>[] = []
            if (prop.captador_id) {
              drafts.push({
                usuario_id: prop.captador_id,
                tipo_notificacao: 'reivindicado',
                titulo: '✅ IMÓVEL REIVINDICADO!',
                corpo: `Seu imóvel ${prop.code} foi reivindicado`,
                detalhes: { reivindicado_por: currentUser?.name, cliente: demand.clientName },
                acao_url: `/app/demandas`,
                urgencia: 'media',
                canais: ['in_app', 'push'],
              })
            }

            const eligibleUsers = usersRef.current.filter((u) => {
              if (u.id === currentUser?.id || u.status === 'inativo') return false
              if (prop.propertyType === 'Aluguel') {
                return (
                  u.role === 'sdr' ||
                  (u.role === 'corretor' && u.tipos_demanda_solicitados?.includes('locacao'))
                )
              } else if (prop.propertyType === 'Venda') {
                return u.role === 'corretor'
              }
              return false
            })

            eligibleUsers.forEach((u) => {
              drafts.push({
                usuario_id: u.id,
                tipo_notificacao: 'ja_reivindicado',
                titulo: '❌ IMÓVEL JÁ REIVINDICADO',
                corpo: `O imóvel ${code} já foi reivindicado por outro usuário`,
                detalhes: { reivindicado_por: currentUser?.name },
                acao_botao: '🔍 Ver próximo imóvel',
                acao_url: `/app/demandas`,
                urgencia: 'baixa',
                canais: ['in_app'],
              })
            })

            dispatchNotifications(drafts)
            enqueueWebhook('imovel_reivindicado', demandId, { captadorId: prop.captador_id })

            const nextDemands = prevDemands.map((d) => (d.id === demandId ? updatedDemand : d))
            broadcastState(nextDemands, usersRef.current, 'Imóvel reivindicado', nextLoose)
            return nextDemands
          })

          return { success, message }
        },
        scheduleVisit: (id, payload) => {
          // TODO: implement
        },
        closeDeal: (id, payload) => {
          // TODO: implement
        },
        scheduleVisitByCode,
        submitProposalByCode,
        closeDealByCode,
        prioritizeDemand,
        markDemandLost,
        markPropertyLost,
        updatePropertyDetails,
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
