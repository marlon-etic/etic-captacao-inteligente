import {
  Bell,
  Menu,
  Star,
  Check,
  Home,
  CheckCircle2,
  XCircle,
  FileText,
  Calendar,
  DollarSign,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { useNavigate, useLocation } from 'react-router-dom'
import { AppNotification } from '@/types'

const getNotifIcon = (type: string) => {
  switch (type) {
    case 'novo_imovel':
      return <Home className="w-5 h-5 text-[#1A3A52]" />
    case 'reivindicado':
      return <CheckCircle2 className="w-5 h-5 text-[#4CAF50]" />
    case 'ja_reivindicado':
      return <XCircle className="w-5 h-5 text-[#F44336]" />
    case 'demanda_respondida':
      return <FileText className="w-5 h-5 text-[#2E5F8A]" />
    case 'perdido':
      return <X className="w-5 h-5 text-[#999999]" />
    case 'visita':
      return <Calendar className="w-5 h-5 text-[#FF9800]" />
    case 'negocio':
      return <DollarSign className="w-5 h-5 text-[#388E3C]" />
    default:
      return <Bell className="w-5 h-5 text-[#999999]" />
  }
}

interface AppHeaderProps {
  onAddPropertyClick?: () => void
}

export function AppHeader({ onAddPropertyClick }: AppHeaderProps) {
  const store = useAppStore()
  const currentUser = store.currentUser
  const navigate = useNavigate()
  const location = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()

  if (!currentUser) return null

  const notifications =
    store.notifications?.filter(
      (n: AppNotification) => n.usuario_id === currentUser.id && !n.arquivada,
    ) || []
  const unreadCount = notifications.filter((n: AppNotification) => !n.lida).length
  const { markNotificationAsRead, markAllNotificationsAsRead } = store

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
            {currentUser.points} pts
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
                <span className="absolute top-2 right-2 w-3 h-3 bg-[#F44336] rounded-full border-2 border-[#1A3A52] animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-[320px] sm:w-[380px] p-0 overflow-hidden shadow-[0_8px_24px_rgba(26,58,82,0.15)] border-[#2E5F8A] bg-[#FFFFFF]"
          >
            <div className="flex flex-col max-h-[80vh]">
              <div className="flex items-center justify-between p-4 border-b border-[#2E5F8A]/20 bg-[#F5F5F5]">
                <h4 className="font-bold text-[20px] leading-[24px] text-[#1A3A52]">
                  Notificações
                </h4>
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[48px] px-[16px] py-[8px] text-[14px] font-bold text-[#2E5F8A] hover:bg-[#FFFFFF] hover:text-[#1A3A52]"
                    onClick={() => markAllNotificationsAsRead()}
                  >
                    <Check className="w-4 h-4 mr-1.5" /> Marcar lidas
                  </Button>
                )}
              </div>
              <div className="overflow-y-auto p-3 flex flex-col gap-3">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-[#999999]">
                    <Bell className="w-10 h-10 mx-auto mb-3 opacity-20" />
                    <p className="text-[14px] leading-[20px] font-medium text-[#333333]">
                      Nenhuma notificação
                    </p>
                  </div>
                ) : (
                  notifications.slice(0, 10).map((n: AppNotification) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-4 rounded-[8px] border-[2px] transition-all duration-200 ease-in-out flex items-start gap-3',
                        n.lida
                          ? 'bg-[#FFFFFF] border-transparent hover:bg-[#F5F5F5]'
                          : 'bg-[#F5F5F5] border-[#2E5F8A]/20 shadow-[0_2px_4px_rgba(26,58,82,0.1)] cursor-pointer hover:border-[#2E5F8A]/40',
                      )}
                      onClick={() => {
                        if (!n.lida) markNotificationAsRead(n.id)
                        if (n.acao_url && !n.acao_botao) navigate(n.acao_url)
                      }}
                    >
                      <div className="mt-0.5 shrink-0 bg-[#FFFFFF] rounded-full p-2 shadow-[0_2px_4px_rgba(26,58,82,0.1)] border border-[#2E5F8A]/20 w-[40px] h-[40px] flex items-center justify-center">
                        {getNotifIcon(n.tipo_notificacao)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-[14px] md:text-[16px] leading-[20px] text-[#1A3A52]">
                          {n.titulo}
                        </p>
                        <p className="text-[12px] md:text-[14px] leading-[16px] md:leading-[20px] mt-1 text-[#333333]">
                          {n.corpo}
                        </p>

                        {n.detalhes && (
                          <div className="bg-[#FFFFFF] rounded-[8px] p-2.5 mt-2 flex flex-wrap gap-x-2 gap-y-1.5 border border-[#2E5F8A]/20 shadow-[inset_0_1px_2px_rgba(26,58,82,0.05)]">
                            {Object.entries(n.detalhes).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[12px] leading-[16px] font-bold text-[#999999] block w-full truncate"
                              >
                                {String(k).replace('_', ' ').toUpperCase()}:{' '}
                                <span className="text-[#1A3A52]">{String(v)}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {n.acao_botao && (
                          <Button
                            variant={n.urgencia === 'alta' ? 'default' : 'secondary'}
                            className="mt-3 w-full min-h-[48px]"
                            onClick={(e) => {
                              e.stopPropagation()
                              if (!n.lida) markNotificationAsRead(n.id)
                              if (n.acao_url) navigate(n.acao_url)
                            }}
                          >
                            {n.acao_botao}
                          </Button>
                        )}
                        <div className="text-[12px] leading-[16px] text-[#999999] mt-2 font-bold text-right w-full">
                          {new Date(n.data_criacao).toLocaleString('pt-BR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="p-3 border-t border-[#2E5F8A]/20 bg-[#F5F5F5]">
                <Button
                  variant="outline"
                  className="w-full text-[14px] font-bold min-h-[48px]"
                  onClick={() => navigate('/app/notificacoes')}
                >
                  Ver todas as notificações
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
