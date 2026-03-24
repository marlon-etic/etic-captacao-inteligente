import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'

export function GlobalPontuacaoListener() {
  // Inicializa o listener global de pontuação para sincronização bidirecional e notificações em tempo real
  useSupabasePontuacao()

  return null
}
