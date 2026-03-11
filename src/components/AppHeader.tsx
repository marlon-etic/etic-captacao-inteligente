import { Bell, Menu, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import useAppStore from '@/stores/useAppStore'

export function AppHeader() {
  const store = useAppStore()
  const currentUser = store.currentUser

  // Safely retrieve notifications or fallback to auditLogs to maintain functionality
  const notifications = 'notifications' in store ? (store as any).notifications : store.auditLogs

  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

  // Fix: implement optional chaining and nullish coalescing to prevent runtime error
  const unreadCount = notifications?.length ?? 0

  return (
    <header className="h-16 border-b bg-background flex items-center justify-between px-4 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        {isMobile ? (
          <Button variant="ghost" size="icon" onClick={() => setOpenMobile(true)}>
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <SidebarTrigger />
        )}
        <div className="hidden sm:block">
          <h2 className="text-sm font-semibold capitalize text-muted-foreground">
            {currentUser.role}
          </h2>
          <p className="text-sm font-medium">{currentUser.name}</p>
        </div>
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
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto">
              <h4 className="font-semibold text-sm">Notificações</h4>
              {unreadCount === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              ) : (
                notifications.map((n: string, i: number) => (
                  <div key={i} className="text-sm p-2 bg-muted/50 rounded-md border">
                    {n}
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
