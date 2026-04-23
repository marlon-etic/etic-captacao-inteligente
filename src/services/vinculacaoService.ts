import { supabase } from '@/lib/supabase/client'
import { isImovelVisivelParaRole } from '@/lib/roleFilters'

export async function linkImovelToDemanda(
  imovelId: string,
  demandaId: string,
  isLocacao: boolean,
  userRole?: string,
): Promise<void> {
  const { data: imovel, error: imovelError } = await supabase
    .from('imoveis_captados')
    .select('tipo')
    .eq('id', imovelId)
    .single()

  if (imovelError || !imovel) {
    throw new Error('Imóvel não encontrado')
  }

  if (!isImovelVisivelParaRole(imovel.tipo, userRole)) {
    throw new Error('Você não tem permissão para vincular este imóvel')
  }

  const updateData = isLocacao ? { demanda_locacao_id: demandaId } : { demanda_venda_id: demandaId }

  const { error } = await supabase.from('imoveis_captados').update(updateData).eq('id', imovelId)

  if (error) {
    throw error
  }
}
