import { supabase } from '@/lib/supabase/client'
import { getTiposVisiveis } from '@/lib/roleFilters'

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  retries = 2,
  delay = 1000,
): Promise<T> {
  let lastError: any
  for (let i = 0; i < retries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      const isNetworkError =
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('NetworkError') ||
        error?.toString().includes('fetch')

      if (!isNetworkError) {
        throw error
      }

      console.warn(
        `[MATCHING SERVICE] Erro de rede detectado. Tentativa ${i + 1} de ${retries}...`,
        error?.message,
      )
      if (i < retries - 1) {
        await new Promise((res) => setTimeout(res, delay * (i + 1)))
      }
    }
  }
  throw lastError
}

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

    const { data, error } = await executeWithRetry(() =>
      supabase
        .from('matches_sugestoes')
        .select(`
        *,
        imoveis_captados!inner(id, tipo)
      `)
        .eq('status', 'pendente')
        .in('imoveis_captados.tipo', tipos)
        .order('score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit),
    )

    if (error) throw error
    return (data as any) || []
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao buscar matches pendentes:', error)
    return [] // Return empty to prevent infinite loading state or runtime crashes
  }
}

export async function findNewMatches(
  onNewMatch?: (match: any) => void,
  role?: string,
): Promise<MatchSugestao[]> {
  try {
    console.log('[MATCHING SERVICE] Verificando novos matches...')
    const tipos = getTiposVisiveis(role)

    const { data, error } = await executeWithRetry(() =>
      supabase
        .from('matches_sugestoes')
        .select(`
        *,
        imoveis_captados!inner(id, codigo_imovel, localizacao_texto, preco, valor, tipo)
      `)
        .eq('status', 'pendente')
        .in('imoveis_captados.tipo', tipos)
        .order('created_at', { ascending: false })
        .limit(10),
    )

    if (error) {
      console.warn('[MATCHING SERVICE] Falha ao consultar novos matches:', error)
      return []
    }

    const matches = (data || []).map((d: any) => ({
      ...d,
      imovel: d.imoveis_captados,
    }))

    for (const match of matches) {
      if (onNewMatch) {
        try {
          onNewMatch(match)
        } catch (cbErr) {
          console.error('[MATCHING SERVICE] Erro no callback onNewMatch:', cbErr)
        }
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
    const { error } = await executeWithRetry(() =>
      supabase
        .from('matches_sugestoes')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', matchId),
    )

    if (error) throw error
    console.log('[MATCHING SERVICE] Match atualizado:', { matchId, status })
  } catch (error) {
    console.error('[MATCHING SERVICE] Erro ao atualizar match:', error)
    throw error
  }
}
