import { Bell, Menu, Star, Check, AlertCircle, Home, FileText, UserPlus, ClipboardList, Link as LinkIcon, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
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

  const getNotificationIcon = (tipo: string, title: string) => {
    const t = title.toLowerCase()
    if (t.includes('perdido') || t.includes('perdida')) return <AlertCircle className="w-5 h-5 text-red-500" />
    if (t.includes('fechado') || t.includes('ganha')) return <Check className="w-5 h-5 text-emerald-500" />
    if (t.includes('visita')) return <Calendar className="w-5 h-5 text-orange-500" />
    if (t.includes('vinculad') || tipo === 'imovel_capturado') return <LinkIcon className="w-5 h-5 text-indigo-500" />
    if (tipo === 'nova_demanda') return <ClipboardList className="w-5 h-5 text-blue-500" />
    if (tipo === 'novo_imovel') return <Home className="w-5 h-5 text-emerald-500" />
    return <Bell className="w-5 h-5 text-gray-500" />
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

        <Popover>
          <PopoverTrigger asChild>
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
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="end"
            className="w-[380px] p-0 flex flex-col z-[1050] bg-white border border-[#E5E5E5] shadow-xl rounded-xl overflow-hidden"
          >
            <div className="p-4 border-b border-[#E5E5E5] bg-[#F9FAFB] flex justify-between items-center shrink-0">
              <h3 className="text-[16px] font-black text-[#1A3A52] flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notificações
              </h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="bg-[#1A3A52] text-white hover:bg-[#2E5F8A]">
                  {unreadCount} novas
                </Badge>
              )}
            </div>

            <ScrollArea className="flex-1 max-h-[400px] overflow-y-auto">
              {safeNotificacoes.length === 0 ? (
                <div className="p-8 text-center text-[#999999] flex flex-col items-center justify-center">
                  <Bell className="w-12 h-12 opacity-20 mb-3" />
                  <p className="font-bold">Nenhuma notificação</p>
                  <p className="text-sm mt-1">Você está atualizado.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {safeNotificacoes.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-4 cursor-pointer transition-all border-b border-gray-100 flex gap-3 hover:bg-gray-50',
                        !n.lido ? 'bg-blue-50/30' : 'bg-white opacity-80',
                      )}
                      onClick={() => {
                        if (!n.lido) markAsRead(n.id)
                        if (n.dados_relacionados?.status === 'perdido') {
                          navigate(`/app/perdidos`)
                        } else if (n.dados_relacionados?.demanda_id) {
                          navigate(`/app/demandas?id=${n.dados_relacionados.demanda_id}`)
                        } else if (n.dados_relacionados?.imovel_id) {
                          navigate(`/app/disponivel-geral`)
                        }
                      }}
                    >
                      <div className="mt-1 shrink-0 bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                        {getNotificationIcon(n.tipo, n.titulo)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                          <p
                            className={cn(
                              'text-[14px] leading-tight pr-2',
                              !n.lido ? 'font-bold text-[#1A3A52]' : 'font-medium text-[#666666]',
                            )}
                          >
                            {n.titulo}
                          </p>
                          <span className="text-[10px] text-[#999999] font-medium whitespace-nowrap">
                            {formatDistanceToNow(new Date(n.created_at), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        <p className="text-[13px] text-[#4B5563] mt-1 line-clamp-2 leading-snug">
                          {n.mensagem}
                        </p>

                        <div className="flex items-center justify-between mt-3">
                          <span
                            className={cn(
                              'text-[11px] font-semibold px-2 py-0.5 rounded-full',
                              n.prioridade === 'alta'
                                ? 'bg-red-100 text-red-700'
                                : n.prioridade === 'normal'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700',
                            )}
                          >
                            {n.prioridade.toUpperCase()}
                          </span>

                          {!n.lido && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                markAsRead(n.id)
                              }}
                            >
                              <Check className="w-3 h-3 mr-1" /> Marcar como lido
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            <div className="p-2 border-t border-[#E5E5E5] bg-[#F9FAFB] shrink-0 grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full text-[13px] font-bold h-9"
                onClick={() => navigate('/app/notificacoes')}
              >
                Ver Todas
              </Button>
              <Button
                variant="default"
                className="w-full text-[13px] font-bold h-9 bg-[#1A3A52] hover:bg-[#2E5F8A]"
                onClick={() => markAllAsRead()}
                disabled={unreadCount === 0}
              >
                Limpar Tudo
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
