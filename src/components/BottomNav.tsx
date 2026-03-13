import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, PlusCircle, UserCircle, Trophy } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'

export function BottomNav() {
  const { currentUser } = useAppStore()
  const location = useLocation()

  if (!currentUser) return null

  const isCreator = currentUser.role === 'sdr' || currentUser.role === 'corretor'

  const links = [
    { title: 'Início', icon: LayoutDashboard, url: '/app' },
    { title: 'Demandas', icon: Users, url: '/app/demandas' },
    ...(isCreator
      ? [{ title: 'Nova', icon: PlusCircle, url: '/app/nova-demanda', isFab: true }]
      : []),
    { title: 'Ranking', icon: Trophy, url: '/app/ranking' },
    { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[56px] bg-background border-t flex items-center justify-around px-[8px] py-[8px] z-50 md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      {links.map((link) => {
        const isActive = location.pathname === link.url

        if (link.isFab) {
          return (
            <Link
              key={link.url}
              to={link.url}
              className="relative -top-5 flex items-center justify-center w-[44px] h-[44px]"
            >
              <div className="w-[44px] h-[44px] rounded-full bg-primary flex items-center justify-center shadow-lg text-primary-foreground transform active:scale-95 transition-transform">
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
              'flex flex-col items-center justify-center min-h-[44px] min-w-[44px] text-muted-foreground transition-colors',
              isActive && 'text-primary',
            )}
          >
            <link.icon className={cn('w-[24px] h-[24px]')} />
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
