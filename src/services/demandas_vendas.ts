import { supabase } from '@/lib/supabase/client'
import { Database } from '@/lib/supabase/types'

type InsertArgs = Omit<
  Database['public']['Tables']['demandas_vendas']['Insert'],
  'corretor_id' | 'status_demanda'
>

export const insertDemandaVenda = async (data: InsertArgs) => {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw new Error('Usuário não autenticado')

  const { data: result, error } = await supabase
    .from('demandas_vendas')
    .insert({
      ...data,
      corretor_id: authData.user.id,
      status_demanda: 'aberta',
    })
    .select()
    .single()

  if (error) throw error
  return result
}
