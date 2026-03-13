import {
  Bell,
  Menu,
  Star,
  Check,
  Home,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import { AppNotification } from '@/types'

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

export function AppHeader() {
  const store = useAppStore()
  const currentUser = store.currentUser
  const navigate = useNavigate()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

  const notifications =
    store.notifications?.filter(
      (n: AppNotification) => n.usuario_id === currentUser.id && !n.arquivada,
    ) || []
  const unreadCount = notifications.filter((n: AppNotification) => !n.lida).length
  const { markNotificationAsRead, markAllNotificationsAsRead } = store

  const getTitle = () => {
    if (currentUser.role === 'corretor') return 'Demandas de Venda'
    if (currentUser.role === 'sdr') return 'Demandas de Locação'
    if (currentUser.role === 'captador') return 'Demandas de Captação'
    if (currentUser.role === 'gestor' || currentUser.role === 'admin') return 'Dashboard Gerencial'
    return 'Demandas'
  }

  return (
    <header className="h-[56px] border-b bg-background flex items-center justify-between px-[12px] py-[8px] sticky top-0 z-40">
      <div className="flex items-center gap-[12px]">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-[44px] h-[44px] p-0"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="w-[24px] h-[24px]" />
          </Button>
        ) : (
          <SidebarTrigger className="w-[44px] h-[44px] p-0" />
        )}
        <h1 className="text-[16px] font-bold leading-[24px]">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors"
          onClick={() => navigate('/app/ranking')}
        >
          <Star className="w-4 h-4 fill-primary" />
          <span className="font-bold text-sm">{currentUser.points} pts</span>
        </Badge>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative w-[44px] h-[44px]">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80 p-0 overflow-hidden shadow-xl border-border">
            <div className="flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-3 border-b bg-muted/20">
                <h4 className="font-bold text-sm">Notificações</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() => markAllNotificationsAsRead()}
                  >
                    <Check className="w-3 h-3 mr-1" /> Marcar lidas
                  </Button>
                )}
              </div>
              <div className="overflow-y-auto p-2 flex flex-col gap-2">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-sm font-medium">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n: AppNotification) => (
                    <div
                      key={n.id}
                      className={cn(
                        'text-sm p-3 rounded-xl border transition-colors flex items-start gap-3',
                        n.lida
                          ? 'bg-background border-transparent hover:bg-muted/50'
                          : 'bg-primary/5 border-primary/20 shadow-sm cursor-pointer',
                      )}
                      onClick={() => {
                        if (!n.lida) markNotificationAsRead(n.id)
                        if (n.acao_url && !n.acao_botao) navigate(n.acao_url)
                      }}
                    >
                      <div className="mt-0.5 shrink-0 bg-background rounded-full p-1.5 shadow-sm border">
                        {getNotifIcon(n.tipo_notificacao)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-xs leading-tight text-foreground">
                          {n.titulo}
                        </p>
                        <p className="text-[11px] leading-snug mt-1 opacity-90 text-muted-foreground">
                          {n.corpo}
                        </p>

                        {n.detalhes && (
                          <div className="text-[10px] bg-background/50 rounded-md p-1.5 mt-2 flex flex-wrap gap-x-2 gap-y-1 border border-border/50">
                            {Object.entries(n.detalhes).map(([k, v]) => (
                              <span key={k} className="font-semibold text-muted-foreground">
                                {String(k).replace('_', ' ').toUpperCase()}:{' '}
                                <span className="text-foreground">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {n.acao_botao && (
                          <Button
                            size="sm"
                            variant={n.urgencia === 'alta' ? 'default' : 'secondary'}
                            className="mt-2 w-full h-8 text-[11px] font-bold"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!n.lida) markNotificationAsRead(n.id)
                              if (n.acao_url) navigate(n.acao_url)
                            }}
                          >
                            {n.acao_botao}
                          </Button>
                        )}
                        <div className="text-[9px] opacity-60 mt-2 font-medium text-right w-full">
                          {new Date(n.data_criacao).toLocaleString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-2 border-t bg-muted/10">
                <Button
                  variant="outline"
                  className="w-full text-xs font-bold"
                  onClick={() => navigate('/app/notificacoes')}
                >
                  Ver todas as notificações
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
