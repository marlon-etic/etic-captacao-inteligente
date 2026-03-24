import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { useSmartSync, useConsolidatedSync } from '@/hooks/useSmartSync'

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
  const { fetchWithResilience } = useSmartSync()

  const fetchPontuacoes = useCallback(async () => {
    try {
      const data = await fetchWithResilience('pontuacoes', async () => {
        const { data: resData, error } = await supabase
          .from('pontuacao_captador')
          .select('*')
          .order('created_at', { ascending: false })
        if (error) throw error
        return resData
      })
      if (data && mounted.current) {
        setPontuacoes(data as Pontuacao[])
      }
    } catch (e) {}
  }, [fetchWithResilience])

  useEffect(() => {
    mounted.current = true
    fetchPontuacoes()
    return () => {
      mounted.current = false
    }
  }, [fetchPontuacoes])

  useConsolidatedSync({
    channelName: 'realtime_pontuacao_sync',
    setupRealtime: (channel) => {
      channel.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pontuacao_captador' },
        (payload) => {
          if (mounted.current) {
            if (payload.eventType === 'INSERT') {
              const newPoint = payload.new as Pontuacao
              setPontuacoes((prev) => {
                if (prev.some((p) => p.id === newPoint.id)) return prev
                return [newPoint, ...prev]
              })

              if (currentUser && newPoint.captador_id === currentUser.id) {
                let msg = ''
                if (newPoint.tipo_pontuacao === 'captura_com_demanda')
                  msg = `Você ganhou +${newPoint.pontos} pontos! Captura vinculada a uma demanda.`
                else if (newPoint.tipo_pontuacao === 'captura_sem_demanda')
                  msg = `Você ganhou +${newPoint.pontos} pontos! Nova captura de imóvel avulso.`

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
              setPontuacoes((prev) => prev.filter((p) => p.id !== payload.old.id))
            } else if (payload.eventType === 'UPDATE') {
              const newPoint = payload.new as Pontuacao
              setPontuacoes((prev) => prev.map((p) => (p.id === newPoint.id ? newPoint : p)))
            }
          }
        },
      )
    },
    onFallbackPoll: fetchPontuacoes,
  })

  return { pontuacoes, refresh: fetchPontuacoes }
}
