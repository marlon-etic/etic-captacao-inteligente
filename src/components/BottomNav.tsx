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
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-background border-t flex items-center justify-around px-2 z-50 md:hidden pb-safe">
      {links.map((link) => {
        const isActive = location.pathname === link.url

        if (link.isFab) {
          return (
            <Link key={link.url} to={link.url} className="relative -top-5">
              <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg text-primary-foreground transform active:scale-95 transition-transform">
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
              'flex flex-col items-center justify-center w-16 h-full gap-1 text-muted-foreground transition-colors',
              isActive && 'text-primary',
            )}
          >
            <link.icon className={cn('w-6 h-6', isActive && 'fill-primary/20')} />
            <span className="text-[10px] font-medium tracking-tight">{titleCase(link.title)}</span>
          </Link>
        )
      })}
    </div>
  )
}

function titleCase(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}
