import { Link, useLocation } from 'react-router-dom'
import { Home, ListTodo, Trophy, User, PlusCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'

export function BottomNav() {
  const location = useLocation()
  const { currentUser } = useAppStore()

  if (!currentUser) return null

  const getCaptadosTab = () => {
    if (currentUser?.role === 'sdr' || currentUser?.role === 'corretor') return 'todos'
    return 'captados'
  }

  const navItems = [
    { icon: Home, label: 'Início', path: '/app' },
    { icon: ListTodo, label: 'Demandas', path: '/app/demandas' },
    { icon: PlusCircle, label: 'Captados', path: `/app/demandas?tab=${getCaptadosTab()}` },
    { icon: Trophy, label: 'Ranking', path: '/app/ranking' },
    { icon: User, label: 'Perfil', path: '/app/perfil' },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#FFFFFF] border-t border-[#E0E0E0] flex items-center justify-around px-2 z-50 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive =
          (location.pathname === item.path.split('?')[0] &&
            (item.path.includes('?') ? location.search === `?${item.path.split('?')[1]}` : true)) ||
          (item.path === '/app/demandas' &&
            location.pathname === '/app/demandas' &&
            !location.search.includes('tab=todos') &&
            !location.search.includes('tab=captados'))

        return (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1',
              isActive ? 'text-[#1A3A52]' : 'text-[#999999] hover:text-[#333333]',
            )}
          >
            <item.icon className={cn('w-6 h-6', isActive && 'fill-[#1A3A52]/10')} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
