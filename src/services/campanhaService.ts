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
  bairros_alvo?: string[] | null
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
      'id, tipo_imovel, faixa_valor_min, faixa_valor_max, status, meta, progresso, data_fim, data_inicio, bairros_alvo, created_at, updated_at',
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
  bairros_alvo?: string[] | null
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
      bairros_alvo: payload.bairros_alvo || null,
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
      'id, tipo_imovel, faixa_valor_min, faixa_valor_max, status, meta, progresso, data_fim, data_inicio, bairros_alvo, created_at, updated_at',
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

export async function updateCampanha(
  id: string,
  payload: {
    tipo_imovel?: string
    faixa_valor_min?: number
    faixa_valor_max?: number
    data_inicio?: string
    data_fim?: string
    meta?: number
    status?: string
    bairros_alvo?: string[] | null
  },
): Promise<Campanha> {
  const { data, error } = await supabase
    .from('campanhas')
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(
      'id, tipo_imovel, faixa_valor_min, faixa_valor_max, status, meta, progresso, data_fim, data_inicio, bairros_alvo, created_at, updated_at',
    )
    .single()
  if (error) throw error
  return data as Campanha
}

export async function deleteCampanha(id: string): Promise<void> {
  const { error } = await supabase.from('campanhas').delete().eq('id', id)
  if (error) throw error
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

export interface SuggestedImovel {
  id: string
  codigo_imovel: string | null
  endereco: string | null
  localizacao_texto: string | null
  preco: number | null
  valor: number | null
  tipo_imovel: string | null
  dormitorios: number | null
  vagas: number | null
  status_captacao: string | null
  user_captador_id: string | null
  created_at: string | null
}

function normalizeTipo(tipo: string): string {
  const t = tipo.toLowerCase().trim()
  if (t.includes('apart')) return 'apartamento'
  if (t.includes('casa') || t.includes('sobrado')) return 'casa'
  if (t.includes('galp')) return 'galpao'
  if (t.includes('comer') || t.includes('sala') || t.includes('predio')) return 'comercial'
  return t
}

export async function discardPropertyFromCampanha(
  campanhaId: string,
  imovelId: string,
): Promise<void> {
  const { error } = await supabase.from('campanhas_imoveis_descartados').insert({
    campanha_id: campanhaId,
    imovel_id: imovelId,
  })

  if (error) {
    if (error.code === '23505') return
    throw error
  }
}

export async function fetchSuggestedProperties(campanha: Campanha): Promise<SuggestedImovel[]> {
  const { data: linkedIds } = await supabase
    .from('campanhas_imoveis')
    .select('imovel_id')
    .eq('campanha_id', campanha.id)

  const linkedSet = new Set((linkedIds || []).map((r: any) => r.imovel_id))

  const { data: discardedIds } = await supabase
    .from('campanhas_imoveis_descartados')
    .select('imovel_id')
    .eq('campanha_id', campanha.id)

  const discardedSet = new Set((discardedIds || []).map((r: any) => r.imovel_id))
  const campanhaTipoNorm = normalizeTipo(campanha.tipo_imovel)
  const bairros = campanha.bairros_alvo

  const { data, error } = await supabase
    .from('imoveis_captados')
    .select(
      'id, codigo_imovel, endereco, localizacao_texto, preco, valor, tipo_imovel, dormitorios, vagas, status_captacao, user_captador_id, created_at',
    )
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  return (data || []).filter((imovel: any) => {
    if (linkedSet.has(imovel.id)) return false
    if (discardedSet.has(imovel.id)) return false

    const imovelTipoNorm = normalizeTipo(imovel.tipo_imovel || '')
    if (imovelTipoNorm !== campanhaTipoNorm) return false

    const price = imovel.valor || imovel.preco || 0
    if (price < campanha.faixa_valor_min || price > campanha.faixa_valor_max) return false

    if (bairros && bairros.length > 0) {
      const locationStr = `${imovel.endereco || ''} ${imovel.localizacao_texto || ''}`.toLowerCase()
      const bairroMatch = bairros.some((b: string) => locationStr.includes(b.toLowerCase()))
      if (!bairroMatch) return false
    }

    return true
  }) as SuggestedImovel[]
}

export async function linkPropertyToCampanha(
  campanhaId: string,
  imovelId: string,
  adminUserId: string,
  captadorId?: string | null,
): Promise<number> {
  const { error: insertError } = await supabase.from('campanhas_imoveis').insert({
    campanha_id: campanhaId,
    imovel_id: imovelId,
    captador_id: captadorId || null,
  })

  if (insertError) {
    if (insertError.code === '23505') {
      throw new Error('Este imóvel já está vinculado a esta campanha.')
    }
    throw insertError
  }

  const { count } = await supabase
    .from('campanhas_imoveis')
    .select('*', { count: 'exact', head: true })
    .eq('campanha_id', campanhaId)

  const newProgress = count || 0
  await supabase.from('campanhas').update({ progresso: newProgress }).eq('id', campanhaId)

  const { error: auditError } = await supabase.from('audit_log').insert({
    usuario_id: adminUserId,
    acao: 'LINK_IMOVEL_CAMPANHA',
    tabela: 'campanhas_imoveis',
    registro_id: imovelId,
    dados_novos: { campanha_id: campanhaId, imovel_id: imovelId },
  })
  if (auditError) console.warn('Audit log failed:', auditError.message)

  return newProgress
}

export async function unlinkPropertyFromCampanha(
  campanhaId: string,
  imovelId: string,
  adminUserId: string,
): Promise<number> {
  const { error: deleteError } = await supabase
    .from('campanhas_imoveis')
    .delete()
    .eq('campanha_id', campanhaId)
    .eq('imovel_id', imovelId)

  if (deleteError) throw deleteError

  const { count } = await supabase
    .from('campanhas_imoveis')
    .select('*', { count: 'exact', head: true })
    .eq('campanha_id', campanhaId)

  const newProgress = count || 0
  await supabase.from('campanhas').update({ progresso: newProgress }).eq('id', campanhaId)

  const { error: auditError } = await supabase.from('audit_log').insert({
    usuario_id: adminUserId,
    acao: 'UNLINK_IMOVEL_CAMPANHA',
    tabela: 'campanhas_imoveis',
    registro_id: imovelId,
    dados_antigos: { campanha_id: campanhaId, imovel_id: imovelId },
  })
  if (auditError) console.warn('Audit log failed:', auditError.message)

  return newProgress
}
