import { Bell, Menu, Star, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'

export function AppHeader() {
  const store = useAppStore()
  const currentUser = store.currentUser

  const notifications = store.notifications?.filter((n: any) => n.userId === currentUser?.id) || []
  const unreadCount = notifications.filter((n: any) => !n.read).length
  const { markNotificationAsRead } = store

  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

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
          className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border-primary/20"
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
          <PopoverContent align="end" className="w-80 p-2">
            <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-1 px-1">
                <h4 className="font-semibold text-sm">Notificações</h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-auto p-1 text-[10px] text-muted-foreground hover:text-foreground"
                    onClick={() =>
                      notifications.forEach((n: any) => !n.read && markNotificationAsRead(n.id))
                    }
                  >
                    <Check className="w-3 h-3 mr-1" /> Marcar lidas
                  </Button>
                )}
              </div>
              {notifications.length === 0 ? (
                <p className="text-sm text-muted-foreground px-1">Nenhuma notificação</p>
              ) : (
                notifications.map((n: any) => (
                  <div
                    key={n.id}
                    className={cn(
                      'text-sm p-3 rounded-md border cursor-pointer transition-colors',
                      n.read
                        ? 'bg-muted/30 text-muted-foreground/80'
                        : 'bg-primary/5 border-primary/20 text-foreground',
                    )}
                    onClick={() => !n.read && markNotificationAsRead(n.id)}
                  >
                    <p className="leading-snug">{n.message}</p>
                    <div className="text-[10px] opacity-70 mt-1.5 font-medium">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
