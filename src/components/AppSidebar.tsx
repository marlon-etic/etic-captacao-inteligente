import { Link, useLocation } from 'react-router-dom'
import {
  Users,
  Trophy,
  UserCircle,
  LineChart,
  Bell,
  HelpCircle,
  UserCog,
  Shield,
  Star,
  History,
  ArchiveX,
  Building,
  LayoutDashboard,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function AppSidebar() {
  const { currentUser, demands, looseProperties } = useAppStore()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

  const isAdmin = currentUser.role === 'admin'
  const isGestor = currentUser.role === 'gestor'
  const isCaptador = currentUser.role === 'captador'
  const isSDRCorretor = currentUser.role === 'sdr' || currentUser.role === 'corretor'

  // Counters
  const myActiveDemandsCount = demands.filter(
    (d) =>
      d.createdBy === currentUser.id &&
      !['Perdida', 'Impossível', 'Negócio', 'Arquivado'].includes(d.status),
  ).length

  const myAvailablePropsCount = looseProperties.filter((p) => {
    if (currentUser.role === 'sdr') return p.propertyType === 'Aluguel'
    if (currentUser.role === 'corretor') return p.propertyType === 'Venda'
    return true
  }).length

  const historyCount = demands.filter((d) => d.createdBy === currentUser.id).length

  let navItems: any[] = []

  if (isSDRCorretor) {
    navItems = [
      {
        title: 'Minhas Demandas',
        icon: Users,
        url: '/app',
        badge: myActiveDemandsCount > 0 ? myActiveDemandsCount : undefined,
      },
      {
        title: 'Disponível Geral',
        icon: Building,
        url: '/app/disponivel-geral',
        badge: myAvailablePropsCount > 0 ? myAvailablePropsCount : undefined,
      },
      {
        title: 'Todos Captados',
        icon: Building,
        url: '/app/todos-captados',
        badge: undefined,
      },
      {
        title: 'Histórico',
        icon: History,
        url: '/app/historico',
        badge: historyCount > 0 ? historyCount : undefined,
      },
      { title: 'Notificações', icon: Bell, url: '/app/notificacoes' },
      { title: 'Ajuda', icon: HelpCircle, url: '/app/ajuda' },
      { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
    ]
  } else if (isCaptador) {
    navItems = [
      { title: 'Dashboard', icon: LayoutDashboard, url: '/app' },
      { title: 'Demandas Abertas', icon: Users, url: '/app/demandas' },
      { title: 'Pontuação', icon: Star, url: '/app/pontuacao' },
      { title: 'Ranking', icon: Trophy, url: '/app/ranking' },
      { title: 'Histórico', icon: History, url: '/app/historico' },
      { title: 'Perdidos', icon: ArchiveX, url: '/app/perdidos' },
      { title: 'Notificações', icon: Bell, url: '/app/notificacoes' },
      { title: 'Ajuda', icon: HelpCircle, url: '/app/ajuda' },
      { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
    ]
  } else if (isAdmin || isGestor) {
    navItems = [
      { title: 'Dashboard Geral', icon: LayoutDashboard, url: '/app' },
      { title: 'Todas as Demandas', icon: Users, url: '/app/demandas' },
      { title: 'Analytics', icon: LineChart, url: '/app/analytics' },
      { title: 'Ranking', icon: Trophy, url: '/app/ranking' },
      { title: 'Notificações', icon: Bell, url: '/app/notificacoes' },
      { title: 'Ajuda', icon: HelpCircle, url: '/app/ajuda' },
      ...(isAdmin ? [{ title: 'Usuários', icon: UserCog, url: '/app/usuarios' }] : []),
      ...(isAdmin ? [{ title: 'Auditoria', icon: Shield, url: '/app/auditoria' }] : []),
      { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
    ]
  }

  const checkIsActive = (itemUrl: string) => {
    if (itemUrl === '/app') {
      return location.pathname === '/app'
    }
    return location.pathname.startsWith(itemUrl)
  }

  return (
    <Sidebar className="border-r-[2px] border-[#2E5F8A]/20 hidden md:flex bg-[#F5F5F5] z-[100]">
      <SidebarContent className="bg-[#F5F5F5]">
        <div className="p-[24px]">
          <h1 className="text-[20px] font-bold text-[#1A3A52] tracking-tight flex items-center gap-[8px]">
            <div className="w-[32px] h-[32px] rounded-[8px] bg-[#1A3A52] flex items-center justify-center text-white shadow-[0_2px_4px_rgba(26,58,82,0.2)]">
              É
            </div>
            Étic
          </h1>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[12px] font-bold text-[#999999] uppercase tracking-wider mb-[8px]">
            Menu Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = checkIsActive(item.url)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      onClick={() => {
                        if (isMobile) setOpenMobile(false)
                      }}
                      className={cn(
                        'transition-all duration-200 ease-in-out font-bold text-[14px] px-[16px] py-[12px] min-h-[48px] rounded-[8px] h-auto border border-transparent',
                        isActive
                          ? 'bg-[#1A3A52] text-white shadow-[0_2px_4px_rgba(26,58,82,0.15)] hover:bg-[#1f4866]'
                          : 'bg-transparent text-[#333333] hover:bg-[#FFFFFF] hover:border-[#2E5F8A]/20 shadow-none hover:text-[#1A3A52]',
                      )}
                    >
                      <Link to={item.url} className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-[12px] min-w-0">
                          <item.icon className="w-[20px] h-[20px] shrink-0" />
                          <span className="truncate">{item.title}</span>
                        </div>
                        {item.badge !== undefined && (
                          <Badge
                            className={cn(
                              'ml-2 shrink-0 border-none px-1.5 min-w-[20px] flex justify-center text-[11px]',
                              isActive ? 'bg-white text-[#1A3A52]' : 'bg-[#1A3A52] text-white',
                            )}
                          >
                            {item.badge}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
