export interface LandlordProfile {
  id: string
  user_id: string
  name: string
  email: string
  phone: string
  codigo_locador: string
  property_codes: string[] | string
  total_imoveis: number
  total_revenue: number
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  landlord_id: string
  code: string
  address: string
  city: string
  state: string
  zipcode: string
  rent_value: number
  bedrooms: number
  bathrooms: number
  garage_spaces: number
  tenant_name?: string
  tenant_phone?: string
  lease_start_date?: string
  lease_end_date?: string
  created_at: string
  updated_at: string
  neighborhood?: string
  photoUrl?: string
  status?: string
}

export interface TenantProposal {
  id: string
  property_id: string
  tenant_id?: string
  tenant_name: string
  tenant_email: string
  tenant_phone: string
  tenant_score: number
  monthly_income: number
  employment_status: string
  proposed_move_date: string
  message: string
  created_at: string
  status: 'pending' | 'accepted' | 'rejected'
  response_date?: string
  response_message?: string
}

export interface PropertyPerformance {
  property_id: string
  total_revenue: number
  months_occupied: number
  vacancy_rate: number
  average_tenant_score: number
  maintenance_costs: number
  net_revenue: number
}

export interface DashboardStats {
  total_properties: number
  occupied_properties: number
  pending_proposals: number
  total_revenue: number
  average_score: number
}
