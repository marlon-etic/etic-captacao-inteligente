import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  // Headers CORS (do template padrão)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Log de início
    console.log(`${new Date().toISOString()} - Iniciando execução de marcar-demandas-sem-resposta`)

    // Cliente Supabase com SERVICE ROLE (ignora RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Executa a função PostgreSQL
    const { data, error } = await supabase.rpc('fn_marcar_demandas_sem_resposta')

    if (error) throw error

    // Log de resultado
    console.log(`${new Date().toISOString()} - Demandas marcadas:`, data)

    // Retorna JSON com contagens (ex: { demandas_locacao: 5, demandas_vendas: 2 })
    return new Response(
      JSON.stringify({ success: true, data }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  } catch (error) {
    // Log de erro
    console.error(`${new Date().toISOString()} - Erro na execução:`, error)

    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})