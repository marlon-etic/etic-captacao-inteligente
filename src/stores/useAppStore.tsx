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
  SystemLog,
  AuthAuditLog,
  AdminAuditLog,
} from '@/types'
import { toast } from '@/hooks/use-toast'
import { ToastAction } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase/client'

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
  systemLogs: SystemLog[]
  authAuditLogs: AuthAuditLog[]
  adminAuditLogs: AdminAuditLog[]
  isProcessingUser: boolean
  logSystemEvent: (message: string, type?: 'error' | 'info' | 'warning', context?: string) => void
  logAuthEvent: (
    event: string,
    status: 'sucesso' | 'erro' | 'bloqueado',
    path?: string,
    email?: string,
  ) => void
  markNotificationAsRead: (id: string) => void
  markAllNotificationsAsRead: () => void
  archiveNotification: (id: string) => void
  updateUserPreferences: (prefs: Partial<UserPreferences['notifications']>) => void
  updateDashboardPrefs: (prefs: Record<string, boolean>) => void
  updateUser: (id: string, updates: Partial<User>) => void
  createUser: (user: Partial<User>) => void
  createUserAdmin: (user: Partial<User>, password?: string) => Promise<void>
  updateUserAdmin: (id: string, user: Partial<User>, password?: string) => Promise<void>
  login: (email: string, password?: string) => Promise<void>
  logout: () => void
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (password: string, token: string) => Promise<void>
  addDemand: (demand: Partial<Demand>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  submitDemandResponse: (id: string, action: 'encontrei' | 'nao_encontrei', payload: any) => any
  submitIndependentCapture: (payload: any) => { success: boolean; message: string }
  submitGroupCapture: (demandIds: string[], payload: any) => { success: boolean; message: string }
  claimLooseProperty: (code: string, demandId: string) => { success: boolean; message: string }
  linkLoosePropertyToDemand: (
    code: string,
    demandId: string,
  ) => { success: boolean; message: string }
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

const formatLocStr = (loc: any): string => {
  if (!loc) return ''
  return Array.isArray(loc) ? loc.join(', ') : String(loc)
}

const getLocsArray = (loc: any): string[] => {
  if (!loc) return []
  if (Array.isArray(loc)) return loc.map((s) => String(s).toLowerCase().trim())
  return String(loc)
    .toLowerCase()
    .split(',')
    .map((s) => s.trim())
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'captador@etic.com',
    role: 'captador',
    status: 'ativo',
    phone: '5511999999999',
    whatsapp: '(11) 99999-9999',
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
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: '2',
    name: 'Carlos Santos',
    email: 'sdr@etic.com',
    role: 'sdr',
    status: 'ativo',
    phone: '5511988888888',
    whatsapp: '(11) 98888-8888',
    points: 800,
    dailyPoints: 0,
    weeklyPoints: 200,
    monthlyPoints: 800,
    badges: ['🚀 Rastreador Rápido'],
    stats: { ...defaultStats, responseCount: 10, responseTimeSum: 120 },
    preferences: defaultPreferences,
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: '3',
    name: 'Roberto Corretor',
    email: 'corretor@etic.com',
    role: 'corretor',
    status: 'ativo',
    phone: '5511977777777',
    whatsapp: '(11) 97777-7777',
    tipo_demanda: 'vendas',
    tipos_demanda_solicitados: ['locacao', 'vendas'],
    points: 950,
    dailyPoints: 50,
    weeklyPoints: 300,
    monthlyPoints: 950,
    badges: ['⭐ Negociador Estrela'],
    stats: { ...defaultStats, negociosFechados: 5 },
    preferences: defaultPreferences,
    createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
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
    createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
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

const initialDemands: Demand[] = []
const initialLooseProperties: CapturedProperty[] = []

const AppContext = createContext<AppState | null>(null)

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('etic_session')
      if (stored) {
        const { user, expiresAt } = JSON.parse(stored)
        if (Date.now() < expiresAt && user && user.status !== 'bloqueado') return user
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
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [isProcessingUser, setIsProcessingUser] = useState(false)

  const [authAuditLogs, setAuthAuditLogs] = useState<AuthAuditLog[]>([])
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditLog[]>([])

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

  const [groupComments, setGroupComments] = useState<GroupComment[]>([])
  const [inactiveGroups] = useState<InactiveGroup[]>([])

  useEffect(() => {
    localStorage.setItem('etic_group_comments', JSON.stringify(groupComments))
  }, [groupComments])

  useEffect(() => {
    localStorage.setItem('etic_auth_logs', JSON.stringify(authAuditLogs))
  }, [authAuditLogs])

  useEffect(() => {
    localStorage.setItem('etic_admin_logs', JSON.stringify(adminAuditLogs))
  }, [adminAuditLogs])

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

  const logSystemEvent = useCallback(
    (message: string, type: 'error' | 'info' | 'warning' = 'info', context?: string) => {
      setSystemLogs((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id,
          userName: currentUser?.name,
          message,
          context,
          type,
        },
        ...prev,
      ])
    },
    [currentUser],
  )

  const logAuthEvent = useCallback(
    (
      event: string,
      status: 'sucesso' | 'erro' | 'bloqueado',
      path?: string,
      targetEmail?: string,
    ) => {
      setAuthAuditLogs((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date().toISOString(),
          userId: currentUser?.id,
          userEmail: targetEmail || currentUser?.email,
          event,
          status,
          path,
          ip: '127.0.0.1',
        },
        ...prev,
      ])
    },
    [currentUser],
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
          if (!user || user.status === 'inativo' || user.status === 'bloqueado') {
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
    [broadcastState],
  )

  const enqueueWebhook = useCallback(
    (event_type: string, entity_id: string | undefined, data: any) => {
      const target_url =
        import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://mock-n8n.example.com/webhook-test'

      if (!target_url.startsWith('http')) return

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
    },
    [],
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
                  }
                : i,
            ),
          )
        } catch (err: any) {
          setWebhookQueue((prev) =>
            prev.map((i) =>
              i.id === item.id
                ? { ...i, status: 'falha', tentativas: attempts, erro_mensagem: err.message }
                : i,
            ),
          )
        }
      }
    }
    isProcessingRef.current = false
  }, [])

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

  const updateUser = useCallback(
    (id: string, updates: Partial<User>) => {
      setUsers((prev) => {
        const next = prev.map((u) => (u.id === id ? { ...u, ...updates } : u))
        broadcastState(allDemandsRef.current, next, `Usuário atualizado: ${id}`)
        return next
      })
      if (currentUser?.id === id) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev))
      }
    },
    [broadcastState, currentUser],
  )

  const createUser = useCallback(
    (userData: Partial<User>) => {
      const newUser: User = {
        id: Math.random().toString(36).substr(2, 9),
        points: 0,
        dailyPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        badges: [],
        stats: defaultStats,
        status: 'ativo',
        createdAt: new Date().toISOString(),
        ...userData,
      } as User

      setUsers((prev) => {
        const next = [...prev, newUser]
        setTimeout(() => broadcastState(allDemandsRef.current, next, `Novo usuário criado`), 0)
        return next
      })
    },
    [broadcastState],
  )

  const updateDashboardPrefs = useCallback(
    (prefs: Record<string, boolean>) => {
      if (!currentUser) return
      updateUser(currentUser.id, { dashboardPrefs: prefs })
    },
    [currentUser, updateUser],
  )

  const triggerCron = useCallback(() => {
    // mock cron
  }, [])

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

  const scheduleVisitByCode = useCallback((code: string, payload: any) => {
    // Mock implementation
  }, [])

  const submitProposalByCode = useCallback((code: string, payload: any) => {
    // Mock implementation
  }, [])

  const closeDealByCode = useCallback((code: string, payload: any) => {
    // Mock implementation
  }, [])

  const prioritizeDemand = useCallback((id: string, reason: string, count: number) => {
    // Mock implementation
  }, [])

  const markDemandLost = useCallback(
    (id: string, reason: string, obs?: string) => {
      const demand = allDemands.find((d) => d.id === id)
      if (!demand) return

      supabase.auth.getUser().then(({ data: authData }) => {
        if (authData?.user) {
          const table = demand.type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
          supabase.from(table).update({ status_demanda: 'impossivel' }).eq('id', demand.id).then()
        }
      })

      const action = createAction('perdido', `Demanda perdida: ${reason}`, obs)
      setAllDemands((prev) => {
        const next = prev.map((d) => {
          if (d.id === id) {
            const updated = {
              ...d,
              status: 'Perdida' as DemandStatus,
              lostReason: reason,
            }
            return updated
          }
          return d
        })
        broadcastState(next, users, 'Demanda perdida')
        return next
      })
    },
    [allDemands, users, broadcastState, createAction],
  )

  const markPropertyLost = useCallback(
    (code: string, demandId: string, reason: string, obs?: string) => {
      // Mock implementation sync with supabase
      supabase.auth.getUser().then(({ data: authData }) => {
        if (authData?.user) {
          supabase
            .from('imoveis_captados')
            .update({ status_captacao: 'perdido' })
            .eq('codigo_imovel', code)
            .then()
        }
      })
    },
    [],
  )

  const updatePropertyDetails = useCallback(
    (demandId: string, propertyCode: string, payload: any) => {
      // Mock implementation
    },
    [],
  )

  const logContactAttempt = useCallback(
    (demandId: string, code: string, method: 'whatsapp' | 'interno', message?: string) => {
      // Mock implementation
    },
    [],
  )

  const logSolicitorContactAttempt = useCallback(
    (demandId: string, method: 'whatsapp' | 'email' | 'interno', message?: string) => {
      // Mock implementation
    },
    [],
  )

  const getSimilarDemands = useCallback((id: string) => {
    return []
  }, [])

  const addGroupComment = useCallback((groupId: string, content: string) => {
    // Mock implementation
  }, [])

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
        systemLogs,
        authAuditLogs,
        adminAuditLogs,
        isProcessingUser,
        logSystemEvent,
        logAuthEvent,
        notifications,
        groupComments,
        inactiveGroups,
        addGroupComment,
        triggerCron,
        markNotificationAsRead: (id: string) => {},
        markAllNotificationsAsRead: () => {},
        archiveNotification: (id: string) => {},
        updateUserPreferences: (prefs) => {},
        updateDashboardPrefs,
        updateUser,
        createUser,
        createUserAdmin: async (payload: Partial<User>) => {},
        updateUserAdmin: async (id: string, payload: Partial<User>, password?: string) => {},
        getMatchesForProperty: (property: CapturedProperty) => {
          return []
        },
        login: async (email, password) => {
          const cleanEmail = email.toLowerCase().trim()
          let user = users.find((u) => u.email.toLowerCase() === cleanEmail)
          if (!user) user = mockUsers.find((u) => u.email.toLowerCase() === cleanEmail)
          if (!user) {
            logAuthEvent('Tentativa de login falhou', 'erro', '/login', email)
            throw new Error('Erro ao acessar o perfil. Verifique suas credenciais')
          }
          if (user.status === 'bloqueado' || user.status === 'inativo') {
            logAuthEvent('Login em conta bloqueada/inativa', 'bloqueado', '/login', email)
            throw new Error('Sua conta está bloqueada ou inativa.')
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
          supabase.auth.signOut().then()
        },
        requestPasswordReset: async (email) => {},
        resetPassword: async (password, token) => {},
        addDemand: (d) => {
          const newDemand = {
            ...d,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
            status: 'Pendente',
            grupo_id: `group-new-${Math.random().toString(36).substr(2, 9)}`,
          } as Demand

          setAllDemands((p) => {
            const next = [newDemand, ...p]
            broadcastState(next, users, 'Nova demanda')
            return next
          })
        },
        updateDemandStatus: (i, s) => {
          setAllDemands((p) => {
            const next = p.map((d) => (d.id === i ? { ...d, status: s } : d))
            broadcastState(next, users, 'Status atualizado')
            return next
          })
        },
        submitGroupCapture: (demandIds, payload) => {
          return { success: true, message: '' }
        },
        submitDemandResponse: (id, action, payload) => {
          const demand = allDemands.find((d) => d.id === id)
          if (!demand) return { success: false, message: 'Não encontrada' }

          if (action === 'encontrei') {
            const code = payload?.code || `IMV-${Math.floor(Math.random() * 1000)}`

            supabase.auth.getUser().then(({ data: authData }) => {
              if (authData?.user) {
                supabase
                  .from('imoveis_captados')
                  .insert({
                    codigo_imovel: code,
                    endereco: payload?.neighborhood || demand.location?.[0] || 'Não informado',
                    preco: payload?.value || demand.budget || demand.maxBudget || 0,
                    status_captacao: 'pendente',
                    user_captador_id: authData.user.id,
                    captador_id: authData.user.id,
                    demanda_locacao_id: demand.type === 'Aluguel' ? demand.id : null,
                    demanda_venda_id: demand.type === 'Venda' ? demand.id : null,
                  })
                  .then(({ error }) => {
                    if (error) console.error('[Diagnostic] Erro insert imóvel:', error)
                    else {
                      const table =
                        demand.type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
                      supabase
                        .from(table)
                        .update({ status_demanda: 'atendida' })
                        .eq('id', demand.id)
                        .then()
                    }
                  })
              }
            })

            // update local fallback
            const newProp: CapturedProperty = {
              code,
              value: payload?.value || demand.budget || 0,
              neighborhood: payload?.neighborhood || '',
              bairro_tipo: 'listado',
              docCompleta: false,
              photoUrl: `https://img.usecurling.com/p/400/300?q=house&seed=${code}`,
              capturedAt: new Date().toISOString(),
              tipo_vinculacao: 'vinculado',
              captador_id: currentUser?.id,
              captador_name: currentUser?.name,
              propertyType: demand.type,
            }

            const updatedDemand = {
              ...demand,
              status: 'Captado sob demanda' as DemandStatus,
              capturedProperties: [...(demand.capturedProperties || []), newProp],
            }

            setAllDemands((prev) => prev.map((d) => (d.id === id ? updatedDemand : d)))
            if (currentUser) addPoints(50, currentUser.id)
            toast({
              title: 'Sucesso',
              description: 'Imóvel registrado. +50 pontos!',
              className: 'bg-emerald-600 text-white',
            })

            return { success: true, message: '' }
          }
          return { success: false, message: 'Ação desconhecida' }
        },
        submitIndependentCapture: (payload) => {
          return { success: true, message: '' }
        },
        claimLooseProperty: (code, demandId) => {
          return { success: true, message: '' }
        },
        linkLoosePropertyToDemand: (code, demandId) => {
          return { success: true, message: '' }
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
