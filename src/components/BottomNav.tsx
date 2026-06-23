import { Link, useLocation } from 'react-router-dom'
import { Search, Home, MapPin, User, Building, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/use-user-role'

export function BottomNav() {
  const { pathname } = useLocation()
  const { isCaptador } = useUserRole()

  const tabs = [
    { name: 'Início', path: '/app', icon: Home },
    { name: 'Busca', path: '/app/demandas', icon: Search },
    { name: 'Matches', path: '/app/match-inteligentes', icon: Zap },
    isCaptador ? { name: 'Meus Captados', path: '/app/meus-captados', icon: Building } : null,
    { name: 'Perfil', path: '/app/perfil', icon: User },
  ].filter(Boolean) as Array<{ name: string; path: string; icon: React.ElementType }>

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-white border-t border-gray-100 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pb-safe">
      <nav className="flex justify-around items-center h-16">
        {tabs.map((tab) => {
          const isActive = pathname === tab.path || pathname.startsWith(tab.path + '/')
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={cn(
                'flex flex-col items-center justify-center w-full h-full space-y-1 transition-all',
                isActive ? 'text-emerald-600' : 'text-slate-400 hover:text-emerald-500',
              )}
            >
              <tab.icon className={cn('w-5 h-5', isActive && 'stroke-[2.5px] scale-110')} />
              <span className={cn('text-[10px]', isActive ? 'font-bold' : 'font-medium')}>
                {tab.name}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
