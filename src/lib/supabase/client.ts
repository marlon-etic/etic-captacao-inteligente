// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL as string) || ''
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || ''

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  console.error('❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas!')
}

async function fetchWithTimeoutAndRetry(
  url: RequestInfo | URL,
  options?: RequestInit,
  attempt: number = 1,
): Promise<Response> {
  const MAX_RETRIES = 2
  const TIMEOUT_MS = 15000
  const BACKOFF_MS = Math.pow(2, attempt - 1) * 1000

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const modifiedOptions = {
      ...options,
      signal: controller.signal,
    }

    console.log(`[Fetch] Tentativa ${attempt}: ${url.toString()}`)

    const response = await fetch(url, modifiedOptions)
    clearTimeout(timeoutId)

    if (!response.ok && attempt < MAX_RETRIES && response.status >= 500) {
      console.warn(`[Fetch] Status ${response.status}, retrying...`)
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS))
      return fetchWithTimeoutAndRetry(url, options, attempt + 1)
    }

    return response
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      console.warn(`[Fetch] Erro: ${error}, retrying em ${BACKOFF_MS}ms...`)
      await new Promise((resolve) => setTimeout(resolve, BACKOFF_MS))
      return fetchWithTimeoutAndRetry(url, options, attempt + 1)
    }
    throw error
  }
}

export const supabase = createClient<Database>(
  SUPABASE_URL.endsWith('/') ? SUPABASE_URL.slice(0, -1) : SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
    global: {
      fetch: fetchWithTimeoutAndRetry as any,
    },
  },
)

export function startHealthCheck(): void {
  setInterval(async () => {
    try {
      const { error } = await supabase.from('users').select('id').limit(1)
      if (error) {
        console.warn('❌ Health check falhou:', error.message)
      } else {
        console.log('✅ Health check OK')
      }
    } catch (err) {
      console.error('Health check error:', err)
    }
  }, 30000)
}
