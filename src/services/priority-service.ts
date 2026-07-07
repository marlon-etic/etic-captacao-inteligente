import { supabase } from '@/lib/supabase/client'

export async function toggleDemandPriority(
  demandId: string,
  type: 'Aluguel' | 'Venda',
  isPrioritaria: boolean,
  motivo?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const table = type === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
    const now = new Date()
    const updateData: Record<string, unknown> = {
      is_prioritaria: !isPrioritaria,
      updated_at: now.toISOString(),
    }

    if (!isPrioritaria && motivo) {
      updateData.motivo_priorizacao = motivo
      updateData.data_prazo_resposta = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString()
    }

    if (isPrioritaria) {
      updateData.motivo_priorizacao = null
      updateData.data_prazo_resposta = null
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
