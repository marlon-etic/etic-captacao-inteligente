import { supabase } from '@/lib/supabase/client'
import type { Campanha } from '@/services/campanhaService'

export interface CampanhaFechada extends Campanha {
  data_fechamento_real: string | null
}

export interface CampanhaImovelDetalhe {
  id: string
  campanha_id: string
  imovel_id: string
  captador_id: string | null
  data_adicionado: string
  imovel: {
    codigo_imovel: string | null
    endereco: string | null
    preco: number | null
  } | null
  captador: {
    nome: string | null
    email: string | null
  } | null
}

export async function fetchCampanhasFechadas(): Promise<CampanhaFechada[]> {
  const [campanhasRes, historicoRes] = await Promise.all([
    supabase
      .from('campanhas')
      .select('*')
      .eq('status', 'fechada')
      .order('created_at', { ascending: false }),
    supabase.from('campanhas_historico').select('campanha_id, data_fechamento'),
  ])

  if (campanhasRes.error) throw campanhasRes.error

  const historicoMap = new Map<string, string>()
  for (const h of historicoRes.data || []) {
    if (h.campanha_id && h.data_fechamento) {
      historicoMap.set(h.campanha_id, h.data_fechamento)
    }
  }

  return (campanhasRes.data || []).map((c: any) => ({
    ...c,
    data_fechamento_real: historicoMap.get(c.id) || c.data_fim,
  })) as CampanhaFechada[]
}

export async function fetchImoveisByCampanhas(
  campanhaIds: string[],
): Promise<CampanhaImovelDetalhe[]> {
  if (campanhaIds.length === 0) return []

  const { data, error } = await supabase
    .from('campanhas_imoveis')
    .select(
      `*,
      imovel:imoveis_captados(codigo_imovel, endereco, preco),
      captador:users(nome, email)`,
    )
    .in('campanha_id', campanhaIds)
    .order('data_adicionado', { ascending: false })

  if (error) throw error
  return (data || []) as unknown as CampanhaImovelDetalhe[]
}
