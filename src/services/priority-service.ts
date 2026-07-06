import { supabase } from '@/lib/supabase/client'

export async function toggleDemandPriority(
  demandId: string,
  type: 'Aluguel' | 'Venda',
  isPrioritaria: boolean,
  motivo?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
    const updateData: Record<string, unknown> = { is_prioritaria: !isPrioritaria }

    if (!isPrioritaria && motivo) {
      updateData.motivo_priorizacao = motivo
    }

    const { error } = await supabase.from(table).update(updateData).eq('id', demandId)

    if (error) throw error

    return { success: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

export async function getPriorityDemands(type: 'Aluguel' | 'Venda') {
  try {
    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
    const { data, error } = await supabase
      .from(table)
      .select('id, nome_cliente, is_prioritaria, motivo_priorizacao')
      .eq('is_prioritaria', true)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch {
    return []
  }
}
