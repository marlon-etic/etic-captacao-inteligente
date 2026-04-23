import { useEffect, useState } from 'react'
import { getPendingMatches, updateMatchStatus } from '@/services/matchingService'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { ThumbsDown, ThumbsUp, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ConfirmacaoVinculacaoMatch } from '@/components/modals/ConfirmacaoVinculacaoMatch'

interface MatchCard {
  id: string
  imovel_id: string
  demanda_id: string
  demanda_tipo: 'Venda' | 'Locação'
  score: number
  imovel?: any
  demanda?: any
}

export default function MatchInteligentes() {
  const [matches, setMatches] = useState<MatchCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchCard | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    loadMatches()
  }, [])

  const loadMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const pendingMatches = await getPendingMatches(50)

      const enrichedMatches = await Promise.all(
        pendingMatches.map(async (match) => {
          const { data: imovel } = await supabase
            .from('imoveis_captados')
            .select('*')
            .eq('id', match.imovel_id)
            .single()

          const table = match.demanda_tipo === 'Venda' ? 'demandas_vendas' : 'demandas_locacao'
          const { data: demanda } = await supabase
            .from(table)
            .select('*')
            .eq('id', match.demanda_id)
            .single()

          return { ...match, imovel, demanda }
        }),
      )

      setMatches(enrichedMatches.filter((m) => m.imovel && m.demanda))
    } catch (err) {
      console.error('[MATCH] Erro ao carregar:', err)
      setError('Erro ao carregar matches. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = (match: MatchCard) => {
    setSelectedMatch(match)
  }

  const handleConfirmSuccess = async () => {
    if (selectedMatch) {
      try {
        await updateMatchStatus(selectedMatch.id, 'vinculado')
        setMatches(matches.filter((m) => m.id !== selectedMatch.id))
        setSelectedMatch(null)
      } catch (err) {
        console.error('[MATCH] Erro ao atualizar status para vinculado:', err)
        toast({
          title: 'Aviso',
          description: 'A vinculação foi feita, mas houve erro ao atualizar o status do match.',
          variant: 'destructive',
        })
        setMatches(matches.filter((m) => m.id !== selectedMatch.id))
        setSelectedMatch(null)
      }
    }
  }

  const handleReject = async (match: MatchCard) => {
    try {
      await updateMatchStatus(match.id, 'rejeitado')
      setMatches(matches.filter((m) => m.id !== match.id))
      toast({
        title: '👎 Match rejeitado',
        description: 'Não será mais sugerido',
      })
    } catch (err) {
      console.error('[MATCH] Erro ao rejeitar:', err)
      toast({
        title: '❌ Erro ao rejeitar match',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <Zap className="w-12 h-12 animate-pulse text-yellow-500 mb-4" />
        <p className="text-gray-600 font-medium">Buscando matches inteligentes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)]">
        <p className="text-red-600 mb-4 font-medium">{error}</p>
        <Button onClick={loadMatches}>Tentar Novamente</Button>
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] text-center px-4">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <Zap className="w-10 h-10 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Nenhum match encontrado</h2>
        <p className="text-gray-500 max-w-md">
          Novos matches aparecerão aqui automaticamente quando o sistema encontrar propriedades e
          demandas compatíveis.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 flex shrink-0 items-center justify-center">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">MATCH Inteligentes</h1>
        </div>
      </div>
      <p className="text-gray-600 mb-8 md:ml-13">{matches.length} sugestões encontradas</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {matches.map((match) => (
          <MatchCardItem
            key={match.id}
            match={match}
            onAccept={() => handleAccept(match)}
            onReject={() => handleReject(match)}
          />
        ))}
      </div>

      {selectedMatch && (
        <ConfirmacaoVinculacaoMatch
          match={selectedMatch}
          onClose={() => setSelectedMatch(null)}
          onSuccess={handleConfirmSuccess}
        />
      )}
    </div>
  )
}

