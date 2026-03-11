export type Role = 'captador' | 'sdr' | 'corretor' | 'gestor' | 'admin'

export type BadgeType =
  | '🏆 Especialista'
  | '🚀 Rastreador Rápido'
  | '💎 Sem Demandas Abertas'
  | '⭐ Negociador Estrela'
  | '🔥 Semana de Ouro'
  | '🎯 Perfeccionista'

export interface UserStats {
  imoveisCaptados: number
  responseTimeSum: number
  responseCount: number
  negociosFechados: number
  imoveisCaptadosSemana: number
  diasSemDemandaPendente: number
  streakRespostasRapidas: number
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  points: number
  dailyPoints: number
  weeklyPoints: number
  monthlyPoints: number
  badges: BadgeType[]
  stats: UserStats
  avatarUrl?: string
}

export type DemandStatus =
  | 'Pendente'
  | 'Em Captação'
  | 'Captado sob demanda'
  | 'Captado independente'
  | 'Sem demanda'
  | 'Aguardando'
  | 'Visita'
  | 'Negócio'
  | 'Arquivado'
  | 'Impossível'

export interface Demand {
  id: string
  clientName: string
  clientEmail?: string
  location: string
  budget?: number
  minBudget: number
  maxBudget: number
  bedrooms: number
  parkingSpots: number
  description: string
  timeframe: string
  similarProfilesCount?: number
  type: 'Venda' | 'Aluguel'
  status: DemandStatus
  createdBy: string
  assignedTo?: string
  createdAt: string
  notificada_24h?: boolean
  notificada_48h?: boolean
  notificada_72h?: boolean
  isRepescagem?: boolean
}

export interface WebhookEvent {
  id: string
  event_type: string
  entity_id?: string
  payload: {
    event_type: string
    entity_id?: string
    data: any
    timestamp: string
  }
  status: 'pendente' | 'processando' | 'enviado' | 'falha'
  tentativas: number
  erro_mensagem?: string
  target_url: string
  data_criacao: string
  data_envio?: string
}
