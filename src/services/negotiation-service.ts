import { supabase } from '@/lib/supabase/client'

export interface PropertySearchResult {
  id: string
  codigo_imovel: string | null
  endereco: string | null
  localizacao_texto: string | null
  preco: number | null
}

export async function searchProperties(query: string): Promise<PropertySearchResult[]> {
  if (!query || query.trim().length < 2) return []

  const { data, error } = await supabase
    .from('imoveis_captados')
    .select('id, codigo_imovel, endereco, localizacao_texto, preco')
    .or(
      `codigo_imovel.ilike.%${query}%,endereco.ilike.%${query}%,localizacao_texto.ilike.%${query}%`,
    )
    .limit(20)

  if (error) {
    console.error('Error searching properties:', error)
    return []
  }

  return (data || []) as PropertySearchResult[]
}

export async function ensureMatchExists(
  demandaId: string,
  imovelId: string,
  tipoDemanda: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from('imovel_demand_match')
    .select('id')
    .eq('demanda_id', demandaId)
    .eq('imovel_id', imovelId)
    .maybeSingle()

  if (existing?.id) return existing.id

  const { data: newMatch, error } = await supabase
    .from('imovel_demand_match')
    .insert({
      demanda_id: demandaId,
      imovel_id: imovelId,
      tipo_demanda: tipoDemanda,
      tipo_vinculacao: 'negociacao',
    })
    .select('id')
    .single()

  if (error) {
    console.error('Error creating match:', error)
    return null
  }

  return newMatch.id
}
