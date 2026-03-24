const N8N_WEBHOOK_URL =
  import.meta.env.VITE_N8N_WEBHOOK_URL || 'https://mock-n8n.example.com/webhook-actions'

export interface WebhookPayload {
  event_type: string
  landlord_id: string
  entity_id: string
  action: string
  data: Record<string, any>
  timestamp: string
}

export const sendWebhookEvent = async (payload: WebhookPayload): Promise<boolean> => {
  try {
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('Webhook error:', response.statusText)
      return false
    }

    return true
  } catch (error) {
    console.error('Erro ao enviar webhook:', error)
    return false
  }
}

export const triggerProposalResponse = async (
  landlordId: string,
  proposalId: string,
  status: 'accepted' | 'rejected',
  message?: string,
) => {
  const payload: WebhookPayload = {
    event_type: 'proposal_response',
    landlord_id: landlordId,
    entity_id: proposalId,
    action: status,
    data: {
      status,
      message,
      response_date: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  }

  return sendWebhookEvent(payload)
}

export const triggerPropertyUpdate = async (
  landlordId: string,
  propertyId: string,
  updateData: Record<string, any>,
) => {
  const payload: WebhookPayload = {
    event_type: 'property_update',
    landlord_id: landlordId,
    entity_id: propertyId,
    action: 'update',
    data: updateData,
    timestamp: new Date().toISOString(),
  }

  return sendWebhookEvent(payload)
}
