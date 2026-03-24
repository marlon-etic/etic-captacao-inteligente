import { supabase } from '@/lib/supabase/client'

export interface VistaSoftPropertyDetails {
  codigo: string
  endereco: string
  bairro: string
  cidade: string
  estado: string
  cep: string
  valor_aluguel: number
  valor_venda?: number
  quartos: number
  banheiros: number
  vagas_garagem: number
  tipo_imovel: string
  descricao?: string
}

export const fetchPropertyDetailsFromVistaSoft = async (
  propertyCode: string,
): Promise<Partial<VistaSoftPropertyDetails>> => {
  try {
    const cachedData = await getCachedPropertyDetails(propertyCode)
    if (cachedData) {
      return cachedData
    }

    // Mock response for VistaSoft integration
    const data = {
      codigo: propertyCode,
      endereco: 'Endereço Sincronizado VistaSoft',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP',
      cep: '01000-000',
      valor_aluguel: 3500,
      quartos: 2,
      banheiros: 1,
      vagas_garagem: 1,
      tipo_imovel: 'Apartamento',
      descricao: 'Descrição sincronizada via API.',
    }

    await cachePropertyDetails(propertyCode, data)
    return parseVistaSoftData(data)
  } catch (error) {
    console.error('Erro ao buscar dados da VistaSoft:', error)
    await supabase.rpc('fn_logar_falhas_api', {
      p_api: 'VistaSoft',
      p_endpoint: `/detalhes?imovel=${propertyCode}`,
      p_message: error instanceof Error ? error.message : 'Erro',
      p_payload: { propertyCode },
    })
    return {}
  }
}

const getCachedPropertyDetails = async (
  propertyCode: string,
): Promise<Partial<VistaSoftPropertyDetails> | null> => {
  try {
    const { data, error } = await supabase
      .from('vistasoft_cache')
      .select('data, expires_at')
      .eq('key', propertyCode)
      .single()

    if (error) return null
    if (!data) return null

    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      await supabase.from('vistasoft_cache').delete().eq('key', propertyCode)
      return null
    }

    return data.data as Partial<VistaSoftPropertyDetails>
  } catch (error) {
    return null
  }
}

const cachePropertyDetails = async (propertyCode: string, data: any) => {
  try {
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24)

    await supabase.from('vistasoft_cache').upsert(
      {
        key: propertyCode,
        data: parseVistaSoftData(data),
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'key' },
    )
  } catch (error) {
    console.error('Erro ao cachear dados:', error)
  }
}

const parseVistaSoftData = (data: any): Partial<VistaSoftPropertyDetails> => {
  return {
    codigo: data.codigo,
    endereco: data.endereco,
    bairro: data.bairro,
    cidade: data.cidade,
    estado: data.estado,
    cep: data.cep,
    valor_aluguel: parseFloat(data.valor_aluguel) || 0,
    quartos: parseInt(data.quartos) || 0,
    banheiros: parseInt(data.banheiros) || 0,
    vagas_garagem: parseInt(data.vagas_garagem) || 0,
    tipo_imovel: data.tipo_imovel,
    descricao: data.descricao,
  }
}
