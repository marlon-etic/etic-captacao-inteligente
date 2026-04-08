import { supabase } from '@/lib/supabase/client'

export interface LinkParams {
  imovelId: string
  demandaId: string
  usuarioId: string
  isLocacao: boolean
  signal?: AbortSignal
}

export interface LinkResponse {
  success: boolean
  data?: {
    demandaId: string
    imovelId: string
    codigo_imovel?: string
  }
  error?: string
  errorType?:
    | 'permission'
    | 'not_found'
    | 'validation'
    | 'network'
    | 'server'
    | 'unknown'
    | 'timeout'
}

export const vinculacaoService = {
  async linkImovelToDemanda({
    imovelId,
    demandaId,
    usuarioId,
    isLocacao,
    signal,
  }: LinkParams): Promise<LinkResponse> {
    console.log(
      `🔵 [VINCULAR] Iniciando vinculação com imovel_id=${imovelId}, demanda_id=${demandaId}, usuario_id=${usuarioId}`,
    )

    try {
      if (!imovelId || !demandaId || !usuarioId) {
        console.log(`🔴 [VINCULAR] Erro: Dados insuficientes para vinculação`)
        return {
          success: false,
          error: 'Dados insuficientes para vinculação',
          errorType: 'validation',
        }
      }

      // 1. Fetch user role to check permissions
      let profileQuery = supabase.from('users').select('role').eq('id', usuarioId)
      if (signal) profileQuery = profileQuery.abortSignal(signal as any)

      const { data: userProfile, error: profileError } = await profileQuery.single()

      if (profileError) {
        console.log(`🔴 [VINCULAR] Erro ao buscar perfil do usuário:`, profileError)
        return { success: false, error: 'Erro ao buscar perfil do usuário', errorType: 'network' }
      }

      const isAdmin = userProfile.role === 'admin' || userProfile.role === 'gestor'

      // 2. Fetch the property to be linked
      let fetchImovelQuery = supabase.from('imoveis_captados').select('*').eq('id', imovelId)
      if (signal) fetchImovelQuery = fetchImovelQuery.abortSignal(signal as any)

      const { data: existingImovel, error: fetchError } = await fetchImovelQuery.single()

      if (fetchError || !existingImovel) {
        console.log(`🔴 [VINCULAR] Erro: Imóvel não encontrado`)
        return { success: false, error: 'Imóvel não encontrado', errorType: 'not_found' }
      }

      // 3. Validate permissions: only admin or the property's captor can link it
      const isCaptador =
        existingImovel.user_captador_id === usuarioId || existingImovel.captador_id === usuarioId
      const temPermissao = isAdmin || isCaptador

      console.log(
        `🔵 [VINCULAR] Validando permissão... Usuário tem permissão? ${temPermissao ? 'SIM' : 'NÃO'}`,
      )

      if (!temPermissao) {
        console.log(`🔴 [VINCULAR] Você não tem permissão para vincular este imóvel.`)
        return {
          success: false,
          error: 'Você não tem permissão para vincular este imóvel',
          errorType: 'permission',
        }
      }

      console.log(`🔵 [VINCULAR] Enviando UPDATE para Supabase... Aguardando resposta`)

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

      let insertQuery = supabase.from('imoveis_captados').insert(newImovel).select()
      if (signal) insertQuery = insertQuery.abortSignal(signal as any)

      const { data: insertedImovel, error: insertError } = await insertQuery.single()

      if (insertError) {
        console.log(`🔴 [VINCULAR] Erro no INSERT do imóvel vinculado:`, insertError)
        if (insertError.message?.includes('row-level security')) {
          console.log(`🔴 [VINCULAR] Erro: new row violates row-level security policy`)
        }
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

      let demandQuery = supabase.from(table).select('status_demanda').eq('id', demandaId)
      if (signal) demandQuery = demandQuery.abortSignal(signal as any)

      const { data: demandData } = await demandQuery.single()

      if (
        demandData &&
        demandData.status_demanda !== 'atendida' &&
        demandData.status_demanda !== 'ganho'
      ) {
        let updateQuery = supabase
          .from(table)
          .update({ status_demanda: 'atendida' })
          .eq('id', demandaId)
        if (signal) updateQuery = updateQuery.abortSignal(signal as any)

        const { error: updateError } = await updateQuery
        if (updateError && updateError.code !== '42501') {
          console.error(`🔴 [VINCULAR] Falha ao atualizar o status da demanda:`, updateError)
        }
      }

      console.log(`🟢 [VINCULAR] Sucesso! Demanda vinculada`)
      return {
        success: true,
        data: {
          demandaId,
          imovelId: insertedImovel.id,
          codigo_imovel: insertedImovel.codigo_imovel || undefined,
        },
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log(`🔴 [VINCULAR] Timeout! Requisição demorou mais de 30s. Tente novamente`)
        return { success: false, error: 'Timeout na requisição', errorType: 'timeout' }
      }
      console.error(`🔴 [VINCULAR] Erro desconhecido:`, err)
      return {
        success: false,
        error: err.message || 'Erro interno ao vincular',
        errorType: 'server',
      }
    }
  },
}
