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
  enqueueWebhook: (tipo_notificacao: string, destinatario_whatsapp: string, data: any) => void
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
    (tipo_notificacao: string, destinatario_whatsapp: string, data: any) => {
      const baseUrl = 'https://etic.com/app'
      let mensagem = ''
      switch (tipo_notificacao) {
        case 'NOVA_DEMANDA':
          mensagem = `🚨 *Nova Demanda!*\n👤 Cliente: ${data.clientName}\n📍 Local: ${data.location}\n💰 Orçamento: R$ ${data.budget || data.maxBudget}\n👉 Link: ${baseUrl}/demandas/${data.id}`
          break
        case 'LEMBRETE_24H':
          mensagem = `⏰ *Lembrete 24h!*\nA demanda de ${data.clientName} em ${data.location} precisa de atenção.\n👉 Link: ${baseUrl}/demandas/${data.id}`
          break
        case 'IMOVEL_CAPTADO':
          mensagem = `✅ *Imóvel Captado!*\nNovo imóvel na região de ${data.location} para ${data.clientName}.\n👉 Link: ${baseUrl}/demandas/${data.id}`
          break
        case 'CONFIRMACAO_GESTOR':
          mensagem = `👨‍💼 *Aprovação Necessária!*\nO imóvel captado requer sua análise.\n👉 Link: ${baseUrl}/demandas/${data.id}`
          break
        case 'FALHA_SISTEMA':
          mensagem = `⚠️ *Aviso do Sistema:*\nTivemos uma falha ao processar: ${data.action}.\nPor favor, tente novamente.`
          break
        case 'DESAFIO_SEMANAL':
          mensagem = `🏆 *Desafio da Semana!*\nCapture 3 imóveis nos próximos 5 dias e ganhe bônus!\n👉 Link: ${baseUrl}/ranking`
          break
        case 'VISITA_AGENDADA':
          mensagem = `📅 *Visita Agendada!*\nO cliente ${data.clientName} vai visitar o imóvel em ${data.location} amanhã.\n👉 Link: ${baseUrl}/demandas/${data.id}`
          break
        default:
          mensagem = data.message || 'Notificação do Sistema'
      }

      const id = Math.random().toString(36).substring(2, 9)
      const data_criacao = new Date().toISOString()

      const isValidPhone = /^\+?[0-9]{10,15}$/.test(destinatario_whatsapp.replace(/[\s\-()]/g, ''))
      const isValidMessage = mensagem.trim().length > 0

      if (!isValidPhone || !isValidMessage) {
        setWebhookQueue((prev) => [
          ...prev,
          {
            id,
            tipo_notificacao,
            destinatario_whatsapp,
            mensagem,
            status: 'falha',
            tentativas: 3,
            erro_mensagem: !isValidPhone ? 'Número de WhatsApp inválido' : 'Mensagem vazia',
            data_criacao,
          },
        ])
        return
      }

      setWebhookQueue((prev) => [
        ...prev,
        {
          id,
          tipo_notificacao,
          destinatario_whatsapp,
          mensagem,
          status: 'pendente',
          tentativas: 0,
          data_criacao,
        },
      ])
    },
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
          enqueueWebhook('FALHA_SISTEMA', '+5511999999999', {
            action: `avaliação da demanda de ${demand.clientName} em ${demand.location} (sem resposta há 72h)`,
          })
          addLog(`[Cron] Demanda de ${demand.clientName} atualizada para Impossível (>72h).`)
        } else if (type === '48h') {
          enqueueWebhook('LEMBRETE_24H', '+5511999999999', {
            clientName: demand.clientName,
            location: demand.location,
            id: demand.id,
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
          enqueueWebhook('LEMBRETE_24H', '+5511999999999', {
            clientName: demand.clientName,
            location: demand.location,
            id: demand.id,
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
    const processQueue = () => {
      setWebhookQueue((prev) => {
        const toProcessIndex = prev.findIndex(
          (q) =>
            q.status === 'pendente' ||
            (q.status === 'falha' && q.tentativas > 0 && q.tentativas < 3),
        )
        if (toProcessIndex === -1) return prev

        const next = [...prev]
        const item = next[toProcessIndex]

        const isFailure = Math.random() < 0.2

        if (isFailure) {
          const newTentativas = item.tentativas + 1
          next[toProcessIndex] = {
            ...item,
            status: 'falha',
            tentativas: newTentativas,
            erro_mensagem: 'Erro de conexão com provedor (simulado)',
          }
          if (newTentativas >= 3) {
            addLog(`[Erro] Falha definitiva na notificação para ${item.destinatario_whatsapp}.`)
          }
        } else {
          next[toProcessIndex] = {
            ...item,
            status: 'enviado',
            tentativas: item.tentativas + 1,
            data_envio: new Date().toISOString(),
          }
          toast({
            title: 'WhatsApp Enviado',
            description: `Notificação enviada para ${item.destinatario_whatsapp}`,
            className: 'bg-emerald-600 text-white',
          })
          addLog(`[Sucesso] Notificação enviada para ${item.destinatario_whatsapp}.`)
        }
        return next
      })
    }

    const intervalId = setInterval(processQueue, 1000)
    return () => clearInterval(intervalId)
  }, [addLog])

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
        addDemand: (d) => {
          const newDemand = {
            ...d,
            id: Math.random().toString(36).substr(2, 9),
            createdAt: new Date().toISOString(),
          } as Demand
          setAllDemands((p) => [newDemand, ...p])
          enqueueWebhook('NOVA_DEMANDA', '+5511999999999', newDemand)
        },
        updateDemandStatus: (i, s) => {
          setAllDemands((p) => {
            const next = p.map((d) => (d.id === i ? { ...d, status: s } : d))
            const updated = next.find((x) => x.id === i)
            if (updated && s === 'Em Captação') {
              enqueueWebhook('CONFIRMACAO_GESTOR', '+5511999999999', updated)
            } else if (updated && s === 'Visita') {
              enqueueWebhook('VISITA_AGENDADA', '+5511999999999', updated)
            }
            return next
          })
        },
        submitDemandResponse: (id, action, payload) => {
          const demand = allDemands.find((d) => d.id === id)
          if (action === 'encontrei' && demand) {
            enqueueWebhook('IMOVEL_CAPTADO', '+5511999999999', {
              ...demand,
              location: payload?.endereco || demand.location,
            })
          }
          return { success: true, message: '' }
        },
        submitIndependentCapture: (payload) => {
          enqueueWebhook('IMOVEL_CAPTADO', '+5511999999999', {
            location: payload?.endereco || 'Desconhecida',
            clientName: 'Geral',
            id: 'independente',
          })
        },
        addPoints,
        getSimilarDemands,
        enqueueWebhook,
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
