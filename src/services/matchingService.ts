import { supabase } from '@/lib/supabase/client'

let cachedMatches: any[] | null = null
let lastRole: string | null = null
let lastFetchTime: number = 0
const CACHE_TTL = 30000 // 30 seconds

export async function getPendingMatches(limit: number = 50, role?: string | null) {
  // Intelligent Local Caching
  if (cachedMatches && role === lastRole && Date.now() - lastFetchTime < CACHE_TTL) {
    return cachedMatches
  }

  const { data, error } = await supabase
    .from('matches_sugestoes')
    .select('id, imovel_id, demanda_id, demanda_tipo, score, status')
    .eq('status', 'pendente')
    .gt('score', 50)
    .order('score', { ascending: false })
    .limit(limit)

  if (error) {
    if (
      error.code === '504' ||
      error.message?.toLowerCase().includes('timeout') ||
      error.message?.toLowerCase().includes('upstream')
    ) {
      throw new Error('TIMEOUT')
    }
    throw error
  }

  cachedMatches = data || []
  lastRole = role || null
  lastFetchTime = Date.now()

  return data || []
}

export async function updateMatchStatus(matchId: string, status: string) {
  const { error } = await supabase.from('matches_sugestoes').update({ status }).eq('id', matchId)

  if (error) throw error

  if (cachedMatches) {
    cachedMatches = cachedMatches.filter((m) => m.id !== matchId)
  }
  return true
}

export async function findNewMatches(onMatchFound: (match: any) => void, role?: string | null) {
  try {
    const { data, error } = await supabase
      .from('matches_sugestoes')
      .select('id, score, imovel_id, imoveis_captados!inner(id, codigo_imovel)')
      .eq('status', 'pendente')
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) return

    if (data && data.length > 0) {
      const match = data[0]
      onMatchFound({
        id: match.id,
        score: match.score,
        imovel: match.imoveis_captados,
      })
    }
  } catch (err) {
    // Ignore silent errors for background polling
  }
}
