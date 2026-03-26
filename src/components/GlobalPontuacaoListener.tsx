import { useSupabasePontuacao } from '@/hooks/use-supabase-pontuacao'
import useAppStore from '@/stores/useAppStore'

function PontuacaoListenerInner() {
  // Inicializa o listener de realtime
  useSupabasePontuacao()
  return null
}

export function GlobalPontuacaoListener() {
  const { currentUser } = useAppStore()

  // ROOT-KILL Fix: O realtime channel não deve ser ativado na página inicial (Index).
  // Apenas renderiza (e consequentemente conecta o socket) se o usuário estiver autenticado.
  if (!currentUser) return null

  return <PontuacaoListenerInner />
}
