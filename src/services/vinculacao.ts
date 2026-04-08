import { supabase } from '@/lib/supabase/client'

export interface LinkParams {
  imovelId: string
  demandaId: string
  usuarioId: string
  isLocacao: boolean
}

export interface LinkResponse {
  success: boolean
  data?: {
    demandaId: string
    imovelId: string
    codigo_imovel?: string
  }
  error?: string
  errorType?: 'permission' | 'not_found' | 'validation' | 'network' | 'server' | 'unknown'
}

export const vinculacaoService = {
  async linkImovelToDemanda({
    imovelId,
    demandaId,
    usuarioId,
    isLocacao,
  }: LinkParams): Promise<LinkResponse> {
    try {
      if (!imovelId || !demandaId || !usuarioId) {
        return {
          success: false,
          error: 'Dados insuficientes para vinculação',
          errorType: 'validation',
        }
      }

      // 1. Fetch user role to check permissions
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', usuarioId)
        .single()

      if (profileError) {
        return {
          success: false,
          error: 'Erro de conexão ou ao buscar perfil do usuário',
          errorType: 'network',
        }
      }

      const isAdmin = userProfile.role === 'admin' || userProfile.role === 'gestor'

      // 2. Fetch the property to be linked
      const { data: existingImovel, error: fetchError } = await supabase
        .from('imoveis_captados')
        .select('*')
        .eq('id', imovelId)
        .single()

      if (fetchError || !existingImovel) {
        return { success: false, error: 'Imóvel não encontrado', errorType: 'not_found' }
      }

      // 3. Validate permissions: only admin or the property's captor can link it
      const isCaptador =
        existingImovel.user_captador_id === usuarioId || existingImovel.captador_id === usuarioId

      if (!isAdmin && !isCaptador) {
        return {
          success: false,
          error: 'Você não tem permissão para vincular este imóvel',
          errorType: 'permission',
        }
      }

      // 4. Duplicate the property to link it to the new demand
      const { id: _, created_at, updated_at, codigo_imovel, ...imovelData } = existingImovel

      const novoCodigo = codigo_imovel
        ? `${codigo_imovel}-V${Math.floor(Math.random() * 1000)}`
        : null

      const newImovel = {
        ...imovelData,
        codigo_imovel: novoCodigo,
        demanda_locacao_id: isLocacao ? demandaId : null,
        demanda_venda_id: !isLocacao ? demandaId : null,
        status_captacao: 'capturado', // Reset status for the new funnel
        etapa_funil: 'capturado',
      }

      const { data: insertedImovel, error: insertError } = await supabase
        .from('imoveis_captados')
        .insert(newImovel)
        .select()
        .single()

      if (insertError) {
        if (insertError.code === '23505') {
          return {
            success: false,
            error: 'Este imóvel já possui um vínculo similar.',
            errorType: 'validation',
          }
        }
        return { success: false, error: 'Erro ao criar vínculo do imóvel', errorType: 'server' }
      }

      // 5. Update demand status to 'atendida' if it's currently open
      const table = isLocacao ? 'demandas_locacao' : 'demandas_vendas'

      const { data: demandData } = await supabase
        .from(table)
        .select('status_demanda')
        .eq('id', demandaId)
        .single()

      if (
        demandData &&
        demandData.status_demanda !== 'atendida' &&
        demandData.status_demanda !== 'ganho'
      ) {
        const { error: updateError } = await supabase
          .from(table)
          .update({ status_demanda: 'atendida' })
          .eq('id', demandaId)

        if (updateError && updateError.code !== '42501') {
          console.error('Falha ao atualizar o status da demanda:', updateError)
        }
      }

      return {
        success: true,
        data: {
          demandaId,
          imovelId: insertedImovel.id,
          codigo_imovel: insertedImovel.codigo_imovel || undefined,
        },
      }
    } catch (err: any) {
      console.error('Erro no serviço de vinculação:', err)
      return {
        success: false,
        error: err.message || 'Erro interno ao vincular',
        errorType: 'server',
      }
    }
  },
}
