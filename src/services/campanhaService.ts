import { supabase } from '@/lib/supabase/client'

export interface Campanha {
  id: string
  tipo_imovel: string
  faixa_valor_min: number
  faixa_valor_max: number
  status: 'ativa' | 'pausada' | 'fechada'
  data_inicio: string
  data_fim: string
  meta: number
  progresso: number
  bairro_alvo?: string | null
  created_at: string
  updated_at: string
}

export interface CampanhaImovel {
  id: string
  campanha_id: string
  imovel_id: string
  captador_id: string | null
  data_adicionado: string
  imovel?: {
    codigo_imovel: string | null
    endereco: string | null
    preco: number | null
    valor: number | null
    localizacao_texto: string | null
    status_captacao: string | null
  } | null
  captador?: {
    nome: string | null
    email: string | null
  } | null
}

export interface CampanhaHistorico {
  id: string
  campanha_id: string
  tipo_imovel: string
  faixa_valor: { min: number; max: number }
  total_imoveis: number
  total_captadores: number
  data_fechamento: string
}

export async function fetchCampanhas(): Promise<Campanha[]> {
  const { data, error } = await supabase
    .from('campanhas')
    .select(
      'id, tipo_imovel, faixa_valor_min, faixa_valor_max, status, meta, progresso, data_fim, data_inicio, bairro_alvo, created_at, updated_at',
    )
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []) as Campanha[]
}

export async function createCampanha(payload: {
  tipo_imovel: string
  faixa_valor_min: number
  faixa_valor_max: number
  data_fim: string
  meta?: number
  activate_now?: boolean
}): Promise<Campanha> {
  const { data, error } = await supabase
    .from('campanhas')
    .insert({
      tipo_imovel: payload.tipo_imovel,
      faixa_valor_min: payload.faixa_valor_min,
      faixa_valor_max: payload.faixa_valor_max,
      data_fim: payload.data_fim,
      meta: payload.meta || 5,
      status: payload.activate_now ? 'ativa' : 'pausada',
    })
    .select()
    .single()
  if (error) throw error
  return data as Campanha
}

export async function updateCampanhaStatus(
  id: string,
  status: 'ativa' | 'pausada' | 'fechada',
): Promise<void> {
  const { error } = await supabase.from('campanhas').update({ status }).eq('id', id)
  if (error) throw error
}

export async function closeCampanha(id: string): Promise<void> {
  const { data: campanha, error: err1 } = await supabase
    .from('campanhas')
    .select(
      'id, tipo_imovel, faixa_valor_min, faixa_valor_max, status, meta, progresso, data_fim, data_inicio, bairro_alvo, created_at, updated_at',
    )
    .eq('id', id)
    .single()
  if (err1) throw err1

  const { count: captadorCount } = await supabase
    .from('campanhas_imoveis')
    .select('captador_id', { count: 'exact', head: true })
    .eq('campanha_id', id)

  const { error: err2 } = await supabase.from('campanhas_historico').insert({
    campanha_id: id,
    tipo_imovel: campanha.tipo_imovel,
    faixa_valor: { min: campanha.faixa_valor_min, max: campanha.faixa_valor_max },
    total_imoveis: campanha.progresso,
    total_captadores: captadorCount || 0,
  })
  if (err2) throw err2

  const { error: err3 } = await supabase
    .from('campanhas')
    .update({ status: 'fechada' })
    .eq('id', id)
  if (err3) throw err3
}

export async function fetchCampanhaImoveis(campanhaId: string): Promise<CampanhaImovel[]> {
  const { data, error } = await supabase
    .from('campanhas_imoveis')
    .select(
      `id, campanha_id, imovel_id, captador_id, data_adicionado,
      imovel:imoveis_captados(codigo_imovel, endereco, preco, valor, localizacao_texto, status_captacao),
      captador:users(nome, email)
      `,
    )
    .eq('campanha_id', campanhaId)
    .order('data_adicionado', { ascending: false })
  if (error) throw error
  return (data || []) as unknown as CampanhaImovel[]
}

export async function checkDuplicateCampanha(
  tipo_imovel: string,
  min: number,
  max: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from('campanhas')
    .select('id')
    .eq('tipo_imovel', tipo_imovel)
    .eq('faixa_valor_min', min)
    .eq('faixa_valor_max', max)
    .eq('status', 'ativa')
  if (error) throw error
  return (data || []).length > 0
}

export async function fetchCampanhasHistorico(): Promise<CampanhaHistorico[]> {
  const { data, error } = await supabase
    .from('campanhas_historico')
    .select(
      'id, campanha_id, tipo_imovel, faixa_valor, total_imoveis, total_captadores, data_fechamento',
    )
    .order('data_fechamento', { ascending: false })
  if (error) throw error
  return (data || []) as CampanhaHistorico[]
}
