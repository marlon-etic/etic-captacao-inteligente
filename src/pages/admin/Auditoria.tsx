import { useState, useEffect, useMemo } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { DatePicker } from '@/components/ui/date-picker'
import { Shield, Search, Filter, Activity, Users } from 'lucide-react'
import useAppStore from '@/stores/useAppStore'

export function Auditoria() {
  const { currentUser, authAuditLogs, adminAuditLogs, logAuthEvent } = useAppStore()

  const [activeTab, setActiveTab] = useState('auth')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [startDate, setStartDate] = useState<Date | undefined>(undefined)
  const [endDate, setEndDate] = useState<Date | undefined>(undefined)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      logAuthEvent('Acesso não autorizado', 'bloqueado', '/app/auditoria')
    }
  }, [currentUser, logAuthEvent])

  const filteredAuthLogs = useMemo(() => {
    return authAuditLogs.filter((log) => {
      if (filterStatus !== 'todos' && log.status !== filterStatus) return false
      if (search) {
        const term = search.toLowerCase()
        if (!log.userEmail?.toLowerCase().includes(term) && !log.event.toLowerCase().includes(term))
          return false
      }
      const logDate = new Date(log.timestamp).getTime()
      if (startDate && logDate < startDate.getTime()) return false
      if (endDate && logDate > endDate.getTime() + 86399999) return false
      return true
    })
  }, [authAuditLogs, filterStatus, search, startDate, endDate])

  const filteredAdminLogs = useMemo(() => {
    return adminAuditLogs.filter((log) => {
      if (filterStatus !== 'todos' && log.status !== filterStatus) return false
      if (search) {
        const term = search.toLowerCase()
        if (
          !log.acao.toLowerCase().includes(term) &&
          !log.usuario_afetado_id.toLowerCase().includes(term)
        )
          return false
      }
      const logDate = new Date(log.data_operacao).getTime()
      if (startDate && logDate < startDate.getTime()) return false
      if (endDate && logDate > endDate.getTime() + 86399999) return false
      return true
    })
  }, [adminAuditLogs, filterStatus, search, startDate, endDate])

  if (currentUser?.role !== 'admin') {
    return <Navigate to="/app" replace />
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 animate-fade-in-up">
      <div className="flex flex-col gap-2 border-b border-[#2E5F8A]/20 pb-4">
        <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] flex items-center gap-3">
          <Shield className="w-8 h-8 text-[#2E5F8A]" />
          Auditoria de Sistema
        </h1>
        <p className="text-[14px] text-[#999999] font-medium">
          Acompanhe acessos, ações administrativas e atividade de segurança.
        </p>
      </div>

      <Card className="border-0 shadow-md">
        <CardHeader className="bg-muted/10 border-b space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Histórico e Logs</CardTitle>
              <CardDescription>Filtre os registros para análise aprofundada.</CardDescription>
            </div>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="auth" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Acessos
                </TabsTrigger>
                <TabsTrigger value="admin" className="flex items-center gap-2">
                  <Users className="w-4 h-4" /> Gestão de Usuários
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar registros..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos Status</SelectItem>
                  <SelectItem value="sucesso">Sucesso</SelectItem>
                  {activeTab === 'auth' && <SelectItem value="bloqueado">Bloqueado</SelectItem>}
                  <SelectItem value="erro">Erro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <DatePicker date={startDate} setDate={setStartDate} placeholder="Data Início" />
            </div>
            <div>
              <DatePicker date={endDate} setDate={setEndDate} placeholder="Data Fim" />
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Tabs value={activeTab}>
            <TabsContent value="auth" className="m-0 border-none outline-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data / Hora</TableHead>
                      <TableHead>Email do Usuário</TableHead>
                      <TableHead>Evento / Caminho</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>IP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAuthLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          Nenhum registro de acesso encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAuthLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-xs">
                            {new Date(log.timestamp).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-sm font-semibold">{log.userEmail}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-bold text-sm">{log.event}</span>
                              {log.path && (
                                <span className="text-xs text-muted-foreground font-mono mt-0.5">
                                  {log.path}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                log.status === 'sucesso'
                                  ? 'secondary'
                                  : log.status === 'bloqueado'
                                    ? 'destructive'
                                    : 'default'
                              }
                              className={
                                log.status === 'sucesso'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : log.status === 'erro'
                                    ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                                    : ''
                              }
                            >
                              {log.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-mono">
                            {log.ip || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="admin" className="m-0 border-none outline-none">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Data / Hora</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Admin (Executor)</TableHead>
                      <TableHead>Usuário Afetado</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes do Erro</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAdminLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          Nenhum registro de ação administrativa encontrado.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredAdminLogs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-xs">
                            {new Date(log.data_operacao).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-sm font-bold text-[#1A3A52]">
                            {log.acao}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {log.admin_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell className="text-xs font-mono text-muted-foreground">
                            {log.usuario_afetado_id.substring(0, 8)}...
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={log.status === 'sucesso' ? 'secondary' : 'destructive'}
                              className={
                                log.status === 'sucesso'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : ''
                              }
                            >
                              {log.status.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell
                            className="text-xs text-red-500 max-w-[200px] truncate"
                            title={log.erro_detalhes}
                          >
                            {log.erro_detalhes || '-'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
