import { supabase } from '@/lib/supabase/client'
import { calculateMatching, ImovelForMatching, ClienteForMatching } from '@/lib/matching'

export interface MatchSugestao {
  id?: string
  imovel_id: string
  demanda_id: string
  demanda_tipo: 'Venda' | 'Locação' | 'Aluguel'
  score: number
  status: 'pendente' | 'aceito' | 'rejeitado' | 'vinculado'
  created_at?: string
}

export async function findNewMatches(): Promise<MatchSugestao[]> {
  try {
    console.log('[MATCHING SERVICE] Iniciando busca automática de matches...')

    const { data: imoveis, error: imovelError } = await supabase
      .from('imoveis_captados')
      .select('*')
      .is('demanda_venda_id', null)
      .is('demanda_locacao_id', null)

    if (imovelError) throw imovelError

    const { data: demandasVenda, error: vendaError } = await supabase
      .from('demandas_vendas')
      .select('*')
      .eq('status_demanda', 'aberta')

    if (vendaError) throw vendaError

    const { data: demandasLocacao, error: locacaoError } = await supabase
      .from('demandas_locacao')
      .select('*')
      .eq('status_demanda', 'aberta')

    if (locacaoError) throw locacaoError

    const matches: MatchSugestao[] = []

    for (const imovel of imoveis || []) {
      for (const demanda of demandasVenda || []) {
        const matchResult = calculateMatching(imovel as any, demanda as any)

        if (matchResult.score > 0) {
          matches.push({
            imovel_id: imovel.id,
            demanda_id: demanda.id,
            demanda_tipo: 'Venda',
            score: matchResult.score,
            status: 'pendente',
          })
        }
      }
    }

    for (const imovel of imoveis || []) {
      for (const demanda of demandasLocacao || []) {
        const matchResult = calculateMatching(imovel as any, demanda as any)

        if (matchResult.score > 0) {
          matches.push({
            imovel_id: imovel.id,
            demanda_id: demanda.id,
            demanda_tipo: 'Locação',
            score: matchResult.score,
            status: 'pendente',
          })
        }
      }
    }

    matches.sort((a, b) => b.score - a.score)

    console.log('[MATCHING SERVICE] Matches encontrados:', matches.length)

    if (matches.length > 0) {
      const topMatches = matches.slice(0, 1000)

      const { error: insertError } = await supabase.from('matches_sugestoes' as any).upsert(
        topMatches.map((m) => ({
          imovel_id: m.imovel_id,
          demanda_id: m.demanda_id,
          demanda_tipo: m.demanda_tipo,
          score: m.score,
          status: 'pendente',
        })),
        { onConflict: 'imovel_id,demanda_id,demanda_tipo' },
      )

      if (insertError) throw insertError
    }

    return matches
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao buscar matches:', error)
    return []
  }
}

export async function getPendingMatches(limit = 50): Promise<MatchSugestao[]> {
  try {
    const { data, error } = await supabase
      .from('matches_sugestoes' as any)
      .select('*')
      .eq('status', 'pendente')
      .order('score', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao buscar matches pendentes:', error)
    return []
  }
}

export async function updateMatchStatus(
  matchId: string,
  status: 'aceito' | 'rejeitado' | 'vinculado',
): Promise<void> {
  try {
    const { error } = await supabase
      .from('matches_sugestoes' as any)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', matchId)

    if (error) throw error
    console.log('[MATCHING SERVICE] Match atualizado:', { matchId, status })
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao atualizar match:', error)
    throw error
  }
}
