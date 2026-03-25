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
  isRestoringUser: boolean
  logSystemEvent: (message: string, type?: 'error' | 'info' | 'warning', context?: string) => void
  logAuthEvent: (
    event: string,
    status: 'sucesso' | 'erro' | 'bloqueado',
    path?: string,
    email?: string,
  ) => void
  addNotification: (notification: Partial<AppNotification>) => void
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
  logout: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<void>
  resetPassword: (password: string, token: string) => Promise<void>
  addDemand: (demand: Partial<Demand>) => void
  updateDemandStatus: (id: string, status: DemandStatus) => void
  submitDemandResponse: (
    id: string,
    action: 'encontrei' | 'nao_encontrei',
    payload: any,
  ) => Promise<any>
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

  const [isRestoringUser, setIsRestoringUser] = useState(true)
  const [users, setUsers] = useState<User[]>([])

  const [allDemands, setAllDemands] = useState<Demand[]>([])
  const [looseProperties, setLooseProperties] = useState<CapturedProperty[]>([])
  const [webhookQueue, setWebhookQueue] = useState<WebhookEvent[]>([])
  const [auditLogs, setAuditLogs] = useState<string[]>([])
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([])
  const [isProcessingUser, setIsProcessingUser] = useState(false)

  const [authAuditLogs, setAuthAuditLogs] = useState<AuthAuditLog[]>([])
  const [adminAuditLogs, setAdminAuditLogs] = useState<AdminAuditLog[]>([])

  const [notifications, setNotifications] = useState<AppNotification[]>([])

  const [groupComments, setGroupComments] = useState<GroupComment[]>([])
  const [inactiveGroups] = useState<InactiveGroup[]>([])

  const webhookQueueRef = useRef(webhookQueue)
  const loosePropertiesRef = useRef(looseProperties)
  const isProcessingRef = useRef(false)
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

  // Restore session from Supabase on mount
  useEffect(() => {
    let mounted = true
    const restoreSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session?.user && !currentUser) {
          const { data: supaUser } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (supaUser && mounted) {
            const u = {
              id: supaUser.id,
              name: supaUser.nome,
              email: supaUser.email,
              role: supaUser.role as any,
              status: (supaUser.status || 'ativo') as any,
              points: 0,
              dailyPoints: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
              badges: [],
              stats: defaultStats,
              preferences: defaultPreferences,
              createdAt: supaUser.created_at || new Date().toISOString(),
            } as User
            setCurrentUser(u)
            setSessionExpiresAt(Date.now() + 86400000)
            localStorage.setItem(
              'etic_session',
              JSON.stringify({ user: u, expiresAt: Date.now() + 86400000 }),
            )
          }
        }
      } catch (err) {
        console.error('[useAppStore] Failed to restore session', err)
      } finally {
        if (mounted) setIsRestoringUser(false)
      }
    }

    restoreSession()

    return () => {
      mounted = false
    }
  }, [])

  // Real-time Users Fetching via Polling
  useEffect(() => {
    if (!currentUser) return
    let mounted = true

    const fetchUsers = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) return

        const { data, error } = await supabase.from('users').select('*')
        if (data && !error && mounted) {
          const dbUsers: User[] = data.map((u: any) => ({
            id: u.id,
            name: u.nome,
            email: u.email,
            role: u.role as any,
            status: (u.status || 'ativo') as any,
            whatsapp: '',
            points: 0,
            dailyPoints: 0,
            weeklyPoints: 0,
            monthlyPoints: 0,
            badges: [],
            stats: defaultStats,
            preferences: defaultPreferences,
            createdAt: u.created_at || new Date().toISOString(),
          }))
          setUsers(dbUsers)
        }
      } catch (err) {
        console.error('Error fetching users', err)
      }
    }

    fetchUsers()

    // Replacing problematic realtime channel with robust polling for users list (updates every 10s)
    const interval = setInterval(fetchUsers, 10000)

    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [currentUser?.id])

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

  const addNotification = useCallback(
    (n: Partial<AppNotification>) => {
      setNotifications((prev) => [
        {
          id: Math.random().toString(36).substring(2, 9),
          usuario_id: currentUser?.id || 'system',
          titulo: n.titulo || '',
          corpo: n.corpo || '',
          tipo_notificacao: n.tipo_notificacao || 'info',
          urgencia: n.urgencia || 'baixa',
          lida: false,
          arquivada: false,
          data_criacao: new Date().toISOString(),
          acao_url: n.acao_url,
          acao_botao: n.acao_botao,
          detalhes: n.detalhes,
          ...n,
        } as AppNotification,
        ...prev,
      ])
    },
    [currentUser],
  )

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, lida: true } : n)))
  }, [])

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, lida: true })))
  }, [])

  const archiveNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, arquivada: true } : n)))
  }, [])

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

  const addPoints = useCallback((amount: number, userId?: string) => {}, [])

  const updateUser = useCallback(
    (id: string, updates: Partial<User>) => {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)))
      if (currentUser?.id === id) {
        setCurrentUser((prev) => (prev ? { ...prev, ...updates } : prev))
      }
    },
    [currentUser],
  )

  const createUser = useCallback((userData: Partial<User>) => {}, [])

  const updateDashboardPrefs = useCallback(
    (prefs: Record<string, boolean>) => {
      if (!currentUser) return
      updateUser(currentUser.id, { dashboardPrefs: prefs })
    },
    [currentUser, updateUser],
  )

  const triggerCron = useCallback(() => {}, [])
  const scheduleVisitByCode = useCallback((code: string, payload: any) => {}, [])
  const submitProposalByCode = useCallback((code: string, payload: any) => {}, [])
  const closeDealByCode = useCallback((code: string, payload: any) => {}, [])
  const prioritizeDemand = useCallback((id: string, reason: string, count: number) => {}, [])

  const markDemandLost = useCallback((id: string, reason: string, obs?: string) => {
    supabase.auth
      .getUser()
      .then(async ({ data: authData }) => {
        if (authData?.user) {
          const { data: loc } = await supabase
            .from('demandas_locacao')
            .select('id')
            .eq('id', id)
            .single()
          const table = loc ? 'demandas_locacao' : 'demandas_vendas'

          await supabase.from(table).update({ status_demanda: 'impossivel' }).eq('id', id)
        }
      })
      .catch(console.error)
  }, [])

  const markPropertyLost = useCallback(
    (code: string, demandId: string, reason: string, obs?: string) => {
      supabase.auth
        .getUser()
        .then(async ({ data: authData }) => {
          if (authData?.user) {
            const { error } = await supabase
              .from('imoveis_captados')
              .update({ status_captacao: 'perdido' })
              .eq('codigo_imovel', code)

            if (error) console.error(error)
          }
        })
        .catch(console.error)
    },
    [],
  )

  const updatePropertyDetails = useCallback(
    (demandId: string, propertyCode: string, payload: any) => {},
    [],
  )
  const logContactAttempt = useCallback(
    (demandId: string, code: string, method: 'whatsapp' | 'interno', message?: string) => {},
    [],
  )
  const logSolicitorContactAttempt = useCallback(
    (demandId: string, method: 'whatsapp' | 'email' | 'interno', message?: string) => {},
    [],
  )
  const getSimilarDemands = useCallback((id: string) => [], [])
  const addGroupComment = useCallback((groupId: string, content: string) => {}, [])

  // Safe async logout explicitly addressing edge cases
  const logout = useCallback(async () => {
    try {
      setCurrentUser(null)
      setSessionExpiresAt(null)
      localStorage.removeItem('etic_session')
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Silent logout error caught:', err)
    }
  }, [])

  const loginFn = useCallback(
    async (email: string, password?: string) => {
      const cleanEmail = email.toLowerCase().trim()
      let user = usersRef.current.find((u) => u.email.toLowerCase() === cleanEmail)

      if (!user) {
        try {
          const { data: supaUser, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', cleanEmail)
            .single()

          if (supaUser) {
            user = {
              id: supaUser.id,
              name: supaUser.nome,
              email: supaUser.email,
              role: supaUser.role as any,
              status: (supaUser.status || 'ativo') as any,
              points: 0,
              dailyPoints: 0,
              weeklyPoints: 0,
              monthlyPoints: 0,
              badges: [],
              stats: defaultStats,
              preferences: defaultPreferences,
              createdAt: supaUser.created_at || new Date().toISOString(),
            } as User
          }
        } catch (err) {
          console.error('Erro ao buscar usuário no Supabase:', err)
        }
      }

      if (!user) {
        logAuthEvent('Tentativa de login falhou', 'erro', '/login', email)
        throw new Error('E-mail não encontrado no sistema. Verifique suas credenciais.')
      }
      if (user.status === 'bloqueado' || user.status === 'inativo') {
        logAuthEvent('Login em conta bloqueada/inativa', 'bloqueado', '/login', email)
        throw new Error('Sua conta foi bloqueada pelo administrador.')
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
    [logAuthEvent],
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
        systemLogs,
        authAuditLogs,
        adminAuditLogs,
        isProcessingUser,
        isRestoringUser,
        logSystemEvent,
        logAuthEvent,
        notifications,
        groupComments,
        inactiveGroups,
        addGroupComment,
        triggerCron,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        archiveNotification,
        updateUserPreferences: (prefs) => {},
        updateDashboardPrefs,
        updateUser,
        createUser,
        createUserAdmin: async (payload: Partial<User>, password?: string) => {
          setIsProcessingUser(true)
          try {
            if (!password) throw new Error('Senha é obrigatória para novos usuários')

            const reqPromise = supabase.functions.invoke('admin-users', {
              body: {
                action: 'createUser',
                payload: {
                  email: payload.email,
                  password: password,
                  name: payload.name,
                  role: payload.role,
                  status: payload.status,
                },
              },
            })

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout de 45s excedido na função Edge')), 45000),
            )

            const { data, error } = (await Promise.race([reqPromise, timeoutPromise])) as any

            if (error) throw new Error(error.message || 'Erro de rede ao criar usuário')
            if (data?.error) throw new Error(data.error)
          } finally {
            setIsProcessingUser(false)
          }
        },
        updateUserAdmin: async (id: string, payload: Partial<User>, password?: string) => {
          setIsProcessingUser(true)
          try {
            const bodyPayload: any = {
              id,
              email: payload.email,
              name: payload.name,
              role: payload.role,
              status: payload.status,
            }
            if (password) bodyPayload.password = password

            const reqPromise = supabase.functions.invoke('admin-users', {
              body: { action: 'updateUser', payload: bodyPayload },
            })

            const timeoutPromise = new Promise((_, reject) =>
              setTimeout(() => reject(new Error('Timeout de 45s excedido na função Edge')), 45000),
            )

            const { data, error } = (await Promise.race([reqPromise, timeoutPromise])) as any

            if (error) throw new Error(error.message || 'Erro de rede ao atualizar usuário')
            if (data?.error) throw new Error(data.error)

            setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...payload } : u)))
            if (currentUser?.id === id) {
              setCurrentUser((prev) => (prev ? { ...prev, ...payload } : prev))
            }
          } finally {
            setIsProcessingUser(false)
          }
        },
        getMatchesForProperty: (property: CapturedProperty) => [],
        login: loginFn,
        logout,
        requestPasswordReset: async (email) => {
          const cleanEmail = email.toLowerCase().trim()
          const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
            redirectTo: `${window.location.origin}/redefinir-senha`,
          })
          if (error)
            throw new Error(
              'Não foi possível enviar o link de recuperação. Verifique o email informado.',
            )
        },
        resetPassword: async (password, token) => {
          const { error } = await supabase.auth.updateUser({ password })
          if (error) throw new Error('O link é inválido ou já expirou. Solicite um novo link.')
          await supabase.auth.signOut()
        },
        addDemand: (d) => {},
        updateDemandStatus: async (id: string, status: DemandStatus) => {
          let dbStatus = 'aberta'
          if (status === 'Negócio' || status === 'ganho' || status === 'Fechado') {
            dbStatus = 'ganho'
          } else if (
            status === 'Atendida' ||
            status === 'Captado sob demanda' ||
            status === 'Visita' ||
            status === 'Proposta'
          ) {
            dbStatus = 'atendida'
          } else if (status === 'Perdida' || status === 'Impossível') {
            dbStatus = 'impossivel'
          }

          const { data: locData } = await supabase
            .from('demandas_locacao')
            .select('id')
            .eq('id', id)
            .single()
          const table = locData ? 'demandas_locacao' : 'demandas_vendas'
          await supabase.from(table).update({ status_demanda: dbStatus }).eq('id', id)
        },
        submitGroupCapture: (demandIds, payload) => {
          return { success: true, message: '' }
        },
        submitDemandResponse: async (id, action, payload) => {
          try {
            const { data: authData, error: authError } = await supabase.auth.getUser()
            if (authError || !authData?.user)
              return { success: false, message: 'Usuário não autenticado' }

            let isLocacao = true
            let dbDemand: any = null

            const { data: locData } = await supabase
              .from('demandas_locacao')
              .select('*')
              .eq('id', id)
              .single()

            if (locData) {
              dbDemand = locData
            } else {
              const { data: venData } = await supabase
                .from('demandas_vendas')
                .select('*')
                .eq('id', id)
                .single()
              if (venData) {
                dbDemand = venData
                isLocacao = false
              }
            }

            if (!dbDemand) return { success: false, message: 'Demanda não encontrada' }

            if (action === 'encontrei') {
              const code = payload?.code || `IMV-${Math.floor(Math.random() * 1000)}`
              const { error } = await supabase.from('imoveis_captados').insert({
                codigo_imovel: code,
                endereco:
                  payload?.neighborhood ||
                  dbDemand.localizacoes?.[0] ||
                  dbDemand.bairros?.[0] ||
                  'Não informado',
                preco: payload?.value || dbDemand.orcamento_max || dbDemand.valor_maximo || 0,
                status_captacao: 'pendente',
                user_captador_id: authData.user.id,
                captador_id: authData.user.id,
                demanda_locacao_id: isLocacao ? id : null,
                demanda_venda_id: !isLocacao ? id : null,
              })

              if (!error) {
                const table = isLocacao ? 'demandas_locacao' : 'demandas_vendas'
                await supabase.from(table).update({ status_demanda: 'atendida' }).eq('id', id)
              }

              return {
                success: !error,
                message: error ? error.message : 'Imóvel vinculado com sucesso',
              }
            }

            if (action === 'nao_encontrei') {
              const { error } = await supabase.from('respostas_captador').insert({
                demanda_locacao_id: isLocacao ? id : null,
                demanda_venda_id: !isLocacao ? id : null,
                captador_id: authData.user.id,
                resposta: 'nao_encontrei',
                motivo: payload?.motivo || 'Outro motivo',
                observacao: payload?.observacao || '',
              })

              return {
                success: !error,
                message: error ? error.message : 'Feedback registrado com sucesso',
              }
            }

            return { success: false, message: 'Ação desconhecida' }
          } catch (err: any) {
            console.warn('Erro em submitDemandResponse:', err)
            return { success: false, message: err.message || 'Erro de conexão com o servidor' }
          }
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
