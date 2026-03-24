import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

export interface Pontuacao {
  id: string
  captador_id: string
  demanda_locacao_id?: string
  demanda_venda_id?: string
  tipo_pontuacao: 'captura_com_demanda' | 'captura_sem_demanda' | 'ganho_confirmado'
  pontos: number
  created_at: string
}

export function useSupabasePontuacao() {
  const [pontuacoes, setPontuacoes] = useState<Pontuacao[]>([])
  const { toast } = useToast()
  const { currentUser } = useAppStore()
  const mounted = useRef(true)

  const fetchPontuacoes = useCallback(async () => {
    const { data } = await supabase
      .from('pontuacao_captador')
      .select('*')
      .order('created_at', { ascending: false })
    if (data && mounted.current) {
      setPontuacoes(data as Pontuacao[])
    }
  }, [])

  useEffect(() => {
    mounted.current = true
    fetchPontuacoes()

    console.log('[DEBUG] Subscription criada: pontuacao_captador')

    // Sincronização Bidirecional em Tempo Real
    const sub = supabase
      .channel('realtime_pontuacao_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pontuacao_captador' },
        (payload) => {
          console.log('[DEBUG] Evento recebido (pontuacao_captador):', payload)
          if (mounted.current) {
            if (payload.eventType === 'INSERT') {
              const newPoint = payload.new as Pontuacao
              setPontuacoes((prev) => {
                if (prev.some((p) => p.id === newPoint.id)) return prev
                const newState = [newPoint, ...prev]
                console.log('[DEBUG] Estado atualizado (INSERT pontuacao_captador):', newState)
                return newState
              })

              if (currentUser && newPoint.captador_id === currentUser.id) {
                let msg = ''
                if (newPoint.tipo_pontuacao === 'captura_com_demanda')
                  msg = `Você ganhou +${newPoint.pontos} pontos! Captura vinculada a uma demanda.`
                else if (newPoint.tipo_pontuacao === 'captura_sem_demanda')
                  msg = `Você ganhou +${newPoint.pontos} pontos! Nova captura de imóvel avulso.`
                else if (newPoint.tipo_pontuacao === 'ganho_confirmado')
                  msg = `Você ganhou +${newPoint.pontos} pontos! Um negócio foi confirmado a partir da sua captação.`

                if (msg) {
                  toast({
                    title: '🏆 Pontuação em Tempo Real!',
                    description: msg,
                    className:
                      'bg-[#10B981] text-white border-none font-bold shadow-lg animate-bounce-scale',
                  })
                }
              }
            } else if (payload.eventType === 'DELETE') {
              setPontuacoes((prev) => {
                const newState = prev.filter(p => p.id !== payload.old.id)
                console.log('[DEBUG] Estado atualizado (DELETE pontuacao_captador):', newState)
                return newState
              })
            } else if (payload.eventType === 'UPDATE') {
              const newPoint = payload.new as Pontuacao
              setPontuacoes((prev) => {
                const newState = prev.map(p => p.id === newPoint.id ? newPoint : p)
                console.log('[DEBUG] Estado atualizado (UPDATE pontuacao_captador):', newState)
                return newState
              })
            }
          }
        },
      )
      .subscribe()

    return () => {
      mounted.current = false
      supabase.removeChannel(sub)
    }
  }, [fetchPontuacoes, currentUser?.id, toast])

  return { pontuacoes, refresh: fetchPontuacoes }
}
