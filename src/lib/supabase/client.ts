// AVOID UPDATING THIS FILE DIRECTLY. It is automatically generated.
import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string

// Import the supabase client like this:
// import { supabase } from "@/lib/supabase/client";

const customFetch = async (url: RequestInfo | URL, options?: RequestInit) => {
  try {
    return await fetch(url, options)
  } catch (error: any) {
    const urlStr = url.toString()
    console.warn(`[Supabase Fetch] Intercepted network error on: ${urlStr}`, error)

    const isGet = options?.method === 'GET' || !options?.method

    // For GET requests (like fetching users, which adblockers often block),
    // return a successful empty response to prevent the app from crashing.
    if (isGet) {
      const headers = (options?.headers as Record<string, string>) || {}
      const isSingle = headers['Accept']?.includes('vnd.pgrst.object')
      const mockBody = isSingle ? JSON.stringify({}) : JSON.stringify([])

      return new Response(mockBody, {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // For mutations, return 503 so Supabase parses it as a clean error
    return new Response(
      JSON.stringify({
        message: 'Falha de conexão ou requisição bloqueada.',
        details: error.message,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      },
    )
  }
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
  global: {
    fetch: customFetch,
  },
})
