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
  tipo_demanda?: 'locacao' | 'vendas'
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
  | 'Proposta'
  | 'Negócio'
  | 'Arquivado'
  | 'Impossível'
  | 'Perdida'

export interface CapturedProperty {
  code: string
  value: number
  neighborhood: string
  docCompleta: boolean
  obs?: string
  photoUrl?: string
  capturedAt?: string
  visitaDate?: string
  visitaTime?: string
  visitaObs?: string
  propostaDate?: string
  propostaValue?: number
  propostaObs?: string
  fechamentoDate?: string
  fechamentoValue?: number
  fechamentoType?: 'Venda' | 'Aluguel'
  fechamentoObs?: string
}

export interface Demand {
  id: string
  clientName: string
  clientEmail?: string
  location: string
  budget?: number
  minBudget: number
  maxBudget: number
  bedrooms: number
  bathrooms?: number
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
  capturedProperty?: CapturedProperty
  isPrioritized?: boolean
  interestedClientsCount?: number
  lostReason?: string
  lostObs?: string
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
