import { Bell, Menu, Star, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetDescription,
} from '@/components/ui/sheet'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { useNavigate, useLocation } from 'react-router-dom'
import { useNotificacoes } from '@/hooks/use-notificacoes'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface AppHeaderProps {
  onAddPropertyClick?: () => void
}

export function AppHeader({ onAddPropertyClick }: AppHeaderProps) {
  const store = useAppStore()
  const currentUser = store.currentUser
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const { notificacoes, markAsRead, markAllAsRead } = useNotificacoes()

  if (!currentUser) return null

  // Ensure robust fallback to prevent array errors when loading
  const safeNotificacoes = notificacoes || []
  const unreadCount = safeNotificacoes.filter((n) => !n.lido).length

  const getTitle = () => {
    if (location.pathname.includes('/app/pontuacao')) return 'Pontuação e Desempenho'
    if (location.pathname.includes('/app/historico')) return 'Histórico de Demandas'
    if (location.pathname.includes('/app/perdidos')) return 'Demandas Perdidas'
    if (currentUser.role === 'corretor') return 'Demandas de Venda'
    if (currentUser.role === 'sdr') return 'Demandas de Locação'
    if (currentUser.role === 'captador') return 'Demandas de Captação'
    if (currentUser.role === 'gestor' || currentUser.role === 'admin') return 'Dashboard Gerencial'
    return 'Demandas'
  }

  return (
    <header className="h-[64px] lg:h-[72px] bg-[#1A3A52] text-white border-b border-[#2E5F8A] flex items-center justify-between px-[16px] md:px-[24px] lg:px-[32px] sticky top-0 z-40 shadow-[0_4px_12px_rgba(26,58,82,0.15)] transition-all duration-200 ease-in-out">
      <div className="flex items-center gap-[16px]">
        {isMobile ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-[48px] h-[48px] p-0 text-white hover:bg-[#2E5F8A] hover:text-white"
            onClick={() => setOpenMobile(true)}
          >
            <Menu className="w-6 h-6" />
          </Button>
        ) : (
          <SidebarTrigger className="w-[48px] h-[48px] p-0 text-white hover:bg-[#2E5F8A] hover:text-white" />
        )}
        <h1 className="text-[20px] font-bold leading-[30px] truncate max-w-[200px] md:max-w-none text-white">
          {getTitle()}
        </h1>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        {currentUser.role === 'captador' && onAddPropertyClick && (
          <Button
            onClick={onAddPropertyClick}
            className="hidden md:flex bg-[#4CAF50] hover:bg-[#388E3C] min-h-[48px] w-auto px-6 text-white font-bold transition-colors shadow-[0_2px_4px_rgba(76,175,80,0.3)] shrink-0 text-[14px]"
          >
            ➕ ADICIONAR IMÓVEL
          </Button>
        )}

        <Badge
          variant="secondary"
          className="flex items-center gap-2 px-[16px] py-[8px] bg-[#2E5F8A] text-white border-none cursor-pointer hover:bg-[#2E5F8A]/80 transition-colors min-h-[48px] shadow-[0_2px_4px_rgba(26,58,82,0.2)]"
          onClick={() => navigate('/app/ranking')}
        >
          <Star className="w-5 h-5 fill-white" />
          <span className="font-bold text-[14px] leading-none text-white">
            {currentUser.points || 0} pts
          </span>
        </Badge>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative w-[48px] h-[48px] min-w-[48px] text-white hover:bg-[#2E5F8A] hover:text-white"
            >
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EF4444] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-[#EF4444] items-center justify-center text-[9px] font-bold text-white border border-[#1A3A52]">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </span>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full sm:w-[400px] p-0 flex flex-col z-[1050] bg-[#F5F5F5] border-l-0 sm:border-l sm:border-[#E5E5E5]"
          >
            <SheetHeader className="p-4 border-b border-[#E5E5E5] bg-white shrink-0">
              <div className="flex justify-between items-center">
                <SheetTitle className="text-[20px] font-black text-[#1A3A52] flex items-center gap-2">
                  <Bell className="w-5 h-5" /> Notificações
                </SheetTitle>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-[12px] h-8 text-[#2E5F8A] font-bold"
                  >
                    <Check className="w-4 h-4 mr-1" /> Marcar lidas
                  </Button>
                )}
              </div>
              <SheetDescription className="hidden">
                Lista de notificações do sistema
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto">
              {safeNotificacoes.length === 0 ? (
                <div className="p-8 text-center text-[#999999] flex flex-col items-center h-full justify-center">
                  <Bell className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-bold">Nenhuma notificação</p>
                  <p className="text-sm mt-1">Você está atualizado.</p>
                </div>
              ) : (
                <div className="flex flex-col p-3 gap-2">
                  {safeNotificacoes.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (!n.lido) markAsRead(n.id)
                        if (n.dados_relacionados?.demanda_id) {
                          navigate(`/app/demandas?id=${n.dados_relacionados.demanda_id}`)
                        } else if (n.dados_relacionados?.imovel_id) {
                          navigate(`/app/disponivel-geral`)
                        }
                      }}
                      className={cn(
                        'p-4 rounded-[8px] cursor-pointer transition-all border flex gap-3 shadow-sm',
                        !n.lido ? 'bg-white' : 'bg-[#F9FAFB] opacity-70',
                        n.prioridade === 'alta' && !n.lido
                          ? 'border-l-4 border-l-[#EF4444] border-y-transparent border-r-transparent shadow-[0_2px_8px_rgba(239,68,68,0.15)]'
                          : n.prioridade === 'normal' && !n.lido
                            ? 'border-l-4 border-l-[#3B82F6] border-y-transparent border-r-transparent shadow-[0_2px_8px_rgba(59,130,246,0.15)]'
                            : !n.lido
                              ? 'border-l-4 border-l-[#6B7280] border-y-transparent border-r-transparent'
                              : 'border-transparent',
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            'text-[14px] leading-tight',
                            !n.lido ? 'font-black text-[#1A3A52]' : 'font-bold text-[#666666]',
                          )}
                        >
                          {n.titulo}
                        </p>
                        <p className="text-[13px] text-[#333333] mt-1 line-clamp-2 leading-snug">
                          {n.mensagem}
                        </p>
                        <p className="text-[11px] text-[#999999] mt-2 font-semibold">
                          {formatDistanceToNow(new Date(n.created_at), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-3 border-t border-[#E5E5E5] bg-white shrink-0">
              <Button
                variant="outline"
                className="w-full font-bold min-h-[44px]"
                onClick={() => navigate('/app/notificacoes')}
              >
                Ver Histórico Completo
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
