import { useState, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import useAppStore from '@/stores/useAppStore'
import { Users, Target, CheckCircle2, Calendar } from 'lucide-react'
import { Demand } from '@/types'

const getMetrics = (demand: Demand) => {
  const props = demand.capturedProperties || []
  const total = props.length
  const visitas = props.filter((p) => !!p.visitaDate).length
  const fechados = props.filter((p) => !!p.fechamentoDate).length
  const rate = total > 0 ? Math.round((fechados / total) * 100) : 0

  return { total, visitas, fechados, rate }
}

export function AnalyticsDashboard() {
  const { demands, users, currentUser } = useAppStore()
  const [selectedUser, setSelectedUser] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [type, setType] = useState('all')

  const filterUsers = useMemo(
    () => users.filter((u) => u.role === 'sdr' || u.role === 'corretor'),
    [users],
  )

  const filteredDemands = useMemo(() => {
    return demands
      .filter((d) => {
        if (selectedUser !== 'all' && d.createdBy !== selectedUser && d.assignedTo !== selectedUser)
          return false
        if (type !== 'all' && d.type !== type) return false

        if (dateRange !== 'all') {
          const dDate = new Date(d.createdAt).getTime()
          const now = Date.now()
          if (dateRange === '7d' && now - dDate > 7 * 86400000) return false
          if (dateRange === '30d' && now - dDate > 30 * 86400000) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [demands, selectedUser, dateRange, type])

  const globalMetrics = useMemo(() => {
    let total = 0,
      visitas = 0,
      fechados = 0
    filteredDemands.forEach((d) => {
      const m = getMetrics(d)
      total += m.total
      visitas += m.visitas
      fechados += m.fechados
    })
    return { total, visitas, fechados, rate: total > 0 ? Math.round((fechados / total) * 100) : 0 }
  }, [filteredDemands])

  if (currentUser?.role !== 'gestor' && currentUser?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="space-y-6 pb-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics de Conversão</h1>
          <p className="text-muted-foreground text-sm">
            Acompanhe o funil de captação e conversão de demandas.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[160px] bg-background">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos SDRs</SelectItem>
              {filterUsers.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todo o período</SelectItem>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="w-[140px] bg-background">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="Venda">Vendas</SelectItem>
              <SelectItem value="Aluguel">Locação</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm ring-1 ring-border/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Demandas Ativas</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredDemands.length}</div>
            <p className="text-xs text-muted-foreground">No período selecionado</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/50 bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-900">Total Capturado</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{globalMetrics.total}</div>
            <p className="text-xs text-blue-600/70">Imóveis vinculados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/50 bg-orange-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-orange-900">Visitas Agendadas</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{globalMetrics.visitas}</div>
            <p className="text-xs text-orange-600/70">Imóveis com visita</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm ring-1 ring-border/50 bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-emerald-900">
              Negócios Fechados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700">{globalMetrics.fechados}</div>
            <div className="mt-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-200/50 px-2 py-0.5 rounded-full">
                {globalMetrics.rate}% conversão
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Performance por Demanda</CardTitle>
          <CardDescription>
            Métricas detalhadas do funil de conversão para cada demanda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente / Demanda</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Capturados</TableHead>
                <TableHead className="text-center">Visitas</TableHead>
                <TableHead className="text-center">Fechados</TableHead>
                <TableHead className="w-[150px]">Conversão</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDemands.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Nenhuma demanda encontrada para os filtros aplicados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredDemands.map((d) => {
                  const m = getMetrics(d)

                  return (
                    <TableRow key={d.id}>
                      <TableCell>
                        <p className="font-semibold">{d.clientName}</p>
                        <p className="text-xs text-muted-foreground">
                          {d.location} • {d.type}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            d.status === 'Negócio'
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : d.status === 'Perdida'
                                ? 'bg-red-100 text-red-800 border-red-300'
                                : ''
                          }
                        >
                          {d.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700">
                          {m.total}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-700">
                          {m.visitas}
                        </span>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                          {m.fechados}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={m.rate} className="h-2 flex-1" />
                          <span className="text-xs font-semibold w-9 text-right">
                            {m.total === 0 ? 'N/A' : `${m.rate}%`}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
