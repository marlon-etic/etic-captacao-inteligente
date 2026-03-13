import { useState, useMemo } from 'react'
import {
  Bell,
  Check,
  Trash2,
  Filter,
  Home,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AppNotification } from '@/types'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'novo_imovel':
      return <Home className="w-[18px] h-[18px] text-blue-500" />
    case 'reivindicado':
      return <CheckCircle2 className="w-[18px] h-[18px] text-green-500" />
    case 'ja_reivindicado':
      return <XCircle className="w-[18px] h-[18px] text-red-500" />
    case 'demanda_respondida':
      return <FileText className="w-[18px] h-[18px] text-purple-500" />
    case 'perdido':
      return <X className="w-[18px] h-[18px] text-orange-500" />
    case 'visita':
      return <Calendar className="w-[18px] h-[18px] text-indigo-500" />
    case 'negocio':
      return <DollarSign className="w-[18px] h-[18px] text-emerald-500" />
    default:
      return <Bell className="w-[18px] h-[18px] text-muted-foreground" />
  }
}

export default function Notificacoes() {
  const {
    currentUser,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    archiveNotification,
  } = useAppStore()
  const navigate = useNavigate()

  const [filterType, setFilterType] = useState<string>('todas')
  const [filterStatus, setFilterStatus] = useState<'todas' | 'nao_lidas' | 'lidas'>('todas')

  const userNotifications = useMemo(() => {
    return notifications
      .filter((n) => n.usuario_id === currentUser?.id && !n.arquivada)
      .sort((a, b) => new Date(b.data_criacao).getTime() - new Date(a.data_criacao).getTime())
  }, [notifications, currentUser])

  const filteredNotifications = useMemo(() => {
    return userNotifications.filter((n) => {
      if (filterType !== 'todas' && n.tipo_notificacao !== filterType) return false
      if (filterStatus === 'nao_lidas' && n.lida) return false
      if (filterStatus === 'lidas' && !n.lida) return false
      return true
    })
  }, [userNotifications, filterType, filterStatus])

  const unreadCount = userNotifications.filter((n) => !n.lida).length

  if (!currentUser) return null

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
          <Button
            onClick={() => markAllNotificationsAsRead()}
            variant="secondary"
            className="font-bold"
          >
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

        <div className="flex items-center gap-2 ml-auto w-full sm:w-[200px]">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos os tipos</SelectItem>
              <SelectItem value="novo_imovel">Novo Imóvel</SelectItem>
              <SelectItem value="reivindicado">Reivindicações</SelectItem>
              <SelectItem value="demanda_respondida">Mensagens & Propostas</SelectItem>
              <SelectItem value="visita">Visitas</SelectItem>
              <SelectItem value="negocio">Negócios</SelectItem>
              <SelectItem value="perdido">Perdidos / Prazos</SelectItem>
            </SelectContent>
          </Select>
        </div>
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
                'transition-all duration-200 border-l-4',
                n.lida
                  ? 'border-l-transparent bg-background'
                  : 'border-l-primary bg-primary/5 shadow-md',
                n.urgencia === 'alta' && !n.lida ? 'border-l-destructive bg-destructive/5' : '',
              )}
            >
              <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 sm:gap-6">
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div
                    className={cn(
                      'shrink-0 w-10 h-10 rounded-full flex items-center justify-center border bg-background shadow-sm',
                      !n.lida && n.urgencia === 'alta' ? 'border-destructive/30' : '',
                    )}
                  >
                    {getNotifIcon(n.tipo_notificacao)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <h3
                        className={cn(
                          'font-bold text-base leading-tight',
                          !n.lida ? 'text-foreground' : 'text-muted-foreground',
                        )}
                      >
                        {n.titulo}
                      </h3>
                      <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap shrink-0">
                        {new Date(n.data_criacao).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p
                      className={cn(
                        'text-sm leading-snug',
                        !n.lida ? 'font-medium' : 'text-muted-foreground',
                      )}
                    >
                      {n.corpo}
                    </p>

                    {n.detalhes && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {Object.entries(n.detalhes).map(([key, value]) => (
                          <div
                            key={key}
                            className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground"
                          >
                            <span className="opacity-70 mr-1 capitalize">
                              {key.replace('_', ' ')}:
                            </span>{' '}
                            {String(value)}
                          </div>
                        ))}
                      </div>
                    )}

                    {n.acao_botao && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant={n.urgencia === 'alta' ? 'default' : 'secondary'}
                          onClick={() => {
                            if (!n.lida) markNotificationAsRead(n.id)
                            if (n.acao_url) navigate(n.acao_url)
                          }}
                        >
                          {n.acao_botao}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center justify-end gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0">
                  {!n.lida && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markNotificationAsRead(n.id)}
                      className="text-xs w-full sm:w-auto text-primary hover:text-primary hover:bg-primary/10"
                    >
                      <Check className="w-4 h-4 sm:mr-2" />
                      <span className="sm:hidden ml-2">Lida</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => archiveNotification(n.id)}
                    className="text-xs w-full sm:w-auto text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4 sm:mr-2" />
                    <span className="sm:hidden ml-2">Arquivar</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
