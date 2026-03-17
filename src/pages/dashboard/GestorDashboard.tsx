import React, { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import useAppStore from '@/stores/useAppStore'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ShieldAlert, AlertTriangle, Info, ShieldCheck } from 'lucide-react'

export function GestorDashboard() {
  const { systemLogs, currentUser, logAuthEvent } = useAppStore()

  useEffect(() => {
    if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
      logAuthEvent('Acesso não autorizado', 'bloqueado', '/app/gestor-dashboard')
    }
  }, [currentUser, logAuthEvent])

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
    return <Navigate to="/app" replace />
  }

  const errorLogs = systemLogs.filter((l) => l.type === 'error')
  const warningLogs = systemLogs.filter((l) => l.type === 'warning')

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-primary flex items-center gap-3">
          <ShieldCheck className="w-8 h-8 text-emerald-600" />
          Painel Administrativo & Logs
        </h1>
        <p className="text-muted-foreground">
          Monitore o comportamento do sistema e erros reportados.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-destructive shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Total de Erros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-destructive">{errorLogs.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Avisos & Acessos Negados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-yellow-600">{warningLogs.length}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
              Eventos Registrados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-primary">{systemLogs.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-md border-0 ring-1 ring-primary/10">
        <CardHeader className="bg-primary/5 rounded-t-xl border-b pb-4">
          <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
            Registro de Eventos do Sistema
          </CardTitle>
          <CardDescription>
            Log detalhado de auditoria e segurança. Monitoramento em tempo real.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <div className="p-4 space-y-3">
              {systemLogs.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-3">
                  <ShieldCheck className="w-12 h-12 opacity-50" />
                  <p>Nenhum log registrado no sistema atualmente.</p>
                </div>
              ) : (
                systemLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 border rounded-xl flex gap-4 hover:bg-muted/30 transition-colors shadow-sm bg-background"
                  >
                    <div className="mt-1 shrink-0">
                      {log.type === 'error' && <ShieldAlert className="w-5 h-5 text-destructive" />}
                      {log.type === 'warning' && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      {log.type === 'info' && <Info className="w-5 h-5 text-blue-500" />}
                    </div>
                    <div className="flex flex-col gap-1 w-full min-w-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant={
                              log.type === 'error'
                                ? 'destructive'
                                : log.type === 'warning'
                                  ? 'default'
                                  : 'secondary'
                            }
                            className={
                              log.type === 'warning' ? 'bg-yellow-500 hover:bg-yellow-600' : ''
                            }
                          >
                            {log.type.toUpperCase()}
                          </Badge>
                          <span className="font-bold text-sm text-foreground">{log.message}</span>
                        </div>
                        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap bg-muted px-2 py-1 rounded-md">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-1">
                        {log.context && (
                          <p className="text-xs text-muted-foreground truncate">
                            <span className="font-semibold text-foreground/70">Contexto:</span>{' '}
                            {log.context}
                          </p>
                        )}
                        {log.userName && (
                          <p className="text-xs text-muted-foreground truncate">
                            <span className="font-semibold text-foreground/70">Usuário:</span>{' '}
                            {log.userName}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground truncate">
                          <span className="font-semibold text-foreground/70">ID:</span> {log.id}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
