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
  status?: 'ativo' | 'inativo'
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

export type PropertyActionType =
  | 'captacao'
  | 'visita_agendada'
  | 'visita_realizada'
  | 'proposta'
  | 'negocio'
  | 'perdido'

export interface PropertyAction {
  id: string
  type: PropertyActionType
  timestamp: string
  userId: string
  userName: string
  userRole: Role
  description: string
  observations?: string
}

export interface CapturedProperty {
  code: string
  value: number
  neighborhood: string
  bairro_tipo?: 'listado' | 'outro'
  docCompleta: boolean
  obs?: string
  photoUrl?: string
  capturedAt?: string
  visitaDate?: string
  visitaTime?: string
  visitaObs?: string
  visita_realizada?: string
  propostaDate?: string
  propostaValue?: number
  propostaObs?: string
  propostaStatus?: 'em análise' | 'aceita' | 'recusada'
  fechamentoDate?: string
  fechamentoValue?: number
  fechamentoType?: 'Venda' | 'Aluguel'
  fechamentoObs?: string
  history?: PropertyAction[]
  numero_imovel_para_demanda?: number
  demandas_atendidas_ids?: string[]
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
  capturedProperties?: CapturedProperty[]
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
