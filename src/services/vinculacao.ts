import { supabase } from '@/lib/supabase/client'

export interface LinkParams {
  imovelId: string
  demandaId: string
  usuarioId: string
  isLocacao: boolean
}

export interface LinkResponse {
  success: boolean
  data?: any
  error?: string
  errorType?: 'validation' | 'permission' | 'server'
}

export const vinculacaoService = {
  async linkImovelToDemanda(
    { imovelId, demandaId, usuarioId, isLocacao }: LinkParams,
    signal?: AbortSignal,
  ): Promise<LinkResponse> {
    try {
      if (!imovelId || !demandaId || !usuarioId) {
        return {
          success: false,
          error: 'Dados insuficientes para vinculação',
          errorType: 'validation',
        }
      }

      const updateData = {
        demanda_locacao_id: isLocacao ? demandaId : null,
        demanda_venda_id: !isLocacao ? demandaId : null,
        user_captador_id: usuarioId,
        captador_id: usuarioId,
        status_captacao: 'capturado',
        etapa_funil: 'capturado',
      }

      let query = supabase
        .from('imoveis_captados')
        .update(updateData)
        .eq('id', imovelId)
        .select()
        .single()

      if (signal) {
        query = query.abortSignal(signal) as any
      }

      const { data, error } = await query

      if (error) {
        console.error('Error updating property linkage:', error)
        if (error.code === '23505') {
          return {
            success: false,
            error: 'Este imóvel já possui um vínculo ativo similar.',
            errorType: 'validation',
          }
        }
        return {
          success: false,
          error: 'Você não tem permissão para vincular ou o imóvel não foi encontrado.',
          errorType: 'permission',
        }
      }

      return {
        success: true,
        data,
      }
    } catch (err: any) {
      console.error('Catch error linking property:', err)
      return {
        success: false,
        error: err.message || 'Erro interno ao vincular',
        errorType: 'server',
      }
    }
  },
}
