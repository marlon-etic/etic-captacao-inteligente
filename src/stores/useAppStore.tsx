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
  scheduleVisit: (id: string, payload: any) => void
  closeDeal: (id: string, payload: any) => void
  scheduleVisitByCode: (code: string, payload: any) => void
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
    id: '3',
    name: 'Roberto Corretor',
    email: 'corretor@etic.com',
    role: 'corretor',
    tipo_demanda: 'vendas',
    points: 950,
    dailyPoints: 50,
    weeklyPoints: 300,
    monthlyPoints: 950,
    badges: ['⭐ Negociador Estrela'],
    stats: { ...defaultStats, negociosFechados: 5 },
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

const initialDemands: Demand[] = [
  createDem('d1', 'João Pedro', 'Jardins', 5, 'Urgente'),
  {
    ...createDem('d2', 'Maria Silva', 'Moema', 25, 'Até 15 dias'),
    status: 'Captado sob demanda',
    assignedTo: '1',
    capturedProperty: {
      code: 'AP-452',
      value: 950000,
      neighborhood: 'Moema',
      docCompleta: true,
      obs: 'Apartamento recém reformado',
      photoUrl: 'https://img.usecurling.com/p/400/300?q=apartment&seed=d2',
    },
  },
  {
    ...createDem('d3', 'Carlos Santos', 'Pinheiros', 49, 'Até 30 dias'),
    status: 'Visita',
    assignedTo: '1',
    capturedProperty: {
      code: 'CS-881',
      value: 1150000,
      neighborhood: 'Pinheiros',
      docCompleta: false,
      visitaDate: new Date().toISOString().split('T')[0],
      visitaTime: '14:30',
      photoUrl: 'https://img.usecurling.com/p/400/300?q=house&seed=d3',
    },
  },
  createDem('d4', 'Fernanda Lima', 'Centro', 73, 'Até 90 dias ou +'),
  {
    ...createDem('d5', 'Lucas Vendas', 'Vila Olímpia', 10, 'Até 15 dias'),
    type: 'Venda',
    createdBy: '3',
    status: 'Visita',
    capturedProperty: {
      code: 'VD-101',
      value: 1500000,
      neighborhood: 'Vila Olímpia',
      docCompleta: true,
      visitaDate: new Date().toISOString().split('T')[0],
      visitaTime: '10:00',
      photoUrl: 'https://img.usecurling.com/p/400/300?q=apartment&seed=d5',
    },
  },
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
  const scheduleVisitByCodeRef = useRef<any>(null)
  const closeDealByCodeRef = useRef<any>(null)

  useEffect(() => {
    webhookQueueRef.current = webhookQueue
  }, [webhookQueue])

  const addLog = useCallback(
    (msg: string) =>
      setAuditLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]),
    [],
  )

  const broadcastState = useCallback(
    (nextDemands: Demand[], nextUsers: User[], actionMsg?: string) => {
      const payload = {
        demands: nextDemands,
        users: nextUsers,
        lastAction: actionMsg,
        timestamp: Date.now(),
      }
      const raw = JSON.stringify(payload)
      localStorage.setItem('etic_state_sync', raw)
      try {
        const bc = new BroadcastChannel('etic-ws-sync')
        bc.postMessage(payload)
        bc.close()
      } catch (e) {
        // ignore
      }
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
    } catch (e) {
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
    } catch (e) {
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

  const scheduleVisitByCode = useCallback(
    (code: string, payload: any) => {
      const demand = allDemands.find((d) => d.capturedProperty?.code === code)
      if (!demand) {
        toast({ variant: 'destructive', description: 'Imóvel não encontrado' })
        return
      }
      if (
        currentUser?.role === 'corretor' &&
        (demand.type !== 'Venda' || demand.createdBy !== currentUser.id)
      ) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para atualizar este imóvel',
        })
        return
      }
      if (currentUser?.role === 'captador' && demand.assignedTo !== currentUser.id) {
        toast({
          variant: 'destructive',
          description: 'Você não tem permissão para atualizar este imóvel',
        })
        return
      }

      const updated = {
        ...demand,
        status: 'Visita' as DemandStatus,
        capturedProperty: {
          ...demand.capturedProperty!,
          visitaDate: payload.date,
          visitaTime: payload.time,
          visitaObs: payload.obs,
        },
      }

      const nextDemands = allDemands.map((d) => (d.id === demand.id ? updated : d))
      setAllDemands(nextDemands)
      enqueueWebhook('visita_agendada', demand.id, updated)
      const msg = `Status alterado para Visita Agendada: Imóvel ${code} por ${currentUser?.name || 'Sistema'}`
      addLog(msg)
      toast({ title: 'Visita Agendada', description: 'O status foi sincronizado com sucesso.' })
      broadcastState(nextDemands, users, msg)
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState],
  )

  const closeDealByCode = useCallback(
    (code: string, payload: any) => {
      const demand = allDemands.find((d) => d.capturedProperty?.code === code)
      if (!demand) {
        toast({ variant: 'destructive', description: 'Imóvel não encontrado' })
        return
      }
      if (
        currentUser?.role === 'corretor' &&
        (demand.type !== 'Venda' || demand.createdBy !== currentUser.id)
      ) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para atualizar este imóvel',
        })
        return
      }
      if (currentUser?.role === 'captador' && demand.assignedTo !== currentUser.id) {
        toast({
          variant: 'destructive',
          description: 'Você não tem permissão para atualizar este imóvel',
        })
        return
      }
      if (demand.status !== 'Visita') {
        toast({
          variant: 'destructive',
          description: "Imóvel deve estar em status 'Visita Agendada' para ser fechado.",
        })
        return
      }

      let earnedPoints = 100 // Base points
      const budgetTarget = demand.maxBudget || demand.budget || 0
      let aboveBudgetInfo = ''
      if (budgetTarget > 0 && payload.value > budgetTarget) {
        earnedPoints += 50
        aboveBudgetInfo = ' (+50 valor acima do orçamento)'
      }
      if (demand.isPrioritized) {
        earnedPoints += 25
      }

      const updated = {
        ...demand,
        status: 'Negócio' as DemandStatus,
        capturedProperty: {
          ...demand.capturedProperty!,
          fechamentoDate: payload.date,
          fechamentoValue: payload.value,
          fechamentoType: payload.type,
          fechamentoObs: payload.obs,
        },
      }

      const nextDemands = allDemands.map((d) => (d.id === demand.id ? updated : d))
      setAllDemands(nextDemands)
      enqueueWebhook('negocio_fechado', demand.id, updated)

      let nextUsers = users
      if (demand.assignedTo) {
        nextUsers = users.map((u) =>
          u.id === demand.assignedTo
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
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState],
  )

  useEffect(() => {
    scheduleVisitByCodeRef.current = scheduleVisitByCode
    closeDealByCodeRef.current = closeDealByCode
  }, [scheduleVisitByCode, closeDealByCode])

  const prioritizeDemand = useCallback(
    (id: string, count: number) => {
      const demand = allDemands.find((d) => d.id === id)
      if (
        currentUser?.role === 'corretor' &&
        (demand?.type !== 'Venda' || demand?.createdBy !== currentUser.id)
      ) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para priorizar esta demanda.',
        })
        return
      }

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
      if (
        currentUser?.role === 'corretor' &&
        (demand?.type !== 'Venda' || demand?.createdBy !== currentUser.id)
      ) {
        toast({
          variant: 'destructive',
          title: 'Acesso negado',
          description: 'Você não tem permissão para acessar este recurso.',
        })
        return
      }

      setAllDemands((prev) => {
        const next = prev.map((d) =>
          d.id === id
            ? { ...d, status: 'Perdida' as DemandStatus, lostReason: reason, lostObs: obs }
            : d,
        )
        broadcastState(next, users, 'Demanda perdida')
        return next
      })
      enqueueWebhook('demanda_perdida', id, { reason, obs })
      addLog(`Demanda perdida (ID: ${id}) motivo: ${reason}`)
      toast({ title: 'Demanda marcada como perdida', description: 'O status foi atualizado.' })
    },
    [allDemands, currentUser, users, enqueueWebhook, addLog, broadcastState],
  )

  const visibleDemands = useMemo(() => {
    if (currentUser?.role === 'corretor') {
      return allDemands.filter((d) => d.type === 'Venda' && d.createdBy === currentUser.id)
    }
    return allDemands
  }, [allDemands, currentUser])

  const checkCorretorAccess = (demand: Demand | undefined) => {
    if (currentUser?.role === 'corretor') {
      if (!demand || demand.type !== 'Venda' || demand.createdBy !== currentUser.id) {
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

  return (
    <AppContext.Provider
      value={{
        currentUser,
        users,
        demands: visibleDemands,
        webhookQueue,
        auditLogs,
        triggerCron,
        login: (email, password) => {
          const user = users.find((u) => u.email === email)
          if (!user) {
            toast({
              variant: 'destructive',
              title: 'Erro de Autenticação',
              description: 'Email não cadastrado',
            })
            return
          }
          if (password && password !== '123456') {
            toast({
              variant: 'destructive',
              title: 'Erro de Autenticação',
              description: 'Senha incorreta',
            })
            return
          }
          setCurrentUser(user)
          toast({ title: 'Bem-vindo(a)!', description: `Sessão iniciada como ${user.name}` })
        },
        logout: () => setCurrentUser(null),
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
          setAllDemands((p) => [newDemand, ...p])
          enqueueWebhook('nova_demanda', newDemand.id, newDemand)
        },
        updateDemandStatus: (i, s) => {
          if (!checkCorretorAccess(allDemands.find((d) => d.id === i))) return

          setAllDemands((p) => {
            const next = p.map((d) => (d.id === i ? { ...d, status: s } : d))
            const updated = next.find((x) => x.id === i)
            if (updated && s === 'Em Captação')
              enqueueWebhook('confirmacao_gestor', updated.id, updated)
            else if (updated && s === 'Visita')
              enqueueWebhook('visita_agendada', updated.id, updated)
            return next
          })
        },
        submitDemandResponse: (id, action, payload) => {
          const demand = allDemands.find((d) => d.id === id)
          if (!checkCorretorAccess(demand)) return { success: false, message: 'Acesso negado' }

          if (action === 'encontrei' && demand) {
            const isPriority = demand.isPrioritized

            const updatedDemand = {
              ...demand,
              status: 'Captado sob demanda' as DemandStatus,
              capturedProperty: {
                code: payload?.code || `IMV-${Math.floor(Math.random() * 1000)}`,
                value: payload?.value || demand.budget || demand.maxBudget,
                neighborhood:
                  payload?.neighborhood || demand.location.split(',')[0] || 'Desconhecido',
                docCompleta: payload?.docCompleta || false,
                obs: payload?.obs,
                photoUrl: `https://img.usecurling.com/p/400/300?q=house&seed=${demand.id}`,
              },
            }

            const nextDemands = allDemands.map((d) => (d.id === id ? updatedDemand : d))
            setAllDemands(nextDemands)

            let nextUsers = users
            if (isPriority && currentUser) {
              nextUsers = users.map((u) =>
                u.id === currentUser.id
                  ? {
                      ...u,
                      points: u.points + 25,
                      dailyPoints: u.dailyPoints + 25,
                      weeklyPoints: u.weeklyPoints + 25,
                      monthlyPoints: u.monthlyPoints + 25,
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
                title: 'Bônus de Prioridade! 🎉',
                description: 'Você ganhou +25 pontos por captar uma demanda priorizada!',
                className: 'bg-pink-600 text-white border-pink-600',
              })
            }

            broadcastState(
              nextDemands,
              nextUsers,
              `Imóvel captado: ${updatedDemand.clientName}${isPriority ? ' (Priorizado)' : ''}`,
            )

            enqueueWebhook('imovel_captado', demand.id, {
              ...updatedDemand,
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
        scheduleVisit: (id, payload) => {
          const d = allDemands.find((x) => x.id === id)
          if (!checkCorretorAccess(d)) return
          if (d?.capturedProperty?.code) scheduleVisitByCode(d.capturedProperty.code, payload)
        },
        closeDeal: (id, payload) => {
          const d = allDemands.find((x) => x.id === id)
          if (!checkCorretorAccess(d)) return
          if (d?.capturedProperty?.code) closeDealByCode(d.capturedProperty.code, payload)
        },
        scheduleVisitByCode,
        closeDealByCode,
        prioritizeDemand,
        markDemandLost,
        addPoints,
        getSimilarDemands: (id) => {
          const listToSearch = currentUser?.role === 'corretor' ? visibleDemands : allDemands
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
