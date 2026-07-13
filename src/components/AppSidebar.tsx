import { Link, useLocation } from 'react-router-dom'
import {
  Home,
  Search,
  Building,
  History,
  User,
  LogOut,
  Bell,
  MapPin,
  XCircle,
  BarChart,
  Shield,
  Zap,
  Activity,
  Megaphone,
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'

export function AppSidebar() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const { isAdmin, isGestor } = useUserRole()

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="p-4 border-b border-gray-100 dark:border-gray-800">
        <Link to="/app" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Search className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-lg hidden md:block tracking-tight text-[#1A3A52]">
            Étic Captação
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2 gap-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={pathname === '/app'} tooltip="Início">
              <Link to="/app">
                <Home />
                <span>Início</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/demandas')}
              tooltip="Começar Busca"
              className="text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-800 transition-colors"
            >
              <Link to="/app/demandas">
                <Search />
                <span className="font-bold">Começar Busca</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {(isAdmin || isGestor) && (
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive={pathname.startsWith('/app/analytics')}
                tooltip="Analytics"
              >
                <Link to="/app/analytics">
                  <BarChart />
                  <span>Analytics Dashboard</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/meus-captados')}
              tooltip="Meus Captados"
            >
              <Link to="/app/meus-captados">
                <Building />
                <span>Meus Captados</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/disponivel-geral')}
              tooltip="Disponível Geral"
            >
              <Link to="/app/disponivel-geral">
                <MapPin />
                <span>Disponível Geral</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/match-inteligentes')}
              tooltip="Matches Inteligentes"
            >
              <Link to="/app/match-inteligentes">
                <Zap />
                <span>Matches Inteligentes</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/historico')}
              tooltip="Histórico"
            >
              <Link to="/app/historico">
                <History />
                <span>Histórico (Ganhos)</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/perdidos')}
              tooltip="Perdidos"
            >
              <Link to="/app/perdidos">
                <XCircle />
                <span>Perdidos</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <SidebarSeparator className="my-2" />

        <SidebarMenu>
          {isAdmin && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/app/usuarios')}
                  tooltip="Gestão de Usuários"
                >
                  <Link to="/app/usuarios">
                    <Shield />
                    <span>Gestão de Usuários</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {(isAdmin || isGestor) && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname.startsWith('/app/campanhas')}
                    tooltip="Campanhas de Captação"
                  >
                    <Link to="/app/campanhas">
                      <Megaphone />
                      <span>Campanhas</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname.startsWith('/app/health-check')}
                  tooltip="Diagnóstico de Sistema"
                >
                  <Link to="/app/health-check">
                    <Activity />
                    <span>Diagnóstico de Sistema</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/notificacoes')}
              tooltip="Notificações"
            >
              <Link to="/app/notificacoes">
                <Bell />
                <span>Notificações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-gray-100 dark:border-gray-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={pathname.startsWith('/app/perfil')}
              tooltip="Meu Perfil"
            >
              <Link to="/app/perfil">
                <User />
                <span>Meu Perfil</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => signOut()} tooltip="Sair">
              <LogOut />
              <span>Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
