import { supabase } from '@/lib/supabase/client'

export async function linkImovelToDemanda(
  imovelId: string,
  demandaId: string,
  isLocacao: boolean,
): Promise<void> {
  const updateData = isLocacao ? { demanda_locacao_id: demandaId } : { demanda_venda_id: demandaId }

  const { error } = await supabase.from('imoveis_captados').update(updateData).eq('id', imovelId)

  if (error) {
    throw error
  }
}
