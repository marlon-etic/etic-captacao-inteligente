import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/components/ui/use-toast'
import { ThumbsDown, Zap, DollarSign, Home, CheckCircle, X, MapPin, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { calculateMatching } from '@/lib/matching'
import { useUserRole } from '@/hooks/use-user-role'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'

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

interface GroupedMatches {
  demanda_id: string
  demanda: any
  demanda_tipo: string
  matches: MatchCard[]
}

export default function MatchInteligentes() {
  const { role, loading: roleLoading } = useUserRole()
  const { currentUser } = useAppStore()
  const [matches, setMatches] = useState<MatchCard[]>([])
  const [loading, setLoading] = useState(true)
  const [isLinking, setIsLinking] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set())
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
          'id, codigo_imovel, localizacao_texto, preco, valor, dormitorios, vagas, tipo, endereco, tipo_imovel, user_captador_id',
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
              'id, nome_cliente, cliente_nome, valor_minimo, valor_maximo, orcamento_max, dormitorios, quartos, vagas_estacionamento, vagas, bairros, localizacoes, tipo_imovel, corretor_id, status_demanda',
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
              'id, nome_cliente, cliente_nome, valor_minimo, valor_maximo, orcamento_max, dormitorios, quartos, vagas_estacionamento, vagas, bairros, localizacoes, tipo_imovel, sdr_id, status_demanda',
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
        let calculatedScore = match.score

        if (imovel && demanda) {
          const matchResult = calculateMatching(imovel, demanda)
          details = matchResult.details
          calculatedScore = matchResult.score
        }

        return { ...match, score: calculatedScore, imovel, demanda, details }
      })

      // Filter matches depending on if SDR/Corretor wants to see only their demands
      const finalMatches = enrichedMatches.filter((m: any) => {
        if (!m.imovel || !m.demanda) return false

        // Strict filtering: ensure only active demands are displayed
        const status = m.demanda.status_demanda?.toLowerCase() || ''
        if (status !== 'ativo') return false

        if (role === 'admin' || role === 'gestor') return true

        if (role === 'sdr') {
          const isRentalProperty = m.imovel.tipo !== 'Venda'
          const isOwnDemand = m.demanda.sdr_id === currentUser.id || !m.demanda.sdr_id
          return isRentalProperty && isOwnDemand
        }
        if (role === 'corretor' || role === 'broker') {
          const isSaleProperty = m.imovel.tipo !== 'Locação' && m.imovel.tipo !== 'Aluguel'
          const isOwnDemand = m.demanda.corretor_id === currentUser.id || !m.demanda.corretor_id
          return isSaleProperty && isOwnDemand
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

  const groupedMatches = useMemo(() => {
    const groups = new Map<string, GroupedMatches>()
    matches.forEach((m) => {
      if (!groups.has(m.demanda_id)) {
        groups.set(m.demanda_id, {
          demanda_id: m.demanda_id,
          demanda: m.demanda,
          demanda_tipo: m.demanda_tipo,
          matches: [],
        })
      }
      groups.get(m.demanda_id)!.matches.push(m)
    })
    return Array.from(groups.values())
  }, [matches])

  const toggleSelection = (matchId: string) => {
    setSelectedMatches((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(matchId)) newSet.delete(matchId)
      else newSet.add(matchId)
      return newSet
    })
  }

  const toggleAllForGroup = (group: GroupedMatches) => {
    setSelectedMatches((prev) => {
      const newSet = new Set(prev)
      const allSelected = group.matches.every((m) => newSet.has(m.id))

      if (allSelected) {
        group.matches.forEach((m) => newSet.delete(m.id))
      } else {
        group.matches.forEach((m) => newSet.add(m.id))
      }
      return newSet
    })
  }

  const handleVincularSelecionados = async (group: GroupedMatches) => {
    const matchesParaVincular = group.matches.filter((m) => selectedMatches.has(m.id))
    if (matchesParaVincular.length === 0) return

    setIsLinking((prev) => new Set(prev).add(group.demanda_id))

    try {
      // 1. Inserir em imovel_demand_match
      const inserts = matchesParaVincular.map((match) => ({
        imovel_id: match.imovel_id,
        demanda_id: match.demanda_id,
        tipo_demanda: match.demanda_tipo,
        captador_id: currentUser?.id,
        tipo_vinculacao: 'vinculado',
        compatibilidade_pct: match.score,
      }))

      const { error: insertError } = await supabase.from('imovel_demand_match').insert(inserts)

      if (insertError) {
        console.warn('[MATCH] Possíveis duplicatas em imovel_demand_match', insertError)
      }

      // 2. Atualizar status dos matches sugeridos
      const matchIds = matchesParaVincular.map((m) => m.id)
      const { error: updateError } = await supabase
        .from('matches_sugestoes')
        .update({ status: 'vinculado' })
        .in('id', matchIds)

      if (updateError) throw updateError

      // 3. Atualizar UI
      setMatches((prev) => prev.filter((m) => !matchIds.includes(m.id)))

      setSelectedMatches((prev) => {
        const newSet = new Set(prev)
        matchIds.forEach((id) => newSet.delete(id))
        return newSet
      })

      const clientName = group.demanda.nome_cliente || group.demanda.cliente_nome || 'Cliente'

      toast({
        title: 'Sucesso',
        description: `${matchesParaVincular.length} imóveis vinculados com sucesso à demanda de ${clientName}.`,
      })
    } catch (error) {
      console.error('[MATCH] Erro ao vincular em lote:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível vincular os imóveis selecionados.',
        variant: 'destructive',
      })
    } finally {
      setIsLinking((prev) => {
        const newSet = new Set(prev)
        newSet.delete(group.demanda_id)
        return newSet
      })
    }
  }

  const handleRejectGroup = async (group: GroupedMatches) => {
    try {
      const matchIds = group.matches.map((m) => m.id)

      const { error: updateError } = await supabase
        .from('matches_sugestoes')
        .update({ status: 'rejeitado' })
        .in('id', matchIds)

      if (updateError) throw updateError

      setMatches((prev) => prev.filter((m) => !matchIds.includes(m.id)))

      setSelectedMatches((prev) => {
        const newSet = new Set(prev)
        matchIds.forEach((id) => newSet.delete(id))
        return newSet
      })

      toast({
        title: 'Matches rejeitados',
        description: `As sugestões para esta demanda foram descartadas.`,
      })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar as sugestões.',
        variant: 'destructive',
      })
    }
  }

  const handleRejectSingle = async (matchId: string) => {
    try {
      const { error } = await supabase
        .from('matches_sugestoes')
        .update({ status: 'rejeitado' })
        .eq('id', matchId)

      if (error) throw error

      setMatches((prev) => prev.filter((m) => m.id !== matchId))

      setSelectedMatches((prev) => {
        const newSet = new Set(prev)
        newSet.delete(matchId)
        return newSet
      })

      toast({ title: 'Match descartado', description: 'O imóvel foi descartado desta demanda.' })
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Não foi possível descartar o match.',
        variant: 'destructive',
      })
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
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse h-64 bg-muted/50" />
          ))}
        </div>
      ) : groupedMatches.length === 0 ? (
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
        <div className="grid grid-cols-1 gap-6">
          {groupedMatches.map((group) => {
            const allSelected =
              group.matches.length > 0 && group.matches.every((m) => selectedMatches.has(m.id))
            const selectedCount = group.matches.filter((m) => selectedMatches.has(m.id)).length
            const isGroupLinking = isLinking.has(group.demanda_id)
            const demandaBairros = group.demanda.bairros || group.demanda.localizacoes || []
            const bairrosText =
              demandaBairros.length > 0 ? demandaBairros.join(', ') : 'Qualquer bairro'

            return (
              <Card
                key={group.demanda_id}
                className="overflow-hidden flex flex-col transition-all border-primary/20"
              >
                <CardHeader className="bg-primary/5 pb-4 border-b flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                        {group.demanda_tipo}
                      </span>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 font-bold"
                      >
                        {group.matches.length} Sugestões de Imóveis
                      </Badge>
                    </div>
                    <CardTitle className="text-xl">
                      👤 {group.demanda.nome_cliente || group.demanda.cliente_nome || 'Cliente'}
                    </CardTitle>
                    <p className="text-sm font-medium text-muted-foreground mt-1">
                      Orçamento:{' '}
                      <span className="font-bold text-blue-600">
                        <DollarSign className="inline w-3 h-3 mr-1" />
                        {formatCurrency(
                          group.demanda.valor_maximo || group.demanda.orcamento_max || 0,
                        )}
                      </span>{' '}
                      • Quartos: {group.demanda.quartos || group.demanda.dormitorios || 0} • Vagas:{' '}
                      {group.demanda.vagas || group.demanda.vagas_estacionamento || 0}
                    </p>
                    <p className="text-sm font-medium text-muted-foreground mt-1 flex items-center">
                      <MapPin className="inline w-3 h-3 mr-1 text-primary" />
                      {bairrosText}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 w-full md:w-auto">
                    <Button
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 md:flex-none"
                      onClick={() => handleRejectGroup(group)}
                      disabled={isGroupLinking}
                    >
                      <ThumbsDown className="w-4 h-4 mr-2 hidden sm:inline" /> Descartar Demanda
                    </Button>
                    <Button
                      disabled={selectedCount === 0 || isGroupLinking}
                      onClick={() => handleVincularSelecionados(group)}
                      className="flex-1 md:flex-none"
                    >
                      {isGroupLinking ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin hidden sm:inline" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-2 hidden sm:inline" />
                      )}
                      Vincular Selecionados ({selectedCount})
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-4 py-3 bg-muted/30 border-b flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`select-all-${group.demanda_id}`}
                        checked={allSelected}
                        onCheckedChange={() => toggleAllForGroup(group)}
                        disabled={isGroupLinking}
                      />
                      <label
                        htmlFor={`select-all-${group.demanda_id}`}
                        className="text-sm font-medium cursor-pointer"
                      >
                        Selecionar Todos ({group.matches.length})
                      </label>
                    </div>
                  </div>
                  <div className="divide-y max-h-[400px] overflow-y-auto">
                    {group.matches.map((match) => (
                      <div
                        key={match.id}
                        className="p-4 hover:bg-muted/10 flex items-start space-x-4 transition-colors"
                      >
                        <Checkbox
                          id={`match-${match.id}`}
                          checked={selectedMatches.has(match.id)}
                          onCheckedChange={() => toggleSelection(match.id)}
                          disabled={isGroupLinking}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">
                                {match.imovel.codigo_imovel
                                  ? `#${match.imovel.codigo_imovel} - `
                                  : ''}
                                {match.imovel.tipo_imovel || 'Imóvel'}
                              </h4>
                              <Badge
                                className={cn(
                                  'text-xs font-bold',
                                  match.score >= 80
                                    ? 'bg-green-500 hover:bg-green-600 text-white'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white',
                                )}
                              >
                                {match.score}% Compatível
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold text-emerald-600">
                                {formatCurrency(match.imovel.preco || match.imovel.valor || 0)}
                              </p>
                              <span className="text-xs text-muted-foreground font-medium border-l pl-2 border-border">
                                {match.imovel.dormitorios || 0} dorm • {match.imovel.vagas || 0}{' '}
                                vagas
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-muted-foreground hover:text-red-600 ml-2"
                                onClick={() => handleRejectSingle(match.id)}
                                title="Descartar este imóvel"
                                disabled={isGroupLinking}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <p
                            className="text-sm text-muted-foreground"
                            title={match.imovel.endereco || match.imovel.localizacao_texto}
                          >
                            <Home className="inline w-3 h-3 mr-1" />
                            {match.imovel.endereco ||
                              match.imovel.localizacao_texto ||
                              'Endereço não informado'}
                          </p>
                          {match.details && (
                            <div className="flex flex-wrap gap-2 text-[11px] mt-2 pt-2">
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded border',
                                  match.details.price_match
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200',
                                )}
                              >
                                {match.details.price_match
                                  ? '✓ Preço compatível'
                                  : '✕ Fora do orçamento'}
                              </span>
                              <span
                                className={cn(
                                  'px-2 py-0.5 rounded border',
                                  match.details.location_match
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                )}
                              >
                                {match.details.location_match
                                  ? '✓ Região compatível'
                                  : '⚠ Região diferente'}
                              </span>
                              {match.details.tipology_match !== undefined && (
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded border',
                                    match.details.tipology_match
                                      ? 'bg-green-50 text-green-700 border-green-200'
                                      : 'bg-yellow-50 text-yellow-700 border-yellow-200',
                                  )}
                                >
                                  {match.details.tipology_match
                                    ? '✓ Tipologia ideal'
                                    : '⚠ Tipologia diferente'}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
