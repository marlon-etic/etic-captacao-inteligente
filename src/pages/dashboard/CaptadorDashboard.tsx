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
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="space-y-4 md:space-y-6 lg:space-y-8 relative"
    >
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 md:gap-6 lg:gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-[16px] md:text-[18px] lg:text-[20px] leading-[24px] md:leading-[28px] lg:leading-[30px] font-bold tracking-tight">
            Painel de Captação
          </h1>
          <p className="text-muted-foreground text-[14px]">
            Gerencie demandas e acompanhe seu desempenho gamificado.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start lg:items-center w-full lg:w-auto">
          <div className="flex w-full overflow-x-auto scrollbar-hide">
            <TabsList className="flex h-auto bg-transparent border-b border-border p-0 min-w-full justify-start gap-4 md:gap-6 lg:gap-8">
              <TabsTrigger
                value="performance"
                className="h-[48px] lg:h-[44px] px-4 text-[14px] font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap min-w-[44px]"
              >
                Minha Performance
              </TabsTrigger>
              <TabsTrigger
                value="demandas"
                className="h-[48px] lg:h-[44px] px-4 text-[14px] font-medium rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none whitespace-nowrap min-w-[44px] relative"
              >
                Demandas Ativas
                {quickCounts.awaiting > 0 && (
                  <span className="absolute top-2 right-0 bg-red-500 text-white text-[10px] min-w-[20px] min-h-[20px] flex items-center justify-center rounded-full px-1">
                    {quickCounts.awaiting}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <Button
            onClick={() => setIndepModalOpen(true)}
            className="h-[48px] w-full md:h-[44px] md:w-[200px] lg:h-[40px] lg:w-[200px] bg-emerald-600 hover:bg-emerald-700 mt-4 lg:mt-0 lg:ml-8 self-start shrink-0 text-[14px] font-bold"
          >
            <Plus className="w-5 h-5 md:w-4 md:h-4 mr-2" /> Nova Captação
          </Button>

          <div className="hidden lg:flex gap-4 lg:ml-6 items-center">
            <Badge
              variant="outline"
              className="bg-indigo-50 text-indigo-800 border-indigo-200 py-2 px-4 whitespace-nowrap min-h-[44px] flex items-center gap-2 text-[14px]"
            >
              <LinkIcon className="w-4 h-4" /> {stats.vinculadosCount} vinculados
            </Badge>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-800 border-blue-200 py-2 px-4 whitespace-nowrap min-h-[44px] flex items-center gap-2 text-[14px]"
            >
              <Unlock className="w-4 h-4" /> {stats.soltosCount} soltos
            </Badge>
          </div>
        </div>
      </div>

      <TabsContent value="performance" className="animate-fade-in-up mt-0 outline-none">
        <CaptadorPerformanceTab
          demands={demands}
          currentUser={currentUser}
          onViewDemands={() => setActiveTab('demandas')}
        />
      </TabsContent>

      <TabsContent
        value="demandas"
        className="animate-fade-in-up mt-0 space-y-4 md:space-y-6 lg:space-y-8 outline-none"
      >
        {quickCounts.awaiting > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm animate-pulse">
            <div className="flex items-center gap-4">
              <AlertCircle className="w-8 h-8 text-orange-600 shrink-0" />
              <div>
                <p className="font-bold text-[16px] text-orange-900">
                  {quickCounts.awaiting} demandas aguardando resposta
                </p>
                <p className="text-[14px] text-orange-800/80">
                  Fique atento aos prazos para evitar perda de pontos e repasse automático.
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="bg-orange-100 text-orange-900 border-orange-300 hover:bg-orange-200 min-h-[44px] w-full md:w-auto text-[14px]"
              onClick={() => handleQuickFilterClick('awaiting')}
            >
              Ver Pendentes
            </Button>
          </div>
        )}

        <GamificationWidget currentUser={currentUser} />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
          {statCards.map((s, i) => (
            <Card
              key={i}
              className="border-0 shadow-sm min-h-[100px] md:min-h-[120px] lg:min-h-[140px] flex items-center justify-center p-4 lg:p-5"
            >
              <CardContent className="p-0 flex items-center justify-start text-left gap-4 w-full">
                <div className={`p-3 md:p-4 rounded-full ${s.b}`}>
                  <s.i className={`w-6 h-6 md:w-8 md:h-8 ${s.c}`} />
                </div>
                <div>
                  <p className="text-[24px] md:text-[28px] lg:text-[32px] font-bold leading-none mb-1 md:mb-2">
                    {s.v}
                  </p>
                  <p className="text-[12px] md:text-[14px] font-medium text-muted-foreground uppercase tracking-wider leading-tight">
                    {s.t}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="sticky top-0 z-30 pt-4 pb-4 bg-background/95 backdrop-blur -mx-4 px-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8 border-b border-border/50 mb-4">
          <div className="flex gap-4 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {QUICK_FILTERS.map((opt) => {
              const isActive = quickFilter === opt.id
              const count = quickCounts[opt.id as keyof typeof quickCounts]
              return (
                <button
                  key={opt.id}
                  onClick={() => handleQuickFilterClick(opt.id)}
                  className={cn(
                    'flex flex-shrink-0 items-center gap-2 px-4 min-h-[44px] rounded-full whitespace-nowrap transition-all duration-200 text-[14px] border',
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold border-primary shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted font-medium border-border',
                  )}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded-full text-[12px] font-bold ml-1 min-h-[24px] flex items-center',
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

        <div className="space-y-4 md:space-y-6 lg:space-y-8">
          <div className="bg-muted/30 border border-border rounded-lg p-4 md:p-6 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 shadow-sm mb-2">
            <div className="text-[14px] font-semibold flex items-center gap-4 flex-wrap">
              <span className="whitespace-nowrap min-h-[32px] flex items-center">📊 Demandas:</span>
              <Badge
                variant="secondary"
                className="bg-green-100 text-green-800 border-green-200 min-h-[32px] px-3"
              >
                {newDemands.length} novas
              </Badge>
              <Badge
                variant="secondary"
                className="bg-red-100 text-red-800 border-red-200 min-h-[32px] px-3"
              >
                {groupedDemands.length} agrupadas
              </Badge>
              <Badge
                variant="secondary"
                className="bg-gray-100 text-gray-800 border-gray-200 min-h-[32px] px-3"
              >
                {oldDemands.length} antigas
              </Badge>
            </div>
            <div className="flex gap-4 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0 scrollbar-hide">
              <Button
                variant={viewMode === 'new' ? 'default' : 'outline'}
                onClick={() => {
                  setViewMode('new')
                  setPage(1)
                }}
                className="shrink-0 min-h-[44px] text-[14px]"
              >
                Apenas novas
              </Button>
              <Button
                variant={viewMode === 'grouped' ? 'default' : 'outline'}
                onClick={() => {
                  setViewMode('grouped')
                  setPage(1)
                }}
                className="shrink-0 min-h-[44px] text-[14px]"
              >
                Apenas agrupadas
              </Button>
              <Button
                variant={viewMode === 'all' ? 'default' : 'outline'}
                onClick={() => {
                  setViewMode('all')
                  setPage(1)
                }}
                className="shrink-0 min-h-[44px] text-[14px]"
              >
                Mostrar tudo
              </Button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-muted/50 p-4 md:p-6 rounded-lg border border-border/50">
            <div className="flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4 w-full lg:w-auto">
              <Filter className="w-5 h-5 text-muted-foreground hidden sm:block" />
              <Select
                value={filters.type}
                onValueChange={(v) => setFilters({ ...filters, type: v, page: 1 } as any)}
              >
                <SelectTrigger className="w-full sm:w-[140px] min-h-[44px] text-[14px] bg-background">
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
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] text-[14px] bg-background">
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
                <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] text-[14px] bg-background">
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
            <div className="flex items-center gap-4 w-full lg:w-auto mt-4 lg:mt-0">
              <SortDesc className="w-5 h-5 text-muted-foreground hidden lg:block" />
              <Select
                value={filters.sort}
                onValueChange={(v) => setFilters({ ...filters, sort: v, page: 1 } as any)}
              >
                <SelectTrigger className="w-full lg:w-[180px] min-h-[44px] text-[14px] bg-background">
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
            <div className="text-center p-8 md:p-12 bg-destructive/10 border rounded-xl border-dashed border-destructive">
              <h3 className="text-[18px] font-semibold text-destructive">
                Erro ao agrupar demandas
              </h3>
            </div>
          ) : allRenderItems.length === 0 ? (
            <div className="text-center p-8 md:p-12 bg-background border rounded-xl border-dashed flex flex-col items-center">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <PackageSearch className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-[18px] font-semibold mb-2">Nenhuma demanda no momento</h3>
              <p className="text-[14px] text-muted-foreground">
                Nenhuma demanda no momento. Volte mais tarde!
              </p>
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
                  className="mt-4 min-h-[44px] text-[14px]"
                >
                  Limpar filtros
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:gap-6 lg:gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {paginatedItems.map((entry) => {
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
                <div className="pt-6 flex justify-center">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          onClick={() => setPage((p) => Math.max(1, p - 1))}
                          disabled={page === 1}
                          className="gap-2 min-h-[44px] text-[14px]"
                        >
                          <ChevronLeft className="h-5 w-5" /> Anterior
                        </Button>
                      </PaginationItem>
                      <div className="flex items-center px-6 text-[14px] font-medium">
                        Página {page} de {totalPages}
                      </div>
                      <PaginationItem>
                        <Button
                          variant="ghost"
                          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                          disabled={page === totalPages}
                          className="gap-2 min-h-[44px] text-[14px]"
                        >
                          Próxima <ChevronRight className="h-5 w-5" />
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
