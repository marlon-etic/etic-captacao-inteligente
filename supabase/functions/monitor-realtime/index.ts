import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    // Monitoramento de canais realtime ativos
    let channelsCount = 0
    try {
      const { data: channels } = await supabaseAdmin.rpc('get_active_channels')
      channelsCount = channels?.length || 0
    } catch (e) {
      // RPC customizada pode não existir, fallback silencioso
    }

    // Health check das instâncias de realtime
    let realtimeHealthy = true
    try {
      const { data: realtime_health } = await supabaseAdmin.rpc('realtime_health_check')
      if (realtime_health && typeof realtime_health.healthy === 'boolean') {
        realtimeHealthy = realtime_health.healthy
      }
    } catch (e) {
      // Basic ping como fallback
      const { error } = await supabaseAdmin.from('users').select('id').limit(1)
      realtimeHealthy = !error
    }

    return new Response(
      JSON.stringify({
        channels_count: channelsCount,
        realtime_healthy: realtimeHealthy,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
