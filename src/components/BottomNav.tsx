import { Link, useLocation, useSearchParams } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  PlusCircle,
  UserCircle,
  Trophy,
  Home,
  UsersCog,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { AppNotification } from '@/types'

export function BottomNav() {
  const { currentUser, notifications } = useAppStore()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (!currentUser) return null

  const isCreator = ['admin', 'sdr', 'corretor'].includes(currentUser.role)
  const canSeeDemandas = ['admin', 'sdr', 'corretor', 'captador'].includes(currentUser.role)
  const isCaptador = currentUser.role === 'captador'
  const isAdmin = currentUser.role === 'admin'

  const userNotifications =
    notifications?.filter(
      (n: AppNotification) => n.usuario_id === currentUser.id && !n.arquivada,
    ) || []
  const unreadCount = userNotifications.filter((n: AppNotification) => !n.lida).length

  const currentTab = searchParams.get('tab')

  const links = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/app' },
    ...(canSeeDemandas && !isAdmin
      ? [{ title: 'Demandas', icon: Users, url: '/app/demandas' }]
      : []),
    ...(isAdmin ? [{ title: 'Usuários', icon: UsersCog, url: '/app/usuarios' }] : []),
    ...(isCreator
      ? [{ title: 'Nova', icon: PlusCircle, url: '/app/nova-demanda', isFab: true }]
      : []),
    ...(isCaptador
      ? [{ title: 'Captados', icon: Home, url: '/app/demandas?tab=captados' }]
      : [{ title: 'Ranking', icon: Trophy, url: '/app/ranking' }]),
    { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
  ]

  return (
    <>
      <div className="h-[56px] w-full block md:hidden bg-transparent" />

      <div className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#FFFFFF] border-t-[2px] border-[#2E5F8A]/20 flex items-center justify-around px-[4px] py-[4px] z-50 md:hidden shadow-[0_-4px_12px_rgba(26,58,82,0.1)] pb-safe transition-all duration-200 ease-in-out">
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
                className="relative -top-5 flex items-center justify-center w-[56px] h-[56px]"
              >
                <div className="w-[56px] h-[56px] rounded-full bg-[#1A3A52] flex items-center justify-center shadow-[0_4px_12px_rgba(26,58,82,0.2)] text-white transform active:scale-95 transition-all duration-200 ease-in-out hover:bg-[#1f4866]">
                  <link.icon className="w-7 h-7" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={link.url}
              to={link.url}
              className={cn(
                'relative flex flex-col items-center justify-center min-h-[48px] min-w-[48px] transition-all duration-200 ease-in-out flex-1 rounded-[8px]',
                isActive
                  ? 'text-[#1A3A52] bg-[#F5F5F5]'
                  : 'text-[#999999] hover:text-[#1A3A52] hover:bg-[#F5F5F5]/50',
              )}
            >
              <div className="relative">
                <link.icon className={cn('w-6 h-6')} />
                {(link as any).badge !== undefined && (link as any).badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#F44336] text-white flex items-center justify-center rounded-full text-[9px] font-bold border-[1.5px] border-[#FFFFFF]">
                    {(link as any).badge > 9 ? '9+' : (link as any).badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-bold tracking-tight mt-[4px] leading-none">
                {titleCase(link.title)}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}

function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
