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
  userId: string | undefined | null,
  eventType: EventType,
  eventData?: Record<string, any>,
) {
  if (!userId) {
    console.warn(`[Analytics] Ignored event ${eventType}: No user_id provided`)
    return
  }

  try {
    supabase
      .from('analytics_events' as any)
      .insert([
        {
          user_id: userId,
          event_type: eventType,
          event_data: eventData || {},
        },
      ])
      .then(({ error }: any) => {
        if (error) throw error
        console.log(`[Analytics] Event tracked: ${eventType} for user ${userId}`)
      })
      .catch((err: any) => {
        console.error(`[Analytics] Failed to track event: ${eventType}`, err)
        setTimeout(() => {
          supabase
            .from('analytics_events' as any)
            .insert([
              {
                user_id: userId,
                event_type: eventType,
                event_data: eventData || {},
              },
            ])
            .then(({ error }: any) => {
              if (error) throw error
            })
            .catch((retryErr: any) => {
              console.error(`[Analytics] Retry failed for ${eventType}`, retryErr)
            })
        }, 1000)
      })
  } catch (err) {
    console.error(`[Analytics] Error in trackEvent:`, err)
  }
}
