import { supabase } from '@/lib/supabase/client'

export interface CheckinDemanda {
  id: string
  nome_cliente: string
  tipo: 'Locação' | 'Venda'
  created_at: string
}

export const checkinService = {
  async getRecentDemands(userId: string): Promise<CheckinDemanda[]> {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const isoDate = thirtyDaysAgo.toISOString()

    const { data: locacao } = await supabase
      .from('demandas_locacao')
      .select('id, nome_cliente, cliente_nome, created_at')
      .eq('sdr_id', userId)
      .gte('created_at', isoDate)

    const { data: vendas } = await supabase
      .from('demandas_vendas')
      .select('id, nome_cliente, cliente_nome, created_at')
      .eq('corretor_id', userId)
      .gte('created_at', isoDate)

    const loc = (locacao || []).map((d) => ({
      id: d.id,
      nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
      tipo: 'Locação' as const,
      created_at: d.created_at || '',
    }))

    const ven = (vendas || []).map((d) => ({
      id: d.id,
      nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
      tipo: 'Venda' as const,
      created_at: d.created_at || '',
    }))

    return [...loc, ...ven].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
  },

  async hasDemandLast24h(userId: string): Promise<boolean> {
    const yesterday = new Date()
    yesterday.setHours(yesterday.getHours() - 24)
    const isoDate = yesterday.toISOString()

    const { count: locCount } = await supabase
      .from('demandas_locacao')
      .select('*', { count: 'exact', head: true })
      .eq('sdr_id', userId)
      .gte('created_at', isoDate)

    const { count: venCount } = await supabase
      .from('demandas_vendas')
      .select('*', { count: 'exact', head: true })
      .eq('corretor_id', userId)
      .gte('created_at', isoDate)

    return (locCount || 0) + (venCount || 0) > 0
  },

  async getProperties() {
    const { data } = await supabase
      .from('imoveis_captados')
      .select('id, codigo_imovel, endereco, valor, preco')
      .order('created_at', { ascending: false })
      .limit(100)
    return data || []
  },

  async registerVisita(data: {
    demanda_id: string
    tipo_demanda: 'Locação' | 'Venda'
    imovel_id?: string
    novo_imovel_endereco?: string
    novo_imovel_valor?: number
    qtd_imoveis_visitados: number
    user_sdr_id: string
  }) {
    const { data: res, error } = await supabase.from('visitas_imovel').insert([data]).select()
    if (error) throw error
    return res
  },

  async registerFechamento(data: {
    demanda_id: string
    tipo_demanda: 'Locação' | 'Venda'
    imovel_id?: string
    valor: number
    data_prevista: string
    user_sdr_id: string
  }) {
    const { data: res, error } = await supabase.from('fechamentos').insert([data]).select()
    if (error) throw error
    return res
  },

  async getTodayStats(userId: string) {
    const today = new Date().toISOString().split('T')[0]

    let { data: resumo } = await supabase
      .from('resumo_diario_sdr')
      .select('*')
      .eq('user_id', userId)
      .eq('data', today)
      .single()

    if (!resumo) {
      const { data: newResumo } = await supabase
        .from('resumo_diario_sdr')
        .insert([{ user_id: userId, data: today }])
        .select()
        .single()
      resumo = newResumo
    }

    return resumo
  },

  async getYesterdayStats(userId: string) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const { data: resumo } = await supabase
      .from('resumo_diario_sdr')
      .select('*')
      .eq('user_id', userId)
      .eq('data', yesterdayStr)
      .single()

    return resumo
  },

  async updateTodayStats(userId: string, updates: any) {
    const today = new Date().toISOString().split('T')[0]
    const { error } = await supabase
      .from('resumo_diario_sdr')
      .update(updates)
      .eq('user_id', userId)
      .eq('data', today)
    if (error) throw error
  },
}
