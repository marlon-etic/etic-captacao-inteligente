import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { findNewMatches } from '@/services/matchingService'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase/client'

export function GlobalMatchListener() {
  const navigate = useNavigate()
  const notifiedMatches = useRef<Set<string>>(new Set())

  useEffect(() => {
    const handleNewMatch = (match: any) => {
      if (notifiedMatches.current.has(match.id)) return
      notifiedMatches.current.add(match.id)

      const codigoImovel = match.imovel?.codigo_imovel || 'Desconhecido'

      toast({
        title: '⚡ Novo Match Encontrado!',
        description: `Imóvel ${codigoImovel} compatível com demanda.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/app/match-inteligentes')}
            className="bg-blue-500 hover:bg-blue-600 text-white border-none"
          >
            Ver Match
          </Button>
        ),
        duration: 5000,
      })
    }

    const checkMatches = async () => {
      try {
        await findNewMatches(handleNewMatch)
      } catch (err) {
        console.error('[GlobalMatchListener] Erro:', err)
      }
    }

    checkMatches()
    const interval = setInterval(checkMatches, 60000)

    const channel = supabase
      .channel('global_match_listener')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'matches_sugestoes' },
        (payload) => {
          console.log('[REALTIME] Alteração em matches_sugestoes (GlobalMatchListener):', payload)
          checkMatches()
        },
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [navigate])

  return null
}
