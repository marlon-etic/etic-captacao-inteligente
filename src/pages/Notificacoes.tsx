import { useState, useMemo } from 'react'
import { Bell, Check, Filter } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useNotificacoes } from '@/hooks/use-notificacoes'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export default function Notificacoes() {
  const { notificacoes, markAsRead, markAllAsRead } = useNotificacoes()
  const navigate = useNavigate()

  const [filterStatus, setFilterStatus] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')

  const filteredNotifications = useMemo(() => {
    return notificacoes.filter((n) => {
      if (filterStatus === 'nao_lidas' && n.lido) return false
      if (filterStatus === 'lidas' && !n.lido) return false
      return true
    })
  }, [notificacoes, filterStatus])

  const unreadCount = notificacoes.filter((n) => !n.lido).length

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border/50 pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            Central de Notificações
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount} nova{unreadCount > 1 ? 's' : ''}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gerencie todos os seus alertas e histórico
          </p>
        </div>

        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="secondary" className="font-bold">
            <Check className="w-4 h-4 mr-2" /> Marcar todas como lidas
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <Tabs
          value={filterStatus}
          onValueChange={(v) => setFilterStatus(v as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="todas">Todas</TabsTrigger>
            <TabsTrigger value="nao_lidas">Não Lidas</TabsTrigger>
            <TabsTrigger value="lidas">Lidas</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card className="border-dashed bg-muted/10">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Bell className="w-12 h-12 text-muted-foreground opacity-20 mb-4" />
              <p className="font-bold text-lg">Nenhuma notificação encontrada</p>
              <p className="text-sm text-muted-foreground mt-1">
                Tente ajustar os filtros ou aguarde novos alertas.
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                'transition-all duration-200 border-l-4 cursor-pointer hover:shadow-md',
                n.lido ? 'border-l-transparent bg-background' : 'bg-primary/5 shadow-sm',
                n.prioridade === 'alta' && !n.lido
                  ? 'border-l-destructive bg-destructive/5'
                  : n.prioridade === 'normal' && !n.lido
                    ? 'border-l-primary'
                    : !n.lido
                      ? 'border-l-gray-400'
                      : '',
              )}
              onClick={() => {
                if (!n.lido) markAsRead(n.id)
                if (n.dados_relacionados?.demanda_id) {
                  navigate(`/app/demandas?id=${n.dados_relacionados.demanda_id}`)
                } else if (n.dados_relacionados?.imovel_id) {
                  navigate(`/app/disponivel-geral`)
                }
              }}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          'font-bold text-base leading-tight flex items-center gap-2',
                          !n.lido ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {!n.lido && (
                          <div
                            className={cn(
                              'w-2 h-2 rounded-full',
                              n.prioridade === 'alta'
                                ? 'bg-red-500'
                                : n.prioridade === 'normal'
                                  ? 'bg-blue-500'
                                  : 'bg-gray-500',
                            )}
                          />
                        )}
                        {n.titulo}
                      </h3>
                      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap shrink-0">
                        {formatDistanceToNow(new Date(n.created_at), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-sm leading-snug',
                        !n.lido ? 'font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {n.mensagem}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                  {!n.lido && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        markAsRead(n.id)
                      }}
                      className="text-xs w-full sm:w-auto text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Check className="w-4 h-4 sm:mr-2" />
                      <span className="sm:hidden ml-2">Lida</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
