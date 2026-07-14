import { supabase } from '@/lib/supabase/client'
import type { Database } from '@/lib/supabase/types'

type ImovelInsert = Database['public']['Tables']['imoveis_captados']['Insert']
type ImovelRow = Database['public']['Tables']['imoveis_captados']['Row']

export interface PropertyRegistrationData {
  endereco: string
  preco: number
  valor?: number
  tipo_imovel?: string
  tipo?: string
  dormitorios?: number
  banheiros?: number
  vagas?: number
  localizacao_texto?: string
  codigo_imovel?: string
  fotos?: string[]
  comissao_percentual?: number
  status_captacao?: string
  etapa_funil?: string
  observacoes?: string
  demanda_locacao_id?: string
  demanda_venda_id?: string
  landlord_id?: string
  is_test_data?: boolean
}

export async function registerProperty(
  data: PropertyRegistrationData,
): Promise<{ data: ImovelRow | null; error: string | null }> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Usuário não autenticado. Faça login novamente.' }
  }

  const insertPayload: ImovelInsert = {
    user_captador_id: user.id,
    captador_id: user.id,
    endereco: data.endereco,
    preco: data.preco,
    valor: data.valor ?? data.preco,
    tipo_imovel: data.tipo_imovel ?? 'Apartamento',
    tipo: data.tipo ?? 'Ambos',
    dormitorios: data.dormitorios ?? null,
    banheiros: data.banheiros ?? null,
    vagas: data.vagas ?? null,
    localizacao_texto: data.localizacao_texto ?? null,
    codigo_imovel: data.codigo_imovel ?? null,
    fotos: data.fotos ?? [],
    comissao_percentual: data.comissao_percentual ?? null,
    status_captacao: data.status_captacao ?? 'capturado',
    etapa_funil: data.etapa_funil ?? 'capturado',
    observacoes: data.observacoes ?? null,
    demanda_locacao_id: data.demanda_locacao_id ?? null,
    demanda_venda_id: data.demanda_venda_id ?? null,
    landlord_id: data.landlord_id ?? null,
    is_test_data: data.is_test_data ?? false,
  }

  const { data: inserted, error: insertError } = await supabase
    .from('imoveis_captados')
    .insert(insertPayload)
    .select()
    .single()

  if (insertError) {
    const message = insertError.message || 'Erro desconhecido ao cadastrar imóvel'
    if (message.includes('row-level security') || message.includes('RLS')) {
      return {
        data: null,
        error:
          'Permissão negada: você não tem autorização para cadastrar imóveis. Contate o administrador.',
      }
    }
    return { data: null, error: message }
  }

  return { data: inserted, error: null }
}

export async function fetchMyProperties(): Promise<{
  data: ImovelRow[] | null
  error: string | null
}> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { data: null, error: 'Usuário não autenticado.' }
  }

  const { data, error } = await supabase
    .from('imoveis_captados')
    .select('*')
    .eq('user_captador_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: error.message }
  }

  return { data, error: null }
}
