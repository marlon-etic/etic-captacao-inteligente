import { useMemo, useState, useEffect } from 'react'
import {
  PackageSearch,
  Clock,
  Map,
  Handshake,
  CheckSquare,
  Search,
  Filter,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  Plus,
  Link as LinkIcon,
  Unlock,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { DemandCard } from '@/components/DemandCard'
import { DemandActionModal } from '@/components/DemandActionModal'
import { IndependentCaptureModal } from '@/components/IndependentCaptureModal'
import { GamificationWidget } from '@/components/dashboard/GamificationWidget'
import { GroupedDemandCard } from '@/components/GroupedDemandCard'
import { CaptadorPerformanceTab } from '@/components/dashboard/CaptadorPerformanceTab'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem } from '@/components/ui/pagination'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import useAppStore from '@/stores/useAppStore'
import { useToast } from '@/hooks/use-toast'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { useDemandGrouping } from '@/hooks/useDemandGrouping'

const QUICK_FILTERS = [
  { id: 'all', label: 'Todos', icon: '📊' },
  { id: 'awaiting', label: 'Aguardando', icon: '⏳' },
  { id: 'sla_24', label: 'Prazo 24h', icon: '⏰' },
  { id: 'visits', label: 'Visitas', icon: '👁️' },
  { id: 'deals', label: 'Negócios', icon: '💰' },
]