function MatchCardItem({
  match,
  onAccept,
  onReject,
}: {
  match: MatchCard
  onAccept: () => void
  onReject: () => void
}) {
  const scoreColor =
    match.score >= 75 ? 'text-green-600' : match.score >= 50 ? 'text-yellow-600' : 'text-red-600'
  const scoreBg =
    match.score >= 75
      ? 'bg-green-50 border-green-200'
      : match.score >= 50
        ? 'bg-yellow-50 border-yellow-200'
        : 'bg-red-50 border-red-200'

  return (
    <div
      className={cn(
        'rounded-xl border-2 p-5 transition-all hover:shadow-md flex flex-col h-full bg-white',
        scoreBg,
      )}
    >
      <div className="flex items-center justify-between mb-5">
        <div className={cn('text-3xl font-black tracking-tight', scoreColor)}>{match.score}%</div>
        <span className="text-xs font-bold bg-white/80 px-3 py-1.5 rounded-full text-gray-700 shadow-sm border border-black/5">
          {match.demanda_tipo === 'Venda' ? '🏷️ Venda' : '🔑 Locação'}
        </span>
      </div>

      <div className="flex-1 space-y-4">
        <div className="bg-white/60 rounded-lg p-3 border border-black/5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Imóvel
          </p>
          <p className="font-bold text-gray-800 line-clamp-1">
            {match.imovel?.codigo_imovel || 'Sem Código'}
          </p>
          <p className="text-sm text-gray-600 line-clamp-1">
            {match.imovel?.localizacao_texto || 'Sem Localização'}
          </p>
          <p className="text-base font-bold text-green-600 mt-1.5">
            R${' '}
            {match.imovel?.preco?.toLocaleString('pt-BR') ||
              match.imovel?.valor?.toLocaleString('pt-BR') ||
              '0,00'}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {match.imovel?.dormitorios || 0} dorm • {match.imovel?.vagas || 0} vagas
          </p>
        </div>

        <div className="bg-white/60 rounded-lg p-3 border border-black/5">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
            Demanda
          </p>
          <p className="font-bold text-gray-800 line-clamp-1">
            {match.demanda?.nome_cliente || match.demanda?.cliente_nome || 'Cliente'}
          </p>
          <p className="text-sm text-gray-600">
            R$ {match.demanda?.valor_minimo?.toLocaleString('pt-BR') || 0} - R${' '}
            {match.demanda?.valor_maximo?.toLocaleString('pt-BR') || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1 font-medium">
            {match.demanda?.dormitorios || match.demanda?.quartos || 0} dorm •{' '}
            {match.demanda?.vagas_estacionamento || match.demanda?.vagas || 0} vagas
          </p>
        </div>

        <div className="bg-white/80 p-3 rounded-lg border border-blue-100">
          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">
            Por que esse match?
          </p>
          <ul className="text-xs text-blue-800 space-y-1 font-medium">
            <li className="flex items-center gap-1">
              <span className="text-blue-500">✓</span> Tipologia e Status
            </li>
            <li className="flex items-center gap-1">
              <span className="text-blue-500">✓</span> Valor dentro do orçamento
            </li>
            <li className="flex items-center gap-1">
              <span className="text-blue-500">✓</span> Perfil compatível
            </li>
          </ul>
        </div>
      </div>

      <div className="flex gap-3 mt-5 pt-2">
        <Button
          onClick={onReject}
          variant="outline"
          className="flex-1 h-12 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
        >
          <ThumbsDown className="w-5 h-5 mr-2" />
          Rejeitar
        </Button>
        <Button
          onClick={onAccept}
          className="flex-1 h-12 bg-[#1A3A52] hover:bg-[#1A3A52]/90 text-white transition-colors"
        >
          <ThumbsUp className="w-5 h-5 mr-2" />
          Aceitar
        </Button>
      </div>
    </div>
  )
}
