import { supabase } from '@/lib/supabase/client'
import { STANDARDIZED_LOST_REASONS } from '@/lib/lost-reasons'

export function isValidLostReason(reason: string): boolean {
  return (STANDARDIZED_LOST_REASONS as readonly string[]).includes(reason)
}

export interface MarkLostResult {
  error: string | null
}

export async function markDemandAsLost(params: {
  demandId: string
  tipo: string
  reason: string
  observacao: string
  userId?: string
  extraUpdate?: Record<string, any>
}): Promise<MarkLostResult> {
  const { demandId, tipo, reason, observacao, userId, extraUpdate } = params

  if (!isValidLostReason(reason)) {
    return { error: 'Motivo de perda inválido. Selecione um motivo da lista padronizada.' }
  }

  const table = tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'
  const tipoDemanda = tipo === 'Aluguel' ? 'locacao' : 'venda'

  const updateData: Record<string, any> = {
    status_demanda: 'perdida',
    motivo_perda: reason,
    motivo_perda_descricao: observacao || null,
    updated_at: new Date().toISOString(),
    ...(extraUpdate || {}),
  }

  const { error: updateError } = await supabase.from(table).update(updateData).eq('id', demandId)

  if (updateError) {
    if (updateError.message.includes('check_motivo_perda_standardized')) {
      return { error: 'Motivo não permitido pelo sistema. Selecione uma opção válida da lista.' }
    }
    return { error: updateError.message }
  }

  await supabase.from('demand_status_log').insert({
    demanda_id: demandId,
    tipo_demanda: tipoDemanda,
    status_novo: 'perdida',
    alterado_por: userId || null,
    motivo: reason,
  })

  await supabase.from('audit_log').insert({
    usuario_id: userId || null,
    acao: 'UPDATE',
    tabela: table,
    registro_id: demandId,
    dados_novos: {
      status_demanda: 'perdida',
      motivo_perda: reason,
      motivo_perda_descricao: observacao,
      ...(extraUpdate || {}),
    },
  })

  return { error: null }
}
