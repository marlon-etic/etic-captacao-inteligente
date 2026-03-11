import { useMemo, useState, useEffect } from 'react'
import {
  PackageSearch,
  Clock,
  Map,
  Handshake,
  CheckSquare,
  Search,
  Trophy,
  TrendingUp,
  Filter,
  SortDesc,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DemandCard } from '@/components/DemandCard'
import { DemandActionModal } from '@/components/DemandActionModal'
import { Progress } from '@/components/ui/progress'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Demand } from '@/types'

export function CaptadorDashboard() {
  const { demands, currentUser, users, submitDemandResponse } = useAppStore()
  const { toast } = useToast()
  const [, setTick] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(timer)
  }, [])

  const [modal, setModal] = useState<{
    isOpen: boolean
    demand: Demand | null
    type: 'encontrei' | 'nao_encontrei' | null
  }>({ isOpen: false, demand: null, type: null })
  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    urgency: 'all',
    sort: 'urgency',
  })
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20

  const stats = useMemo(() => {
    const c = { capDem: 0, capInd: 0, search: 0, visit: 0, deal: 0, await: 0 }
    demands.forEach((d) => {
      if (d.status === 'Captado sob demanda') c.capDem++
      if (d.status === 'Captado independente') c.capInd++
      if (d.status === 'Em Captação') c.search++
      if (d.status === 'Visita') c.visit++
      if (d.status === 'Negócio') c.deal++
      if (d.status === 'Pendente') c.await++
    })
    return c
  }, [demands])

  const ranking = useMemo(() => {
    const rank =
      [...users].sort((a, b) => b.points - a.points).findIndex((u) => u.id === currentUser?.id) + 1
    return rank > 0 ? rank : '-'
  }, [users, currentUser])

  const nextBadge = 2000
  const progress = currentUser ? Math.min((currentUser.points / nextBadge) * 100, 100) : 0

  const sortedDemands = useMemo(() => {
    return demands
      .filter((d) => filters.type === 'all' || d.type === filters.type)
      .filter((d) => filters.status === 'all' || d.status === filters.status)
      .filter((d) => filters.urgency === 'all' || d.urgency === filters.urgency)
      .sort((a, b) => {
        if (a.status === 'Pendente' && b.status !== 'Pendente') return -1
        if (a.status !== 'Pendente' && b.status === 'Pendente') return 1
        if (filters.sort === 'urgency') {
          const u: any = { Alta: 3, Média: 2, Baixa: 1 }
          return (u[b.urgency] || 0) - (u[a.urgency] || 0)
        }
        if (filters.sort === 'time')
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        if (filters.sort === 'similar')
          return (b.similarProfilesCount || 0) - (a.similarProfilesCount || 0)
        return 0
      })
  }, [demands, filters])

  const paginated = sortedDemands.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(sortedDemands.length / ITEMS_PER_PAGE)

  const handleAction = (payload: any) => {
    if (!modal.demand || !modal.type) return
    const res = submitDemandResponse(modal.demand.id, modal.type, payload)
    toast({
      title: res.success ? (modal.type === 'encontrei' ? 'Sucesso!' : 'Atualizado') : 'Erro',
      description: res.success
        ? res.message
        : res.message || 'Erro ao carregar dashboard. Tente novamente',
      variant: res.success ? 'default' : 'destructive',
    })
    setModal({ isOpen: false, demand: null, type: null })
  }

  const statCards = [
    { t: 'Aguardando', v: stats.await, i: Clock, c: 'text-orange-500', b: 'bg-orange-100' },
    { t: 'Em Captação', v: stats.search, i: Search, c: 'text-blue-500', b: 'bg-blue-100' },
    { t: 'Captado (Dem)', v: stats.capDem, i: CheckSquare, c: 'text-green-600', b: 'bg-green-100' },
    { t: 'Captado (Ind)', v: stats.capInd, i: PackageSearch, c: 'text-teal-600', b: 'bg-teal-100' },
    { t: 'Visitas', v: stats.visit, i: Map, c: 'text-purple-600', b: 'bg-purple-100' },
    { t: 'Negócios', v: stats.deal, i: Handshake, c: 'text-emerald-600', b: 'bg-emerald-100' },
  ]

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Painel de Captação</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie suas demandas, acompanhe seu desempenho e feche negócios.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Seu Ranking</p>
              <p className="text-2xl font-bold">#{ranking}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pontos Totais</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{currentUser?.points || 0}</p>
                <span className="text-xs text-emerald-600 font-medium">+150 hoje</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex flex-col justify-center h-full gap-2">
            <div className="flex justify-between items-end">
              <p className="text-sm font-medium text-muted-foreground">Próximo Badge</p>
              <p className="text-xs font-bold">
                {currentUser?.points} / {nextBadge}
              </p>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2">
              <div className={`p-2 rounded-full ${s.b}`}>
                <s.i className={`w-5 h-5 ${s.c}`} />
              </div>
              <div>
                <p className="text-xl font-bold">{s.v}</p>
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                  {s.t}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/50">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
              <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="Venda">Venda</SelectItem>
                <SelectItem value="Aluguel">Aluguel</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters({ ...filters, status: v })}
            >
              <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="Pendente">Aguardando Resposta</SelectItem>
                <SelectItem value="Em Captação">Em Captação</SelectItem>
                <SelectItem value="Captado sob demanda">Captados</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.urgency}
              onValueChange={(v) => setFilters({ ...filters, urgency: v })}
            >
              <SelectTrigger className="w-[120px] h-8 text-xs bg-background">
                <SelectValue placeholder="Urgência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Qqr Urgência</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <SortDesc className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={filters.sort} onValueChange={(v) => setFilters({ ...filters, sort: v })}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="urgency">Maior Urgência</SelectItem>
                <SelectItem value="time">Mais Recentes</SelectItem>
                <SelectItem value="similar">Perfis Similares</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {sortedDemands.length === 0 ? (
          <div className="text-center p-12 bg-background border rounded-xl border-dashed flex flex-col items-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Nenhuma demanda encontrada</h3>
            <p className="text-muted-foreground">Nenhuma demanda no momento. Volte mais tarde!</p>
            {(filters.type !== 'all' || filters.status !== 'all' || filters.urgency !== 'all') && (
              <Button
                variant="link"
                onClick={() =>
                  setFilters({ type: 'all', status: 'all', urgency: 'all', sort: 'urgency' })
                }
                className="mt-2"
              >
                Limpar filtros
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map((d) => (
                <DemandCard
                  key={d.id}
                  demand={d}
                  showActions={d.status === 'Pendente' || d.status === 'Em Captação'}
                  onAction={(id, type) => setModal({ isOpen: true, demand: d, type })}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <div className="pt-4 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" /> Anterior
                      </Button>
                    </PaginationItem>
                    <div className="flex items-center px-4 text-sm font-medium">
                      Página {page} de {totalPages}
                    </div>
                    <PaginationItem>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="gap-1"
                      >
                        Próxima <ChevronRight className="h-4 w-4" />
                      </Button>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
      <DemandActionModal
        isOpen={modal.isOpen}
        demand={modal.demand}
        actionType={modal.type}
        onClose={() => setModal({ isOpen: false, demand: null, type: null })}
        onConfirm={handleAction}
      />
    </div>
  )
}
