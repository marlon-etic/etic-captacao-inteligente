import { supabase } from '@/lib/supabase/client'

export const vinculacaoService = {
  linkImovelToDemanda: async (
    params: { imovelId: string; demandaId: string; usuarioId: string; isLocacao: boolean },
    signal?: AbortSignal,
  ) => {
    try {
      const updateData = params.isLocacao
        ? { demanda_locacao_id: params.demandaId, status_captacao: 'capturado' }
        : { demanda_venda_id: params.demandaId, status_captacao: 'capturado' }

      const { error } = await supabase
        .from('imoveis_captados')
        .update(updateData)
        .eq('id', params.imovelId)
        .abortSignal(signal || new AbortController().signal)

      if (error) throw error
      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message }
    }
  },
}
