import { supabase } from '@/lib/supabase/client'

const VISTASOFT_API_KEY =
  import.meta.env.VITE_VISTASOFT_API_KEY || 'fcae7a41cd058cf0397ccc99e91c2081'
const VISTASOFT_API_BASE = 'https://api.vistasoft.com.br'
const REQUEST_TIMEOUT = 10000

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

const memoryCache = new Map<string, { data: any; expiresAt: number }>()

export const fetchPropertyDetailsFromVistaSoft = async (
  propertyCode: string,
): Promise<Partial<VistaSoftPropertyDetails>> => {
  try {
    const cached = memoryCache.get(propertyCode)
    if (cached && cached.expiresAt > Date.now()) {
      console.log(`Cache em memória hit para ${propertyCode}`)
      return cached.data
    }

    const cachedData = await getCachedPropertyDetails(propertyCode)
    if (cachedData) {
      memoryCache.set(propertyCode, {
        data: cachedData,
        expiresAt: Date.now() + 3600000,
      })
      return cachedData
    }

    console.log(`Buscando ${propertyCode} na VistaSoft...`)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

    const response = await fetch(
      `${VISTASOFT_API_BASE}/detalhes?key=${VISTASOFT_API_KEY}&imovel=${propertyCode}`,
      { signal: controller.signal },
    )

    clearTimeout(timeoutId)

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error('VistaSoft API rate limited - aguardando')
      }
      throw new Error(`VistaSoft API error: ${response.statusText}`)
    }

    const data = await response.json()
    const parsedData = parseVistaSoftData(data)

    await cachePropertyDetails(propertyCode, parsedData)

    memoryCache.set(propertyCode, {
      data: parsedData,
      expiresAt: Date.now() + 3600000,
    })

    return parsedData
  } catch (error) {
    console.error(`Erro ao buscar ${propertyCode}:`, error)

    try {
      await supabase.rpc('fn_logar_falhas_api', {
        p_api: 'VistaSoft',
        p_endpoint: `/detalhes?imovel=${propertyCode}`,
        p_message: error instanceof Error ? error.message : 'Erro desconhecido',
        p_payload: { propertyCode },
      })
    } catch (logError) {
      console.error('Erro ao logar falha:', logError)
    }

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

    if (error && error.code !== 'PGRST116') throw error
    if (!data) return null

    const expiresAt = new Date(data.expires_at)
    if (expiresAt < new Date()) {
      supabase
        .from('vistasoft_cache')
        .delete()
        .eq('key', propertyCode)
        .catch(() => {})
      return null
    }

    return data.data as Partial<VistaSoftPropertyDetails>
  } catch (error) {
    console.error('Erro ao buscar cache:', error)
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
        data,
        expires_at: expiresAt.toISOString(),
      },
      { onConflict: 'key' },
    )
  } catch (error) {
    console.error('Erro ao cachear:', error)
  }
}

const parseVistaSoftData = (data: any): Partial<VistaSoftPropertyDetails> => {
  return {
    codigo: data.codigo || '',
    endereco: data.endereco || '',
    bairro: data.bairro || '',
    cidade: data.cidade || '',
    estado: data.estado || '',
    cep: data.cep || '',
    valor_aluguel: parseFloat(data.valor_aluguel) || 0,
    quartos: parseInt(data.quartos) || 0,
    banheiros: parseInt(data.banheiros) || 0,
    vagas_garagem: parseInt(data.vagas_garagem) || 0,
    tipo_imovel: data.tipo_imovel || '',
    descricao: data.descricao || '',
  }
}
