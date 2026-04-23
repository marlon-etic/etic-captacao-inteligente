import { Link, useLocation } from 'react-router-dom'
import { Users, Building, User, LayoutDashboard, Search, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'

export function BottomNav() {
  const location = useLocation()
  const { currentUser } = useAppStore()

  if (!currentUser) return null

  const isSDRCorretor = currentUser.role === 'sdr' || currentUser.role === 'corretor'

  let navItems = []

  if (isSDRCorretor) {
    navItems = [
      { icon: Users, label: 'Clientes', path: '/app' },
      { icon: Building, label: 'Imóveis', path: '/app/disponivel-geral' },
      { icon: Zap, label: 'Matches', path: '/app/match-inteligentes' },
      { icon: User, label: 'Perfil', path: '/app/perfil' },
    ]
  } else if (currentUser.role === 'captador') {
    navItems = [
      { icon: LayoutDashboard, label: 'Início', path: '/app' },
      { icon: Building, label: 'Meus Captados', path: '/app/meus-captados' },
      { icon: Zap, label: 'Matches', path: '/app/match-inteligentes' },
      { icon: User, label: 'Perfil', path: '/app/perfil' },
    ]
  } else {
    navItems = [
      { icon: LayoutDashboard, label: 'Início', path: '/app' },
      { icon: Search, label: 'Demandas', path: '/app/demandas' },
      { icon: Zap, label: 'Matches', path: '/app/match-inteligentes' },
      { icon: User, label: 'Perfil', path: '/app/perfil' },
    ]
  }

  const checkIsActive = (itemPath: string) => {
    if (itemPath === '/app') {
      return location.pathname === '/app'
    }
    return location.pathname.startsWith(itemPath)
  }

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[64px] bg-[#FFFFFF] border-t border-[#E0E0E0] flex items-center justify-around px-2 z-[40] pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      {navItems.map((item) => {
        const isActive = checkIsActive(item.path)

        return (
          <Link
            key={item.label}
            to={item.path}
            className={cn(
              'flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors relative',
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
