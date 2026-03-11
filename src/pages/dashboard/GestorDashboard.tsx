import { useState, useEffect, useMemo } from 'react'
import { Download, FileText, Loader2, AlertCircle, AlertTriangle } from 'lucide-react'
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
import { RankingTable } from '@/components/dashboard/RankingTable'
import { Demand } from '@/types'

export function GestorDashboard() {
  const { currentUser, demands, users } = useAppStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [period, setPeriod] = useState('month')
  const [selectedUser, setSelectedUser] = useState('all')
  const [status, setStatus] = useState('all')

  const enhancedDemands = useMemo(() => {
    if (demands.some((d) => d.status === 'Perdida') || demands.length === 0) return demands
    const now = new Date().toISOString()
    const past = new Date(Date.now() - 72 * 3600000).toISOString()
    const base = demands[0]
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
      if (status !== 'all') {
        const sm: Record<string, string[]> = {
          em_andamento: ['Pendente', 'Em Captação', 'Aguardando'],
          captado: ['Captado sob demanda', 'Captado independente'],
          perdido: ['Perdida', 'Impossível'],
        }
        if (sm[status] ? !sm[status].includes(d.status) : d.status !== status) return false
      }
      return true
    }

    return {
      filteredDemands: enhancedDemands.filter((d) => filterFn(d, curr)),
      prevDemands: enhancedDemands.filter((d) => filterFn(d, prev)),
    }
  }, [enhancedDemands, period, selectedUser, status])

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

  useEffect(() => {
    setIsLoading(true)
    setError(false)
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [period, selectedUser, status])

  if (currentUser?.role !== 'gestor' && currentUser?.role !== 'admin') {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acesso negado</AlertTitle>
          <AlertDescription>Você não tem permissão para acessar este recurso.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Visão Gerencial</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Monitore a eficiência da equipe, funil de conversão e gargalos operacionais em tempo
            real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="all">Todo Período</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Membro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Membros</SelectItem>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos Status</SelectItem>
              <SelectItem value="em_andamento">Em Andamento</SelectItem>
              <SelectItem value="captado">Captados</SelectItem>
              <SelectItem value="visita">Visitas</SelectItem>
              <SelectItem value="negocio">Negócios</SelectItem>
              <SelectItem value="perdido">Perdidos</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2 ml-auto xl:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  title: 'Exportação',
                  description: `Gerando PDF com ${filteredDemands.length} registros...`,
                })
              }
              className="gap-2"
            >
              <FileText className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                toast({
                  title: 'Exportação',
                  description: `Gerando Excel com ${filteredDemands.length} registros...`,
                })
              }
              className="gap-2"
            >
              <Download className="h-4 w-4" /> <span className="hidden sm:inline">Excel</span>
            </Button>
          </div>
        </div>
      </div>

      {error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar dashboard</AlertTitle>
          <AlertDescription>Ocorreu um erro ao buscar os dados. Tente novamente.</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando métricas gerenciais...</p>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center border border-dashed rounded-lg bg-muted/10">
          <p className="text-muted-foreground text-lg">Nenhum dado disponível</p>
        </div>
      ) : (
        <div className="animate-fade-in-up space-y-6">
          {bottlenecks > 0 && (
            <Alert className="bg-amber-500/15 text-amber-600 dark:text-amber-500 border-amber-500/30">
              <AlertTriangle className="h-4 w-4 !text-amber-600 dark:!text-amber-500" />
              <AlertTitle className="font-semibold">Atenção a Gargalos Operacionais</AlertTitle>
              <AlertDescription>
                Existem <strong>{bottlenecks}</strong> demandas pendentes, aguardando ou em captação
                há mais de 48h. Verifique a equipe.
              </AlertDescription>
            </Alert>
          )}
          <MetricsGrid current={filteredDemands} previous={prevDemands} period={period} />
          <GestorCharts demands={filteredDemands} />
          <RankingTable users={users} demands={filteredDemands} />
        </div>
      )}
    </div>
  )
}
