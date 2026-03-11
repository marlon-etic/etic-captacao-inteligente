import { useState, useEffect, useMemo } from 'react'
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react'
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
    const list = [...demands]
    const hasLost = list.some((d) => d.status === 'Perdida')
    const now = new Date().toISOString()

    if (!hasLost && list.length > 0) {
      list.push(
        {
          ...list[0],
          id: 'mock1',
          status: 'Perdida',
          lostReason: 'Cliente desistiu',
          createdAt: now,
          assignedTo: '1',
        },
        {
          ...list[0],
          id: 'mock2',
          status: 'Perdida',
          lostReason: 'Já comprou',
          createdAt: now,
          assignedTo: '2',
        },
        {
          ...list[0],
          id: 'mock3',
          status: 'Perdida',
          lostReason: 'Achou caro',
          createdAt: now,
          assignedTo: '1',
        },
        { ...list[0], id: 'mock4', status: 'Negócio', createdAt: now, assignedTo: '2' },
        { ...list[0], id: 'mock5', status: 'Captado sob demanda', createdAt: now, assignedTo: '1' },
      )
    }
    return list
  }, [demands])

  const { filteredDemands, prevDemands } = useMemo(() => {
    let current = enhancedDemands
    let prev = enhancedDemands
    const now = new Date()

    if (period === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - now.getDay())
      current = current.filter((d) => new Date(d.createdAt) >= start)
      const prevStart = new Date(start)
      prevStart.setDate(start.getDate() - 7)
      prev = prev.filter((d) => new Date(d.createdAt) >= prevStart && new Date(d.createdAt) < start)
    } else if (period === 'month') {
      current = current.filter(
        (d) =>
          new Date(d.createdAt).getMonth() === now.getMonth() &&
          new Date(d.createdAt).getFullYear() === now.getFullYear(),
      )
      const prevM = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const prevY = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      prev = prev.filter(
        (d) =>
          new Date(d.createdAt).getMonth() === prevM &&
          new Date(d.createdAt).getFullYear() === prevY,
      )
    } else if (period === 'year') {
      current = current.filter((d) => new Date(d.createdAt).getFullYear() === now.getFullYear())
      prev = prev.filter((d) => new Date(d.createdAt).getFullYear() === now.getFullYear() - 1)
    }

    const applyFilters = (list: Demand[]) =>
      list.filter((d) => {
        const userMatch =
          selectedUser === 'all' || d.assignedTo === selectedUser || d.createdBy === selectedUser
        let statusMatch = true
        if (status !== 'all') {
          if (status === 'em_andamento')
            statusMatch = ['Pendente', 'Em Captação', 'Aguardando'].includes(d.status)
          else if (status === 'captado')
            statusMatch = ['Captado sob demanda', 'Captado independente'].includes(d.status)
          else if (status === 'perdido') statusMatch = ['Perdida', 'Impossível'].includes(d.status)
          else statusMatch = d.status === status
        }
        return userMatch && statusMatch
      })

    return { filteredDemands: applyFilters(current), prevDemands: applyFilters(prev) }
  }, [enhancedDemands, period, selectedUser, status])

  useEffect(() => {
    setIsLoading(true)
    setError(false)
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [period, selectedUser, status])

  const handleExport = (format: string) => {
    toast({
      title: 'Exportação Iniciada',
      description: `Gerando relatório de performance em ${format}...`,
    })
  }

  if (currentUser?.role !== 'gestor' && currentUser?.role !== 'admin') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertTitle>Acesso Negado</AlertTitle>
          <AlertDescription>
            Você não tem permissão para visualizar o dashboard gerencial.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Visão Gerencial</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Monitore a eficiência da equipe, funil de conversão e gargalos operacionais em tempo
            real.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="year">Este Ano</SelectItem>
              <SelectItem value="all">Todo Período</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
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

          <div className="flex gap-2 ml-auto lg:ml-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('PDF')}
              className="gap-2"
            >
              <FileText className="h-4 w-4" /> <span className="hidden sm:inline">PDF</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('Excel')}
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
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>Erro ao carregar dashboard. Tente novamente.</AlertDescription>
        </Alert>
      ) : isLoading ? (
        <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando métricas gerenciais...</p>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center border border-dashed rounded-lg bg-muted/10">
          <p className="text-muted-foreground text-lg">Nenhum dado disponível para este período</p>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          <MetricsGrid current={filteredDemands} previous={prevDemands} period={period} />
          <GestorCharts demands={filteredDemands} />
          <RankingTable users={users} demands={filteredDemands} />
        </div>
      )}
    </div>
  )
}
