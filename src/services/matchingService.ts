import { supabase } from '@/lib/supabase/client'

export interface MatchSugestao {
  id: string
  imovel_id: string
  demanda_id: string
  demanda_tipo: 'Venda' | 'Locação'
  score: number
  status: 'pendente' | 'aceito' | 'rejeitado' | 'vinculado'
  created_at: string
}

export async function getPendingMatches(limit = 50): Promise<MatchSugestao[]> {
  try {
    const { data, error } = await supabase
      .from('matches_sugestoes')
      .select('*')
      .eq('status', 'pendente')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return (data as MatchSugestao[]) || []
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao buscar matches pendentes:', error)
    throw error
  }
}

export async function findNewMatches(onNewMatch?: (match: any) => void): Promise<MatchSugestao[]> {
  try {
    console.log('[MATCHING SERVICE] Verificando novos matches...')

    // Simulate finding new matches by fetching pending ones created recently
    const { data, error } = await supabase
      .from('matches_sugestoes')
      .select(`
        *,
        imovel:imoveis_captados(codigo_imovel, localizacao_texto, preco, valor)
      `)
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) throw error

    const matches = data || []

    for (const match of matches) {
      if (onNewMatch) {
        onNewMatch(match)
      }
    }

    return matches as MatchSugestao[]
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
