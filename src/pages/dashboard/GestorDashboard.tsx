import { useState, useEffect } from 'react'
import { Download, FileText, Loader2 } from 'lucide-react'
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
import { AlertsSection } from '@/components/dashboard/AlertsSection'
import { MetricsGrid } from '@/components/dashboard/MetricsGrid'
import { GestorCharts } from '@/components/dashboard/GestorCharts'
import { RankingTable } from '@/components/dashboard/RankingTable'

export function GestorDashboard() {
  const { currentUser, demands, users } = useAppStore()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState('month')
  const [type, setType] = useState('all')

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 800)
    return () => clearTimeout(timer)
  }, [period, type])

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

  const handleExport = (format: string) => {
    toast({
      title: 'Exportação Iniciada',
      description: `Gerando relatório de performance em ${format}...`,
    })
  }

  const filteredDemands = demands.filter((d) => type === 'all' || d.type.toLowerCase() === type)
  const abertas = filteredDemands.filter(
    (d) => d.status === 'Pendente' || d.status === 'Em Captação',
  ).length
  const captados = filteredDemands.filter(
    (d) => d.status.includes('Captado') || d.status === 'Negócio',
  ).length
  const taxaAtendimento =
    abertas + captados > 0 ? Math.round((captados / (abertas + captados)) * 100) : 0

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Visão Gerencial</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Monitore a eficiência da equipe, acompanhe métricas de conversão e identifique gargalos
            operacionais em tempo real.
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
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[130px] bg-background">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas Trans.</SelectItem>
              <SelectItem value="venda">Vendas</SelectItem>
              <SelectItem value="aluguel">Locação</SelectItem>
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

      {isLoading ? (
        <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Carregando métricas gerenciais...</p>
        </div>
      ) : (
        <div className="animate-fade-in-up">
          <AlertsSection />
          <MetricsGrid
            abertas={abertas}
            captados={captados}
            taxaAtendimento={taxaAtendimento}
            tempoMedio="4.2h"
            visitas={128}
            conversao={32}
          />
          <GestorCharts users={users} />
          <RankingTable users={users} />
        </div>
      )}
    </div>
  )
}
