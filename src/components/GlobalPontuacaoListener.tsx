import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'

/**
 * Global component to mount the real-time points subscription hook.
 * This ensures the Captador receives point toasts even when not on the Pontuação dashboard.
 */
export function GlobalPontuacaoListener() {
  useSupabasePontuacao()
  return null
}
