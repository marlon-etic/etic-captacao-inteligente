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

export type NotificationType =
  | 'novo_imovel'
  | 'reivindicado'
  | 'ja_reivindicado'
  | 'demanda_respondida'
  | 'perdido'
  | 'visita'
  | 'negocio'

export type NotificationUrgency = 'alta' | 'media' | 'baixa'
export type NotificationChannel = 'in_app' | 'push' | 'email'

export interface UserPreferences {
  notifications: {
    channels: {
      in_app: boolean
      push: boolean
      email: boolean
    }
    types: Record<NotificationType, boolean>
    quietHours: {
      enabled: boolean
      start: string
      end: string
    }
  }
}

export interface User {
  id: string
  name: string
  email: string
  role: Role
  status?: 'ativo' | 'inativo'
  tipo_demanda?: 'locacao' | 'vendas'
  tipos_demanda_solicitados?: ('locacao' | 'vendas' | 'ambos')[]
  phone?: string
  points: number
  dailyPoints: number
  weeklyPoints: number
  monthlyPoints: number
  badges: BadgeType[]
  stats: UserStats
  avatarUrl?: string
  preferences?: UserPreferences
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
  | 'contato_captador'
  | 'priorizado'

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
  tipo_vinculacao?: 'vinculado' | 'solto'
  status_reivindicacao?: 'disponivel' | 'reivindicado' | 'vinculado'
  usuario_reivindicou_id?: string
  data_reivindicacao?: string
  captador_id?: string
  captador_name?: string
  propertyType?: 'Venda' | 'Aluguel'
  bedrooms?: number
  bathrooms?: number
  parkingSpots?: number
  discarded?: boolean
  discardReason?: string
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
  notificada_12h?: boolean
  notificada_24h?: boolean
  reassigned_24h?: boolean
  notificada_48h?: boolean
  notificada_72h?: boolean
  isRepescagem?: boolean
  isExtension48h?: boolean
  extensionRequestedAt?: string
  notificada_ext_24h?: boolean
  notificada_ext_48h?: boolean
  capturedProperties?: CapturedProperty[]
  isPrioritized?: boolean
  interestedClientsCount?: number
  prioritizeReason?: string
  lostReason?: string
  lostObs?: string
  lastContactedSolicitorAt?: string
  data_priorizacao?: string
  motivo_priorizacao?: string
  data_perda?: string
  motivo_perda?:
    | 'desistiu'
    | 'alugou'
    | 'comprou'
    | 'fora_mercado'
    | 'mudou_ideia'
    | 'outro'
    | string
  observacoes_perda?: string
  grupo_id?: string
  posicao_no_grupo?: number
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

export interface AppNotification {
  id: string
  usuario_id: string
  tipo_notificacao: NotificationType
  titulo: string
  corpo: string
  detalhes?: Record<string, any>
  acao_url?: string
  acao_botao?: string
  urgencia: NotificationUrgency
  canais: NotificationChannel[]
  lida: boolean
  data_criacao: string
  data_leitura?: string
  arquivada?: boolean
  message?: string
  userId?: string
  createdAt?: string
  read?: boolean
}

export interface GroupComment {
  id: string
  groupId: string
  userId: string
  userName: string
  userRole: Role
  content: string
  createdAt: string
}

export interface InactiveGroup {
  id: string
  location: string
  type: string
  bedrooms: number
  bathrooms: number
  parkingSpots: number
  minBudget: number
  maxBudget: number
  totalClients: number
  closedAt: string
  outcome: 'Atendido' | 'Perdido'
}

export interface SystemLog {
  id: string
  timestamp: string
  userId?: string
  userName?: string
  message: string
  context?: string
  type: 'error' | 'info' | 'warning'
}
