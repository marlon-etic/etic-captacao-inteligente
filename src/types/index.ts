export type Role = 'captador' | 'sdr' | 'corretor' | 'gestor' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: Role
  points: number
  avatarUrl?: string
}

export type DemandStatus =
  | 'Pendente'
  | 'Em Captação'
  | 'Captado sob demanda'
  | 'Sem demanda'
  | 'Aguardando'
  | 'Visita'
  | 'Negócio'
  | 'Arquivado'

export interface Demand {
  id: string
  clientName: string
  clientEmail?: string
  location: string
  budget?: number
  minBudget: number
  maxBudget: number
  description: string
  timeframe: string
  type: 'Venda' | 'Aluguel'
  status: DemandStatus
  createdBy: string // user id
  assignedTo?: string // user id
  createdAt: string
}
