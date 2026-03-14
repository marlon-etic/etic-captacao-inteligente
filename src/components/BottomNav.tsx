import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { LayoutDashboard, Users, PlusCircle, UserCircle, Trophy, Bell, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { AppNotification } from '@/types'

export function BottomNav() {
  const { currentUser, notifications } = useAppStore()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (!currentUser) return null

  const isCreator = currentUser.role === 'sdr' || currentUser.role === 'corretor'
  const isCaptador = currentUser.role === 'captador'

  const userNotifications =
    notifications?.filter(
      (n: AppNotification) => n.usuario_id === currentUser.id && !n.arquivada,
    ) || []
  const unreadCount = userNotifications.filter((n: AppNotification) => !n.lida).length

  const currentTab = searchParams.get('tab')

  const links = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/app' },
    { title: 'Demandas', icon: Users, url: '/app/demandas' },
    ...(isCreator
      ? [{ title: 'Nova', icon: PlusCircle, url: '/app/nova-demanda', isFab: true }]
      : []),
    ...(isCaptador
      ? [{ title: 'Captados', icon: Home, url: '/app/demandas?tab=captados' }]
      : [{ title: 'Ranking', icon: Trophy, url: '/app/ranking' }]),
    { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#FFFFFF] border-t border-[#E5E5E5] flex items-center justify-around px-[4px] py-[8px] z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        let isActive = false
        if (link.url.includes('?tab=')) {
          const targetTab = link.url.split('?tab=')[1]
          isActive = location.pathname === link.url.split('?')[0] && currentTab === targetTab
        } else {
          isActive =
            location.pathname === link.url &&
            (!link.url.includes('/app/demandas') || !currentTab || currentTab === 'demandas')
        }

        if (link.isFab) {
          return (
            <Link
              key={link.url}
              to={link.url}
              className="relative -top-5 flex items-center justify-center w-[44px] h-[44px]"
            >
              <div className="w-[44px] h-[44px] rounded-full bg-[#4444FF] flex items-center justify-center shadow-lg text-white transform active:scale-95 transition-transform">
                <link.icon className="w-[24px] h-[24px]" />
              </div>
            </Link>
          )
        }

        return (
          <Link
            key={link.url}
            to={link.url}
            className={cn(
              'relative flex flex-col items-center justify-center min-h-[44px] min-w-[44px] transition-colors px-1',
              isActive ? 'text-[#4444FF]' : 'text-[#999999] hover:text-[#333333]',
            )}
          >
            <div className="relative">
              <link.icon className={cn('w-[24px] h-[24px]')} />
              {link.badge !== undefined && link.badge > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF4444] text-white flex items-center justify-center rounded-full text-[8px] font-bold border-[1.5px] border-white">
                  {link.badge > 9 ? '9+' : link.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium tracking-tight mt-[4px] leading-none">
              {titleCase(link.title)}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
