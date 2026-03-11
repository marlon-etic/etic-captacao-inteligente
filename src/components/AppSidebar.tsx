import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, Users, Trophy, UserCircle, PlusCircle } from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import useAppStore from '@/stores/useAppStore'

export function AppSidebar() {
  const { currentUser } = useAppStore()
  const location = useLocation()

  if (!currentUser) return null

  const navItems = [
    { title: 'Dashboard', icon: LayoutDashboard, url: '/app' },
    ...(currentUser.role === 'sdr' || currentUser.role === 'corretor'
      ? [{ title: 'Nova Demanda', icon: PlusCircle, url: '/app/nova-demanda' }]
      : []),
    { title: 'Demandas', icon: Users, url: '/app/demandas' },
    { title: 'Ranking', icon: Trophy, url: '/app/ranking' },
    { title: 'Perfil', icon: UserCircle, url: '/app/perfil' },
  ]

  return (
    <Sidebar className="border-r border-border hidden md:flex">
      <SidebarContent>
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
              É
            </div>
            Étic
          </h1>
        </div>
        <SidebarGroup>
          <SidebarGroupLabel>Menu Principal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={location.pathname === item.url}>
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5" />
                      <span className="font-medium">{item.title}</span>
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
