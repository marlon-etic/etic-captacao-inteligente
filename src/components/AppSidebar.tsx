import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Trophy,
  UserCircle,
  PlusCircle,
  LineChart,
  Bell,
  HelpCircle,
  UserCog,
  Shield,
  Star,
  History,
  ArchiveX,
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

export function AppSidebar() {
  const { currentUser } = useAppStore()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

  const canSeeNovaDemanda = ['admin', 'sdr', 'corretor'].includes(currentUser.role)
  const canSeeDemandas = ['admin', 'sdr', 'corretor', 'captador'].includes(currentUser.role)
  const canSeeAnalytics = ['admin', 'gestor'].includes(currentUser.role)
  const isAdmin = currentUser.role === 'admin'
  const isCaptador = currentUser.role === 'captador'

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/app' },
    ...(canSeeNovaDemanda
      ? [{ title: 'Nova Demanda', icon: PlusCircle, url: '/app/nova-demanda' }]
      : []),
    ...(canSeeDemandas ? [{ title: 'Demandas', icon: Users, url: '/app/demandas' }] : []),
    ...(isCaptador
      ? [
          { title: 'Pontuação', icon: Star, url: '/app/pontuacao' },
          { title: 'Histórico', icon: History, url: '/app/historico' },
          { title: 'Perdidos', icon: ArchiveX, url: '/app/perdidos' },
        ]
      : []),
    ...(canSeeAnalytics ? [{ title: 'Analytics', icon: LineChart, url: '/app/analytics' }] : []),
    { title: 'Notificações', icon: Bell, url: '/app/notificacoes' },
    { title: 'Ranking de Captadores', icon: Trophy, url: '/app/ranking' },
    ...(isAdmin ? [{ title: 'Ajuda', icon: HelpCircle, url: '/app/ajuda' }] : []),
    ...(isAdmin ? [{ title: 'Usuários', icon: UserCog, url: '/app/usuarios' }] : []),
    ...(isAdmin ? [{ title: 'Auditoria', icon: Shield, url: '/app/auditoria' }] : []),
    { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
  ]

  return (
    <Sidebar className="border-r-[2px] border-[#2E5F8A]/20 hidden md:flex bg-[#F5F5F5]">
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
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={
                      location.pathname === item.url ||
                      (item.url === '/app/demandas' &&
                        location.pathname.startsWith('/app/demandas'))
                    }
                    onClick={() => {
                      if (isMobile) setOpenMobile(false)
                    }}
                    className={cn(
                      'transition-all duration-200 ease-in-out font-bold text-[14px] px-[16px] py-[12px] min-h-[48px] rounded-[8px] h-auto border border-transparent',
                      location.pathname === item.url ||
                        (item.url === '/app/demandas' &&
                          location.pathname.startsWith('/app/demandas'))
                        ? 'bg-[#1A3A52] text-white shadow-[0_2px_4px_rgba(26,58,82,0.15)] hover:bg-[#1f4866]'
                        : 'bg-transparent text-[#333333] hover:bg-[#FFFFFF] hover:border-[#2E5F8A]/20 shadow-none hover:text-[#1A3A52]',
                    )}
                  >
                    <Link to={item.url} className="flex items-center gap-[12px] w-full">
                      <item.icon className="w-[20px] h-[20px] shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
