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
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { MetricsGrid } from '@/components/dashboard/MetricsGrid'
import { GestorCharts } from '@/components/dashboard/GestorCharts'
import { PerformanceTable } from '@/components/dashboard/PerformanceTable'
import { RankingCards } from '@/components/dashboard/RankingCards'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'

export function GestorDashboard() {
  const { currentUser, demands, users } = useAppStore()
  const { toast } = useToast()

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
  }, [period, selectedUser])

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
      <div className="flex h-[calc(100vh-200px)] items-center justify-center p-[16px]">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>Você não tem permissão para acessar este recurso.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="flex flex-col space-y-[24px] pb-[24px] animate-fade-in-up">
      <div className="flex flex-col gap-[12px] md:flex-row md:items-end justify-between">
        <div>
          <h1 className="text-[16px] font-bold leading-[24px] hidden md:block">
            Dashboard Gerencial
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-[12px]">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-[44px] min-h-[44px] bg-background sm:w-[150px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana</SelectItem>
              <SelectItem value="month">Mês</SelectItem>
              <SelectItem value="year">Ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="h-[44px] min-h-[44px] bg-background sm:w-[200px]">
              <SelectValue placeholder="SDR/Corretor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {users
                .filter((u) => u.role === 'sdr' || u.role === 'corretor')
                .map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={handleRefresh}
            className="h-[44px] min-h-[44px] min-w-[44px] sm:w-auto w-full gap-2"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn('w-[20px] h-[20px]', isRefreshing && 'animate-spin')} />
            Atualizar
          </Button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="flex flex-col gap-[12px]">
          {alerts.map((alert, i) => (
            <div
              key={i}
              className={cn(
                'flex items-center h-[80px] p-[16px] rounded-lg border',
                alert.type === 'critical'
                  ? 'bg-red-50/50 border-red-200 text-red-900'
                  : 'bg-yellow-50/50 border-yellow-200 text-yellow-900',
              )}
            >
              <div className="mr-4">
                {alert.type === 'critical' ? (
                  <AlertCircle className="w-[24px] h-[24px] text-red-600" />
                ) : (
                  <AlertTriangle className="w-[24px] h-[24px] text-yellow-600" />
                )}
              </div>
              <div>
                <p className="text-[14px] font-bold leading-[20px]">{alert.title}</p>
                <p className="text-[12px] opacity-90 leading-[16px]">{alert.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {fetchError ? (
        <Alert variant="destructive">
          <AlertCircle className="h-[24px] w-[24px]" />
          <AlertTitle className="text-[14px] font-bold">
            Erro ao carregar dashboard. Tente novamente
          </AlertTitle>
        </Alert>
      ) : isLoading || isRefreshing ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="w-[32px] h-[32px] animate-spin text-muted-foreground" />
          <p className="text-[14px] text-muted-foreground">Carregando métricas...</p>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="min-h-[200px] flex flex-col items-center justify-center border border-dashed rounded-lg bg-muted/10 p-[24px]">
          <p className="text-muted-foreground text-[14px] font-medium">
            Nenhum dado disponível para este período
          </p>
        </div>
      ) : (
        <div className="space-y-[24px]">
          <MetricsGrid current={filteredDemands} previous={prevDemands} period={period} />
          <GestorCharts demands={filteredDemands} />
          <PerformanceTable demands={filteredDemands} users={users} />
          <RankingCards users={users} />
        </div>
      )}
    </div>
  )
}