export function CaptadorDashboard() {
  const { demands, currentUser, submitDemandResponse, looseProperties } = useAppStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('demandas')

  const [modal, setModal] = useState<{
    isOpen: boolean
    demand: Demand | null
    type: 'encontrei' | 'nao_encontrei' | null
  }>({ isOpen: false, demand: null, type: null })
  const [indepModalOpen, setIndepModalOpen] = useState(false)

  const [quickFilter, setQuickFilter] = useState(() => {
    try {
      return localStorage.getItem('captador_quick_filter') || 'all'
    } catch {
      return 'all'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('captador_quick_filter', quickFilter)
    } catch {
      // ignore
    }
  }, [quickFilter])

  const [filters, setFilters] = useState({
    type: 'all',
    status: 'all',
    timeframe: 'all',
    sort: 'urgency',
  })
  const [page, setPage] = useState(1)
  const ITEMS_PER_PAGE = 20
  const [viewMode, setViewMode] = useState<'all' | 'new' | 'grouped'>('all')

  const handleQuickFilterClick = (id: string) => {
    try {
      setQuickFilter(id)
      setPage(1)
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'Erro ao aplicar filtro. Tente novamente',
        variant: 'destructive',
      })
    }
  }

  const quickCounts = useMemo(() => {
    const counts = { all: demands.length, awaiting: 0, sla_24: 0, visits: 0, deals: 0 }
    const now = Date.now()
    demands.forEach((d) => {
      if (d.status === 'Pendente') {
        counts.awaiting++
        const startMs =
          d.isExtension48h && d.extensionRequestedAt
            ? new Date(d.extensionRequestedAt).getTime()
            : new Date(d.createdAt).getTime()
        const totalSlaMs = d.isExtension48h ? 48 * 3600000 : 24 * 3600000
        const elapsedMs = now - startMs
        if (elapsedMs < totalSlaMs) counts.sla_24++
      }
      if (d.status === 'Visita') counts.visits++
      if (d.status === 'Negócio') counts.deals++
    })
    return counts
  }, [demands])

  const stats = useMemo(() => {
    const c = { capDem: 0, capInd: 0, search: 0, visit: 0, deal: 0, await: 0 }
    let vinculadosCount = 0
    demands.forEach((d) => {
      if (d.status === 'Captado sob demanda') c.capDem++
      if (d.status === 'Captado independente') c.capInd++
      if (d.status === 'Em Captação') c.search++
      if (d.status === 'Visita') c.visit++
      if (d.status === 'Negócio') c.deal++
      if (d.status === 'Pendente') c.await++
      if (d.capturedProperties) {
        vinculadosCount += d.capturedProperties.filter(
          (p) => p.captador_id === currentUser?.id,
        ).length
      }
    })

    const soltosCount = looseProperties.filter((p) => p.captador_id === currentUser?.id).length

    return { ...c, vinculadosCount, soltosCount }
  }, [demands, looseProperties, currentUser])

  const {
    newDemands,
    groupedDemands,
    oldDemands,
    error: groupingError,
  } = useDemandGrouping({
    demands,
    filters,
    quickFilter,
  })

  const allRenderItems = useMemo(() => {
    let items: any[] = []
    if (viewMode === 'all' || viewMode === 'new')
      items.push(...newDemands.map((d) => ({ type: 'new', item: d })))
    if (viewMode === 'all' || viewMode === 'grouped')
      items.push(...groupedDemands.map((g) => ({ type: 'group', item: g })))
    if (viewMode === 'all') items.push(...oldDemands.map((d) => ({ type: 'old', item: d })))
    return items
  }, [newDemands, groupedDemands, oldDemands, viewMode])

  const paginatedItems = allRenderItems.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)
  const totalPages = Math.ceil(allRenderItems.length / ITEMS_PER_PAGE)

  const handleAction = (payload: any) => {
    if (!modal.demand || !modal.type) return
    const res = submitDemandResponse(modal.demand.id, modal.type, payload)
    if (!res.success) {
      toast({
        title: 'Erro',
        description: res.message || 'Erro ao registrar.',
        variant: 'destructive',
      })
    }
    setModal({ isOpen: false, demand: null, type: null })
  }

  const statCards = [
    { t: 'Aguardando', v: stats.await, i: Clock, c: 'text-orange-500', b: 'bg-orange-100' },
    { t: 'Em Captação', v: stats.search, i: Search, c: 'text-blue-500', b: 'bg-blue-100' },
    { t: 'Captado (Dem)', v: stats.capDem, i: CheckSquare, c: 'text-green-600', b: 'bg-green-100' },
    { t: 'Visitas', v: stats.visit, i: Map, c: 'text-purple-600', b: 'bg-purple-100' },
    { t: 'Negócios', v: stats.deal, i: Handshake, c: 'text-emerald-600', b: 'bg-emerald-100' },
  ]

  if (!currentUser) return null

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 pb-10 relative">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Painel de Captação</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie demandas e acompanhe seu desempenho gamificado.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <TabsList className="bg-muted/50 border p-1 h-auto">
            <TabsTrigger value="performance" className="py-2 px-4 text-sm">
              Minha Performance
            </TabsTrigger>
            <TabsTrigger value="demandas" className="py-2 px-4 text-sm relative">
              Demandas Ativas
              {quickCounts.awaiting > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full animate-bounce">
                  {quickCounts.awaiting}
                </span>
              )}
            </TabsTrigger>
          </TabsList>
          <div className="hidden md:flex gap-2 ml-2">
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-800 border-indigo-200 py-1.5 px-3 whitespace-nowrap"
            >
              <LinkIcon className="w-3 h-3 mr-1.5" /> {stats.vinculadosCount} vinculados
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-800 border-blue-200 py-1.5 px-3 whitespace-nowrap"
            >
              <Unlock className="w-3 h-3 mr-1.5" /> {stats.soltosCount} soltos
            </Badge>
          </div>
          <Button
            onClick={() => setIndepModalOpen(true)}
            className="shrink-0 bg-emerald-600 hover:bg-emerald-700 ml-auto xl:ml-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Nova Captação
          </Button>
        </div>
      </div>

      <TabsContent value="performance" className="animate-fade-in-up mt-0 outline-none">
        <CaptadorPerformanceTab
          demands={demands}
          currentUser={currentUser}
          onViewDemands={() => setActiveTab('demandas')}
        />
      </TabsContent>

      <TabsContent value="demandas" className="animate-fade-in-up mt-0 space-y-6 outline-none">
        {quickCounts.awaiting > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center justify-between shadow-sm animate-pulse">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-orange-600" />
              <div>
                <p className="font-bold text-orange-900">
                  {quickCounts.awaiting} demandas aguardando resposta
                </p>
                <p className="text-sm text-orange-800/80">
                  Fique atento aos prazos para evitar perda de pontos e repasse automático.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-orange-100 text-orange-900 border-orange-300 hover:bg-orange-200"
              onClick={() => handleQuickFilterClick('awaiting')}
            >
              Ver Pendentes
            </Button>
          </div>
        )}

        <GamificationWidget currentUser={currentUser} />

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
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

        <div className="sticky top-0 z-30 pt-2 pb-2 bg-background/95 backdrop-blur -mx-4 px-4 sm:mx-0 sm:px-0 border-b border-border/50 mb-2">
          <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-2">
            {QUICK_FILTERS.map((opt) => {
              const isActive = quickFilter === opt.id
              const count = quickCounts[opt.id as keyof typeof quickCounts]
              return (
                <button
                  key={opt.id}
                  onClick={() => handleQuickFilterClick(opt.id)}
                  className={cn(
                    'flex flex-shrink-0 items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-200 text-sm border',
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold border-primary shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted font-medium border-border',
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-xs font-bold ml-1',
                      isActive ? 'bg-primary-foreground/20' : 'bg-muted-foreground/20',
                    )}
                  >
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/30 border border-border rounded-lg p-4 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-sm mb-2">
            <div className="text-sm font-semibold flex items-center gap-2 flex-wrap">
              <span className="whitespace-nowrap">📊 Demandas:</span>
              <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                {newDemands.length} novas
              </Badge>
              <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-200">
                {groupedDemands.length} agrupadas
              </Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-200">
                {oldDemands.length} antigas
              </Badge>
            </div>
            <div className="flex gap-2 w-full xl:w-auto overflow-x-auto pb-1 xl:pb-0 scrollbar-hide">
              <Button
                variant={viewMode === 'new' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('new')
                  setPage(1)
                }}
                className="shrink-0"
              >
                Mostrar apenas novas
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('grouped')
                  setPage(1)
                }}
                className="shrink-0"
              >
                Mostrar apenas agrupadas
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setViewMode('all')
                  setPage(1)
                }}
                className="shrink-0"
              >
                Mostrar tudo
              </Button>
            </div>
          </div>

          <div className="flex flex-col xl:flex-row gap-3 items-start xl:items-center justify-between bg-muted/50 p-3 rounded-lg border border-border/50">
            <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
              <Filter className="w-4 h-4 text-muted-foreground hidden xl:block" />
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters({ ...filters, type: v, page: 1 } as any)}
              >
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
                onValueChange={(v) => setFilters({ ...filters, status: v, page: 1 } as any)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Status</SelectItem>
                  <SelectItem value="Pendente">Aguardando</SelectItem>
                  <SelectItem value="Em Captação">Em Captação</SelectItem>
                  <SelectItem value="Captado sob demanda">Captados</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.timeframe}
                onValueChange={(v) => setFilters({ ...filters, timeframe: v, page: 1 } as any)}
              >
                <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Prazo / Urgência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Qualquer Prazo</SelectItem>
                  <SelectItem value="Urgente">Urgente</SelectItem>
                  <SelectItem value="Até 15 dias">Até 15 dias</SelectItem>
                  <SelectItem value="Até 30 dias">Até 30 dias</SelectItem>
                  <SelectItem value="Até 60 dias">Até 60 dias</SelectItem>
                  <SelectItem value="Até 90 dias ou +">Até 90 dias ou +</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 w-full xl:w-auto">
              <SortDesc className="w-4 h-4 text-muted-foreground hidden xl:block" />
              <Select
                value={filters.sort}
                onValueChange={(v) => setFilters({ ...filters, sort: v, page: 1 } as any)}
              >
                <SelectTrigger className="w-[160px] h-8 text-xs bg-background">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgency">Tempo Restante (SLA)</SelectItem>
                  <SelectItem value="time">Mais Recentes</SelectItem>
                  <SelectItem value="similar">Perfis Similares</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {groupingError ? (
            <div className="text-center p-12 bg-destructive/10 border rounded-xl border-dashed border-destructive">
              <h3 className="text-lg font-semibold text-destructive">Erro ao agrupar demandas</h3>
            </div>
          ) : allRenderItems.length === 0 ? (
            <div className="text-center p-12 bg-background border rounded-xl border-dashed flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <PackageSearch className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">Nenhuma demanda no momento</h3>
              <p className="text-muted-foreground">Nenhuma demanda no momento. Volte mais tarde!</p>
              {(filters.type !== 'all' ||
                filters.status !== 'all' ||
                filters.timeframe !== 'all' ||
                quickFilter !== 'all') && (
                <Button
                  variant="link"
                  onClick={() => {
                    setFilters({ type: 'all', status: 'all', timeframe: 'all', sort: 'urgency' })
                    handleQuickFilterClick('all')
                  }}
                  className="mt-2"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedItems.map((entry, idx) => {
                  if (entry.type === 'group') {
                    return (
                      <GroupedDemandCard
                        key={`group-${entry.item.id}`}
                        group={entry.item}
                        onAction={(id, type) =>
                          setModal({
                            isOpen: true,
                            demand: demands.find((d) => d.id === id) || null,
                            type,
                          })
                        }
                      />
                    )
                  }
                  const d = entry.item
                  return (
                    <DemandCard
                      key={d.id}
                      demand={d}
                      isNewDemand={entry.type === 'new'}
                      showActions={d.status === 'Pendente' || d.status === 'Em Captação'}
                      onAction={(id, type) => setModal({ isOpen: true, demand: d, type })}
                    />
                  )
                })}
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
      </TabsContent>

      <DemandActionModal
        isOpen={modal.isOpen}
        demand={modal.demand}
        actionType={modal.type}
        onClose={() => setModal({ isOpen: false, demand: null, type: null })}
        onConfirm={handleAction}
      />
      <IndependentCaptureModal isOpen={indepModalOpen} onClose={() => setIndepModalOpen(false)} />
    </Tabs>
  )
}
