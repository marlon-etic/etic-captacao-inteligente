import { supabase } from '@/lib/supabase/client'

export type EventType =
  | 'property_created'
  | 'property_linked'
  | 'property_unlinked'
  | 'property_visit_scheduled'
  | 'property_deal_closed'
  | 'property_marked_lost'
  | 'demand_created'
  | 'demand_linked'
  | 'demand_unlinked'
  | 'visit_scheduled'
  | 'deal_closed'
  | 'match_accepted'

export async function trackEvent(
  userId: string,
  eventType: EventType,
  eventData?: Record<string, any>,
) {
  if (!userId) return

  try {
    supabase
      .from('analytics_events')
      .insert([
        {
          user_id: userId,
          event_type: eventType,
          event_data: eventData || {},
        },
      ])
      .then((res) => {
        if (res.error) throw res.error
      })
      .catch((err) => {
        console.warn(`[Analytics] Retry track event: ${eventType}`, err)
        setTimeout(() => {
          supabase
            .from('analytics_events')
            .insert([
              {
                user_id: userId,
                event_type: eventType,
                event_data: eventData || {},
              },
            ])
            .catch(() => {})
        }, 1000)
      })
  } catch (err) {
    console.error(`[Analytics] Error in trackEvent:`, err)
  }
}
