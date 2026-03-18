import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Home, ClipboardList, Building2, Bell, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { AppNotification } from '@/types'

export function BottomNav() {
  const { currentUser, notifications, demands } = useAppStore()
  const location = useLocation()
  const [searchParams] = useSearchParams()

  if (!currentUser) return null

  const userNotifications =
    notifications?.filter(
      (n: AppNotification) => n.usuario_id === currentUser.id && !n.arquivada && !n.lida,
    ) || []

  const unreadCaptadosCount = userNotifications.filter(
    (n) => n.tipo_notificacao === 'novo_imovel',
  ).length

  const unreadNotifCount = userNotifications.filter(
    (n) => n.tipo_notificacao !== 'novo_imovel',
  ).length

  const activeDemandsCount = demands.filter(
    (d) =>
      d.status === 'Pendente' &&
      (currentUser.role === 'captador' || d.createdBy === currentUser.id),
  ).length

  const currentTab = searchParams.get('tab')

  const links = [
    { title: 'Home', icon: Home, url: '/app' },
    {
      title: 'Demandas',
      icon: ClipboardList,
      url: '/app/demandas?tab=demandas',
      badge: activeDemandsCount,
    },
    {
      title: 'Captados',
      icon: Building2,
      url: '/app/demandas?tab=captados',
      badge: unreadCaptadosCount,
    },
    { title: 'Avisos', icon: Bell, url: '/app/notificacoes', badge: unreadNotifCount },
    { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
  ]

  return (
    <>
      <div className="h-[56px] w-full block md:hidden bg-transparent shrink-0" />

      <div className="fixed bottom-0 left-0 right-0 h-[56px] bg-[#FFFFFF] border-t-[1px] border-[#E5E5E5] flex items-center justify-around z-[999] md:hidden shadow-[0_-2px_8px_rgba(0,0,0,0.12)] pb-safe transition-all duration-200 ease-in-out landscape:h-[48px]">
        {links.map((link) => {
          let isActive = false
          if (link.url.includes('?tab=demandas')) {
            isActive =
              location.pathname === '/app/demandas' && (!currentTab || currentTab === 'demandas')
          } else if (link.url.includes('?tab=captados')) {
            isActive = location.pathname === '/app/demandas' && currentTab === 'captados'
          } else {
            isActive = location.pathname === link.url
          }

          return (
            <Link
              key={link.title}
              to={link.url}
              className={cn(
                'relative flex flex-col items-center justify-center h-full transition-transform duration-100 ease-in-out flex-1 active:scale-90',
                isActive
                  ? 'text-[#1A3A52]'
                  : 'text-[#999999] hover:text-[#1A3A52] hover:bg-[#F5F5F5]/30',
              )}
            >
              <div className="relative flex flex-col items-center justify-center">
                <link.icon className={cn('w-[24px] h-[24px]', isActive && 'fill-current/10')} />
                {link.badge !== undefined && link.badge > 0 ? (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] px-1 bg-[#FF4444] text-white flex items-center justify-center rounded-full text-[10px] font-bold border-[1.5px] border-[#FFFFFF] shadow-sm">
                    {link.badge > 9 ? '9+' : link.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] font-bold tracking-tight mt-[2px] leading-none landscape:hidden">
                {link.title}
              </span>
            </Link>
          )
        })}
      </div>
    </>
  )
}
