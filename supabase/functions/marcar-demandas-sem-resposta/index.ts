import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Call updated sem resposta function (now includes 72h "Estou Buscando" rule)
    const { data: result1, error: err1 } = await supabase.rpc('fn_marcar_demandas_sem_resposta')
    if (err1) throw err1

    // Call global escalation function
    const { error: err2 } = await supabase.rpc('fn_escalate_all_expired_demands')
    if (err2) throw err2

    // Call 30-day inactivity rule function
    const { error: err3 } = await supabase.rpc('fn_marcar_demandas_perdidas_inatividade')
    if (err3) console.error('Error calling fn_marcar_demandas_perdidas_inatividade:', err3)

    return new Response(
      JSON.stringify({
        success: true,
        message:
          'Demandas processadas: Collective 72h Timeout (0 responses) + 30d Inatividade + Escalation. Individual catcher responses do NOT trigger global timeout.',
        data: result1,
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
