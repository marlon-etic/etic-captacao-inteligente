import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { ThumbsDown, Zap, DollarSign, Home, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { calculateMatching } from '@/lib/matching'
import { ConfirmacaoVinculacaoMatch } from '@/components/modals/ConfirmacaoVinculacaoMatch'
import { useUserRole } from '@/hooks/use-user-role'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { updateMatchStatus } from '@/services/matchingService'

interface MatchCard {
  id: string
  imovel_id: string
  demanda_id: string
  demanda_tipo: 'Venda' | 'Locação' | string
  score: number
  imovel?: any
  demanda?: any
  details?: any
}

export default function MatchInteligentes() {
  const { role, loading: roleLoading } = useUserRole()
  const { currentUser } = useAppStore()
  const [matches, setMatches] = useState<MatchCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<MatchCard | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (!roleLoading && role && currentUser?.id) {
      loadMatches()
    } else if (!roleLoading && !currentUser?.id) {
      setLoading(false)
    }
  }, [role, roleLoading, currentUser])

  const loadMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!currentUser?.id || !role) {
        setMatches([])
        return
      }

      // Step 1: Fetch pending matches filtered by Demanda Tipo (SDR/Corretor)
      let query = supabase
        .from('matches_sugestoes')
        .select(`
          id,
          imovel_id,
          demanda_id,
          demanda_tipo,
          score,
          status
        `)
        .eq('status', 'pendente')
        .order('score', { ascending: false })
        .limit(100)

      if (role === 'sdr') {
        query = query.in('demanda_tipo', ['Locação', 'Aluguel'])
      } else if (role === 'corretor' || role === 'broker') {
        query = query.eq('demanda_tipo', 'Venda')
      }

      const { data: rawMatches, error: matchError } = await query

      if (matchError) throw matchError

      if (!rawMatches || rawMatches.length === 0) {
        setMatches([])
        setLoading(false)
        return
      }

      const imovelIds = [...new Set(rawMatches.map((m: any) => m.imovel_id))]

      // Step 2: Fetch Imoveis
      const { data: imoveisRes, error: imoveisError } = await supabase
        .from('imoveis_captados')
        .select(
          'id, codigo_imovel, localizacao_texto, preco, valor, dormitorios, vagas, tipo, endereco, tipo_imovel, bairros, user_captador_id',
        )
        .in('id', imovelIds)

      if (imoveisError) throw imoveisError

      // Filter Imoveis based on Captador role
      const validImovelMap = new Map()
      ;(imoveisRes || []).forEach((i) => {
        if (role === 'captador') {
          if (i.user_captador_id === currentUser.id) validImovelMap.set(i.id, i)
        } else {
          validImovelMap.set(i.id, i)
        }
      })

      const filteredMatches = rawMatches.filter((m) => validImovelMap.has(m.imovel_id))

      if (filteredMatches.length === 0) {
        setMatches([])
        setLoading(false)
        return
      }

      const demandaVendaIds = [
        ...new Set(
          filteredMatches
            .filter((m: any) => m.demanda_tipo === 'Venda')
            .map((m: any) => m.demanda_id),
        ),
      ]

      const demandaLocacaoIds = [
        ...new Set(
          filteredMatches
            .filter((m: any) => m.demanda_tipo === 'Locação' || m.demanda_tipo === 'Aluguel')
            .map((m: any) => m.demanda_id),
        ),
      ]

      const promises = []

      if (demandaVendaIds.length > 0) {
        promises.push(
          supabase
            .from('demandas_vendas')
            .select(
              'id, nome_cliente, cliente_nome, valor_minimo, valor_maximo, orcamento_max, dormitorios, quartos, vagas_estacionamento, vagas, bairros, tipo_imovel, corretor_id',
            )
            .in('id', demandaVendaIds),
        )
      } else {
        promises.push(Promise.resolve({ data: [] } as any))
      }

      if (demandaLocacaoIds.length > 0) {
        promises.push(
          supabase
            .from('demandas_locacao')
            .select(
              'id, nome_cliente, cliente_nome, valor_minimo, valor_maximo, orcamento_max, dormitorios, quartos, vagas_estacionamento, vagas, bairros, tipo_imovel, sdr_id',
            )
            .in('id', demandaLocacaoIds),
        )
      } else {
        promises.push(Promise.resolve({ data: [] } as any))
      }

      const [demandasVendaRes, demandasLocacaoRes] = await Promise.all(promises)

      const demandaVendaMap = new Map((demandasVendaRes.data || []).map((d: any) => [d.id, d]))
      const demandaLocacaoMap = new Map((demandasLocacaoRes.data || []).map((d: any) => [d.id, d]))

      const enrichedMatches = filteredMatches.map((match: any) => {
        const imovel = validImovelMap.get(match.imovel_id)
        const demanda =
          match.demanda_tipo === 'Venda'
            ? demandaVendaMap.get(match.demanda_id)
            : demandaLocacaoMap.get(match.demanda_id)

        let details = null
        if (imovel && demanda) {
          const matchResult = calculateMatching(imovel, demanda)
          details = matchResult.details
        }

        return { ...match, imovel, demanda, details }
      })

      // Filter matches depending on if SDR/Corretor wants to see only their demands
      const finalMatches = enrichedMatches.filter((m: any) => {
        if (!m.imovel || !m.demanda) return false

        if (role === 'sdr') {
          return m.demanda.sdr_id === currentUser.id || !m.demanda.sdr_id
        }
        if (role === 'corretor' || role === 'broker') {
          return m.demanda.corretor_id === currentUser.id || !m.demanda.corretor_id
        }
        return true
      })

      setMatches(finalMatches.sort((a: any, b: any) => b.score - a.score))
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

  const handleReject = async (match: MatchCard) => {
    try {
      await updateMatchStatus(match.id, 'rejeitado')
      setMatches(matches.filter((m) => m.id !== match.id))
      toast({ title: 'Match rejeitado', description: 'Este match não será sugerido novamente.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o match.',
        variant: 'destructive',
      })
    }
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
        setSelectedMatch(null)
      }
    }
  }

  const formatCurrency = (val: number) => {
    if (!val) return 'R$ 0,00'
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center p-8 bg-card rounded-lg shadow-sm border">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-bold mb-2">Autenticação Necessária</h2>
          <p className="text-muted-foreground">
            Você precisa estar logado para ver seus matches inteligentes.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Match Inteligente</h1>
          <p className="text-muted-foreground mt-1">
            Conexões sugeridas automaticamente entre Imóveis e Demandas.
          </p>
        </div>
        <Button variant="outline" onClick={loadMatches} disabled={loading}>
          <Zap className="mr-2 h-4 w-4" /> Atualizar
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive border-l-4 border-destructive p-4 rounded text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse h-64 bg-muted/50" />
          ))}
        </div>
      ) : matches.length === 0 ? (
        <div className="text-center py-24 bg-card rounded-lg border border-dashed">
          <Zap className="mx-auto h-12 w-12 text-muted-foreground opacity-50 mb-4" />
          <h3 className="text-lg font-medium">Nenhum match encontrado para o seu perfil</h3>
          <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
            {role === 'captador'
              ? 'Não encontramos matches pendentes para os imóveis que você captou. Continue cadastrando!'
              : 'Não encontramos novas conexões inteligentes para suas demandas no momento. Volte mais tarde!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matches.map((match) => (
            <Card
              key={match.id}
              className="flex flex-col overflow-hidden transition-all hover:shadow-md border-primary/20"
            >
              <CardHeader className="bg-primary/5 pb-4 border-b">
                <div className="flex justify-between items-start">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      {match.demanda_tipo}
                    </span>
                    <CardTitle className="text-xl mt-1">
                      {match.score}% de Compatibilidade
                    </CardTitle>
                  </div>
                  <div className="bg-primary text-primary-foreground font-bold rounded-full w-12 h-12 flex items-center justify-center text-lg shadow-sm">
                    {match.score}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Imóvel */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground border-b pb-1">
                      Imóvel
                    </h4>
                    <p
                      className="text-sm font-medium line-clamp-2"
                      title={match.imovel.endereco || match.imovel.localizacao_texto}
                    >
                      <Home className="inline w-3 h-3 mr-1 text-muted-foreground" />
                      {match.imovel.endereco ||
                        match.imovel.localizacao_texto ||
                        'Endereço não informado'}
                    </p>
                    <p className="text-sm font-bold text-emerald-600">
                      <DollarSign className="inline w-3 h-3 mr-1" />
                      {formatCurrency(match.imovel.preco || match.imovel.valor || 0)}
                    </p>
                  </div>

                  {/* Demanda */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground border-b pb-1">
                      Demanda
                    </h4>
                    <p className="text-sm font-medium line-clamp-2">
                      👤 {match.demanda.nome_cliente || match.demanda.cliente_nome || 'Cliente'}
                    </p>
                    <p className="text-sm font-bold text-blue-600">
                      <DollarSign className="inline w-3 h-3 mr-1" />
                      Até{' '}
                      {formatCurrency(
                        match.demanda.valor_maximo || match.demanda.orcamento_max || 0,
                      )}
                    </p>
                  </div>
                </div>

                {/* Match Reasons */}
                {match.details && (
                  <div className="mt-5 bg-muted/30 p-3 rounded-lg border border-border/50">
                    <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                      Análise de Compatibilidade
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span
                        className={cn(
                          'px-2 py-1 rounded border',
                          match.details.price_match
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-red-50 text-red-700 border-red-200',
                        )}
                      >
                        {match.details.price_match ? '✓ Preço no orçamento' : '✕ Fora do orçamento'}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-1 rounded border',
                          match.details.location_match
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        )}
                      >
                        {match.details.location_match
                          ? '✓ Região compatível'
                          : '⚠ Região diferente'}
                      </span>
                      <span
                        className={cn(
                          'px-2 py-1 rounded border',
                          match.details.tipology_match
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-yellow-50 text-yellow-700 border-yellow-200',
                        )}
                      >
                        {match.details.tipology_match
                          ? '✓ Tipologia ideal'
                          : '⚠ Tipologia diferente'}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>

              <CardFooter className="grid grid-cols-2 gap-3 pt-2 pb-4 px-6 border-t bg-muted/10">
                <Button
                  variant="outline"
                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={() => handleReject(match)}
                >
                  <ThumbsDown className="w-4 h-4 mr-2" /> Descartar
                </Button>
                <Button className="w-full" onClick={() => handleAccept(match)}>
                  <CheckCircle className="w-4 h-4 mr-2" /> Vincular
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {selectedMatch && (
        <ConfirmacaoVinculacaoMatch
          open={!!selectedMatch}
          onOpenChange={(open: boolean) => !open && setSelectedMatch(null)}
          imovelId={selectedMatch.imovel_id}
          demandaId={selectedMatch.demanda_id}
          tipoDemanda={selectedMatch.demanda_tipo}
          compatibilidade={selectedMatch.score}
          onSuccess={handleConfirmSuccess}
        />
      )}
    </div>
  )
}
