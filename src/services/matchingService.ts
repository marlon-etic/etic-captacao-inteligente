import { supabase } from '@/lib/supabase/client'
import { getTiposVisiveis } from '@/lib/roleFilters'

export interface MatchSugestao {
  id: string
  imovel_id: string
  demanda_id: string
  demanda_tipo: 'Venda' | 'Locação'
  score: number
  status: 'pendente' | 'aceito' | 'rejeitado' | 'vinculado'
  created_at: string
}

export async function getPendingMatches(limit = 50, role?: string): Promise<MatchSugestao[]> {
  try {
    const tipos = getTiposVisiveis(role)

    const { data, error } = await supabase
      .from('matches_sugestoes')
      .select(`
        *,
        imoveis_captados!inner(id, tipo)
      `)
      .eq('status', 'pendente')
      .in('imoveis_captados.tipo', tipos)
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as any) || []
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao buscar matches pendentes:', error)
    throw error
  }
}

export async function findNewMatches(
  onNewMatch?: (match: any) => void,
  role?: string,
): Promise<MatchSugestao[]> {
  try {
    console.log('[MATCHING SERVICE] Verificando novos matches...')
    const tipos = getTiposVisiveis(role)

    const { data, error } = await supabase
      .from('matches_sugestoes')
      .select(`
        *,
        imoveis_captados!inner(id, codigo_imovel, localizacao_texto, preco, valor, tipo)
      `)
      .eq('status', 'pendente')
      .in('imoveis_captados.tipo', tipos)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const matches = (data || []).map((d: any) => ({
      ...d,
      imovel: d.imoveis_captados,
    }))

    for (const match of matches) {
      if (onNewMatch) {
        onNewMatch(match)
      }
    }

    return matches as any
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao verificar novos matches:', error)
    return []
  }
}

export async function updateMatchStatus(
  matchId: string,
  status: 'aceito' | 'rejeitado' | 'vinculado',
): Promise<void> {
  try {
    const { error } = await supabase
      .from('matches_sugestoes')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', matchId)

    if (error) throw error
    console.log('[MATCHING SERVICE] Match atualizado:', { matchId, status })
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao atualizar match:', error)
    throw error
  }
}
