import { supabase } from '@/lib/supabase/client'

export const recordVisit = async (property_link_id: string, notes?: string) => {
  const { data, error } = await supabase.functions.invoke('visit-registration', {
    body: { property_link_id, notes },
  })
  return { data, error }
}

export const recordVisitWithDetails = async (params: {
  property_link_id?: string
  imovel_id?: string
  demanda_id?: string
  tipo_demanda?: string
  visited_at?: string
  notes?: string
}) => {
  const { data, error } = await supabase.functions.invoke('visit-registration', {
    body: params,
  })
  return { data, error }
}

export const recordFeedback = async (
  property_link_id: string,
  interest_level: 'interested' | 'not_interested',
  feedback_text?: string,
) => {
  const { data, error } = await supabase.functions.invoke('feedback-registration', {
    body: { property_link_id, interest_level, feedback_text },
  })
  return { data, error }
}

export const recordNegotiation = async (
  property_link_id: string,
  negotiation_status: 'negotiated' | 'failed',
  notes?: string,
  valor_fechado?: number,
) => {
  const { data, error } = await supabase.functions.invoke('negotiation-registration', {
    body: {
      property_link_id,
      negotiation_status,
      notes,
      valor_fechado:
        negotiation_status === 'negotiated' && valor_fechado ? valor_fechado : undefined,
    },
  })
  return { data, error }
}
