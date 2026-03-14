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
      return <Home className="w-5 h-5 text-blue-500" />
    case 'reivindicado':
      return <CheckCircle2 className="w-5 h-5 text-green-500" />
    case 'ja_reivindicado':
      return <XCircle className="w-5 h-5 text-red-500" />
    case 'demanda_respondida':
      return <FileText className="w-5 h-5 text-purple-500" />
    case 'perdido':
      return <X className="w-5 h-5 text-orange-500" />
    case 'visita':
      return <Calendar className="w-5 h-5 text-indigo-500" />
    case 'negocio':
      return <DollarSign className="w-5 h-5 text-emerald-500" />
    default:
      return <Bell className="w-5 h-5 text-muted-foreground" />
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
    <header className="h-[56px] md:h-[64px] lg:h-[72px] border-b bg-background flex items-center justify-between px-[16px] md:px-[24px] lg:px-[32px] sticky top-0 z-40">
      <div className="flex items-center gap-[16px]">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-[44px] h-[44px] p-0"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        ) : (
          <SidebarTrigger className="w-[44px] h-[44px] p-0" />
        )}
        <h1 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold leading-[24px] md:leading-[28px] lg:leading-[30px] truncate max-w-[200px] md:max-w-none">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <Badge
          variant="secondary"
          className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border-primary/20 cursor-pointer hover:bg-primary/20 transition-colors min-h-[44px] md:min-h-[40px]"
          onClick={() => navigate('/app/ranking')}
        >
          <Star className="w-4 h-4 fill-primary" />
          <span className="font-bold text-[14px] leading-[20px]">{currentUser.points} pts</span>
        </Badge>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative w-[44px] h-[44px]">
              <Bell className="w-6 h-6 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[320px] sm:w-[380px] p-0 overflow-hidden shadow-xl border-border"
          >
            <div className="flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b bg-muted/20">
                <h4 className="font-bold text-[16px] leading-[24px]">Notificações</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-[44px] px-3 text-[12px] md:text-[14px] leading-[16px] md:leading-[20px] text-muted-foreground hover:text-foreground"
                    onClick={() => markAllNotificationsAsRead()}
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Marcar lidas
                  </Button>
                )}
              </div>
              <div className="overflow-y-auto p-3 flex flex-col gap-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[14px] leading-[20px] font-medium">Nenhuma notificação</p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n: AppNotification) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-4 rounded-xl border transition-colors flex items-start gap-3',
                        n.lida
                          ? 'bg-background border-transparent hover:bg-muted/50'
                          : 'bg-primary/5 border-primary/20 shadow-sm cursor-pointer',
                      )}
                      onClick={() => {
                        if (!n.lida) markNotificationAsRead(n.id)
                        if (n.acao_url && !n.acao_botao) navigate(n.acao_url)
                      }}
                    >
                      <div className="mt-0.5 shrink-0 bg-background rounded-full p-2 shadow-sm border w-[40px] h-[40px] flex items-center justify-center">
                        {getNotifIcon(n.tipo_notificacao)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] md:text-[14px] lg:text-[14px] leading-[20px] text-foreground">
                          {n.titulo}
                        </p>
                        <p className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] mt-1 opacity-90 text-muted-foreground">
                          {n.corpo}
                        </p>

                        {n.detalhes && (
                          <div className="bg-background/50 rounded-lg p-2.5 mt-2 flex flex-wrap gap-x-2 gap-y-1.5 border border-border/50">
                            {Object.entries(n.detalhes).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[12px] md:text-[13px] lg:text-[14px] leading-[16px] md:leading-[18px] lg:leading-[20px] font-semibold text-muted-foreground block w-full truncate"
                              >
                                {String(k).replace('_', ' ').toUpperCase()}:{' '}
                                <span className="text-foreground">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {n.acao_botao && (
                          <Button
                            variant={n.urgencia === 'alta' ? 'default' : 'secondary'}
                            className="mt-3 w-full h-[48px] md:h-[44px] text-[14px] font-bold leading-[20px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!n.lida) markNotificationAsRead(n.id)
                              if (n.acao_url) navigate(n.acao_url)
                            }}
                          >
                            {n.acao_botao}
                          </Button>
                        )}
                        <div className="text-[11px] md:text-[12px] leading-[16px] opacity-60 mt-2 font-medium text-right w-full">
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
              <div className="p-3 border-t bg-muted/10">
                <Button
                  variant="outline"
                  className="w-full text-[14px] font-bold leading-[20px] h-[48px] md:h-[44px]"
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
