import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Call existing function for marking sem resposta
    const { data: results, error } = await supabase.rpc('fn_marcar_demandas_sem_resposta')

    if (error) {
      console.error('Error calling fn_marcar_demandas_sem_resposta:', error)
    }

    // Call the new archiving function to transition inactive demands to Perdida
    const { error: archiveError } = await supabase.rpc('fn_arquivar_demandas_inativas')
    if (archiveError) {
      console.error('Error archiving demands:', archiveError)
    }

    return new Response(
      JSON.stringify({
        success: true,
        marcadas: results || [],
        archived: archiveError ? false : true,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
