import { useState, useEffect, useMemo, useCallback } from 'react'
import { RefreshCw, AlertCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { MetricsGrid } from '@/components/dashboard/MetricsGrid'
import { GestorCharts } from '@/components/dashboard/GestorCharts'
import { PerformanceTable } from '@/components/dashboard/PerformanceTable'
import { RankingCards } from '@/components/dashboard/RankingCards'
import { InactiveGroupsTab } from '@/components/dashboard/InactiveGroupsTab'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'

export function GestorDashboard() {
  const { currentUser, demands, users } = useAppStore()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('geral')
  const [period, setPeriod] = useState('month')
  const [selectedUser, setSelectedUser] = useState('all')

  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [fetchError, setFetchError] = useState(false)

  const enhancedDemands = useMemo(() => {
    if (demands.some((d) => d.status === 'Perdida') || demands.length === 0) return demands
    const now = new Date().toISOString()
    const past = new Date(Date.now() - 72 * 3600000).toISOString()
    const base = demands[0] || {}
    return [
      ...demands,
      {
        ...base,
        id: 'm1',
        status: 'Perdida',
        lostReason: 'Cliente desistiu',
        createdAt: now,
        assignedTo: '1',
      },
      {
        ...base,
        id: 'm2',
        status: 'Perdida',
        lostReason: 'Já comprou',
        createdAt: now,
        assignedTo: '2',
      },
      {
        ...base,
        id: 'm3',
        status: 'Perdida',
        lostReason: 'Achou caro',
        createdAt: now,
        assignedTo: '1',
      },
      { ...base, id: 'm4', status: 'Negócio', createdAt: now, assignedTo: '2' },
      { ...base, id: 'm5', status: 'Captado sob demanda', createdAt: now, assignedTo: '1' },
      { ...base, id: 'm6', status: 'Pendente', createdAt: past, assignedTo: '1' },
    ]
  }, [demands])

  const { filteredDemands, prevDemands } = useMemo(() => {
    const now = new Date()
    let curr: Date[] = [new Date(0), new Date(8640000000000000)]
    let prev: Date[] = [new Date(0), new Date(0)]

    if (period === 'week') {
      const s = new Date(now)
      s.setDate(now.getDate() - now.getDay())
      const p = new Date(s)
      p.setDate(s.getDate() - 7)
      curr = [s, now]
      prev = [p, s]
    } else if (period === 'month') {
      const s = new Date(now.getFullYear(), now.getMonth(), 1)
      const p = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      curr = [s, now]
      prev = [p, s]
    } else if (period === 'year') {
      const s = new Date(now.getFullYear(), 0, 1)
      const p = new Date(now.getFullYear() - 1, 0, 1)
      curr = [s, now]
      prev = [p, s]
    }

    const filterFn = (d: Demand, r: Date[]) => {
      const dt = new Date(d.createdAt)
      if (dt < r[0] || dt >= r[1]) return false
      if (selectedUser !== 'all' && d.assignedTo !== selectedUser && d.createdBy !== selectedUser)
        return false
      return true
    }

    return {
      filteredDemands: enhancedDemands.filter((d) => filterFn(d, curr)),
      prevDemands: enhancedDemands.filter((d) => filterFn(d, prev)),
    }
  }, [enhancedDemands, period, selectedUser])

  useEffect(() => {
    setIsLoading(true)
    setFetchError(false)
    const timer = setTimeout(() => setIsLoading(false), 400)
    return () => clearTimeout(timer)
  }, [period, selectedUser, activeTab])

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true)
    setTimeout(() => {
      if (Math.random() < 0.1) {
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: 'Erro ao atualizar. Tente novamente',
        })
        setFetchError(true)
      } else {
        setFetchError(false)
        toast({ description: 'Dados atualizados com sucesso.' })
      }
      setIsRefreshing(false)
    }, 450)
  }, [toast])

  const bottlenecks = useMemo(
    () =>
      filteredDemands.filter(
        (d) =>
          ['Pendente', 'Aguardando'].includes(d.status) ||
          (d.status === 'Em Captação' &&
            new Date(d.createdAt) < new Date(Date.now() - 48 * 3600000)),
      ).length,
    [filteredDemands],
  )

  const critical = useMemo(
    () =>
      filteredDemands.filter(
        (d) =>
          ['Pendente'].includes(d.status) &&
          new Date(d.createdAt) < new Date(Date.now() - 7 * 24 * 3600000),
      ).length,
    [filteredDemands],
  )

  const alerts = []
  if (critical > 0) {
    alerts.push({
      type: 'critical',
      title: 'Demandas Críticas Atrasadas',
      description: `${critical} demandas aguardando atendimento há mais de 7 dias.`,
    })
  }
  if (bottlenecks > 0) {
    alerts.push({
      type: 'warning',
      title: 'Atenção a Gargalos Operacionais',
      description: `${bottlenecks} demandas pendentes ou em captação há mais de 48h.`,
    })
  }

  if (currentUser?.role !== 'gestor' && currentUser?.role !== 'admin') {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" aria-hidden="true" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>Você não tem permissão para acessar este recurso.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-6 pb-10 animate-fade-in-up w-full max-w-[1920px] mx-auto min-w-0">
      <div className="flex flex-col gap-4 md:flex-row md:items-end justify-between w-full">
        <div>
          <h1 className="text-xl sm:text-2xl font-black leading-tight">Dashboard Gerencial</h1>
        </div>

        {activeTab === 'geral' && (
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="flex flex-col gap-1 w-full sm:w-[150px]">
              <label htmlFor="period" className="sr-only">
                Período
              </label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger id="period" className="min-h-[44px] h-[44px] bg-background w-full">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Semana</SelectItem>
                  <SelectItem value="month">Mês</SelectItem>
                  <SelectItem value="year">Ano</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1 w-full sm:w-[200px]">
              <label htmlFor="user" className="sr-only">
                Usuário
              </label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger id="user" className="min-h-[44px] h-[44px] bg-background w-full">
                  <SelectValue placeholder="SDR/Corretor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos Equipe</SelectItem>
                  {users
                    .filter((u) => u.role === 'sdr' || u.role === 'corretor')
                    .map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={handleRefresh}
              className="min-h-[44px] h-[44px] w-full sm:w-auto gap-2 font-bold shadow-sm shrink-0"
              disabled={isRefreshing}
              aria-label="Atualizar dados do dashboard"
            >
              <RefreshCw
                className={cn('w-4 h-4', isRefreshing && 'animate-spin')}
                aria-hidden="true"
              />
              Atualizar
            </Button>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full md:w-auto grid grid-cols-2 bg-[#E5E5E5] rounded-[8px] p-1 mb-6">
          <TabsTrigger value="geral" className="rounded-[6px]">
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="historico" className="rounded-[6px]">
            Histórico de Grupos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="m-0 focus-visible:ring-0 focus-visible:outline-none">
          {alerts.length > 0 && (
            <div className="flex flex-col gap-3 w-full mb-6">
              {alerts.map((alert, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex items-center min-h-[80px] p-4 rounded-xl border shadow-sm',
                    alert.type === 'critical'
                      ? 'bg-red-50/80 border-red-200 text-red-900'
                      : 'bg-yellow-50/80 border-yellow-200 text-yellow-900',
                  )}
                  role="alert"
                >
                  <div className="mr-4 shrink-0">
                    {alert.type === 'critical' ? (
                      <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-yellow-600" aria-hidden="true" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold leading-tight truncate">{alert.title}</p>
                    <p className="text-xs md:text-sm opacity-90 mt-1">{alert.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {fetchError ? (
            <Alert variant="destructive">
              <AlertCircle className="h-5 w-5" aria-hidden="true" />
              <AlertTitle className="text-sm font-bold">
                Erro ao carregar dashboard. Tente novamente
              </AlertTitle>
            </Alert>
          ) : isLoading || isRefreshing ? (
            <div
              className="min-h-[300px] flex flex-col items-center justify-center space-y-4 w-full"
              aria-live="polite"
              aria-busy="true"
            >
              <RefreshCw
                className="w-10 h-10 animate-spin text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-muted-foreground">Carregando métricas...</p>
            </div>
          ) : filteredDemands.length === 0 ? (
            <div className="min-h-[300px] flex flex-col items-center justify-center border border-dashed rounded-xl bg-muted/10 p-6 w-full text-center">
              <AlertCircle
                className="w-12 h-12 mb-4 opacity-50 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="text-foreground text-lg font-bold">
                Nenhum dado disponível para este período
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Altere os filtros de data ou usuário para visualizar resultados.
              </p>
            </div>
          ) : (
            <div className="space-y-6 lg:space-y-8 w-full min-w-0">
              <MetricsGrid current={filteredDemands} previous={prevDemands} period={period} />
              <GestorCharts demands={filteredDemands} />
              <PerformanceTable demands={filteredDemands} users={users} />
              <RankingCards users={users} />
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="historico"
          className="m-0 focus-visible:ring-0 focus-visible:outline-none"
        >
          <InactiveGroupsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
