import { useMemo, useState, useEffect } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CapturedProperty, Demand } from '@/types'
import {
  MapPin,
  DollarSign,
  Home,
  Search,
  Link2,
  Eye,
  Handshake,
  ExternalLink,
  MessageCircle,
} from 'lucide-react'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { FilterSidebar } from '@/components/FilterSidebar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeletedProperties } from '@/hooks/useDeletedProperties'

export function MyClientsCapturedView({ filterType }: { filterType?: 'Venda' | 'Aluguel' }) {
  const deletedIds = useDeletedProperties()
  const {
    demands,
    users,
    currentUser,
    markPropertyLost,
    scheduleVisitByCode,
    notifications,
    markNotificationAsRead,
  } = useAppStore()
  const { toast } = useToast()
  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<'visita' | 'lost' | 'negocio' | null>(null)

  const [filters, setFilters] = useViewFilters('my_clients_view_' + (filterType || 'all'), {
    tipo: 'Todos',
    bairro: '',
  })
  const [isFiltering, setIsFiltering] = useState(false)

  useEffect(() => {
    const unreadCaptados = notifications.filter(
      (n) => n.usuario_id === currentUser?.id && !n.lida && n.tipo_notificacao === 'novo_imovel',
    )
    unreadCaptados.forEach((n) => markNotificationAsRead(n.id))
  }, [notifications, currentUser, markNotificationAsRead])

  const FILTERS: FilterDef[] = [{ id: 'bairro', label: 'Bairro', isSearch: true, options: [] }]

  if (!filterType) {
    FILTERS.unshift({
      id: 'tipo',
      label: 'Tipo',
      options: [
        { value: 'Todos', label: 'Todos' },
        { value: 'Venda', label: 'Venda', icon: '🏢' },
        { value: 'Aluguel', label: 'Aluguel', icon: '🏠' },
      ],
    })
  }

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsFiltering(true)
    setFilters(newF)
    setTimeout(() => setIsFiltering(false), 250)
  }

  const propertyGroups = useMemo(() => {
    let myDemands = demands.filter((d) => d.createdBy === currentUser?.id)
    if (filterType) myDemands = myDemands.filter((d) => d.type === filterType)
    if (!filterType && filters.tipo !== 'Todos')
      myDemands = myDemands.filter((d) => d.type === filters.tipo)

    const propMap = new Map<string, { property: CapturedProperty; demands: Demand[] }>()

    myDemands.forEach((d) => {
      d.capturedProperties?.forEach((p) => {
        if (!p.discarded && !deletedIds.includes(p.id || '') && !deletedIds.includes(p.code)) {
          if (
            filters.bairro &&
            !p.neighborhood?.toLowerCase().includes(filters.bairro.toLowerCase())
          )
            return

          if (!propMap.has(p.code)) propMap.set(p.code, { property: p, demands: [] })
          if (!propMap.get(p.code)!.demands.find((x) => x.id === d.id)) {
            propMap.get(p.code)!.demands.push(d)
          }
        }
      })
    })

    return Array.from(propMap.values()).sort(
      (a, b) =>
        new Date(b.property.capturedAt || '').getTime() -
        new Date(a.property.capturedAt || '').getTime(),
    )
  }, [demands, currentUser, filterType, filters])

  return (
    <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full animate-fade-in transition-opacity duration-150 ease-in">
      <FilterSidebar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={propertyGroups.length}
      />

      <div className="flex-1 w-full flex flex-col gap-[16px] min-w-0">
        <div className="lg:hidden w-full">
          <StickyFilterBar
            filters={FILTERS}
            values={filters}
            onChange={handleFilterChange}
            resultsCount={propertyGroups.length}
            stickyTop="top-[128px] sm:top-[136px]"
          />
        </div>

        {isFiltering ? (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 pt-4 pb-4">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-[12px] animate-fast-pulse" />
            ))}
          </div>
        ) : propertyGroups.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] w-full animate-fade-in flex flex-col items-center justify-center">
            <div className="text-[64px] leading-none mb-4">🏠</div>
            <p className="text-[18px] font-bold text-[#333333]">
              Nenhum imóvel captado para seus clientes
            </p>
          </div>
        ) : (
          <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 relative z-0 pt-4 pb-4">
            {propertyGroups.map((group) => {
              const publicUrl = getPropertyPublicUrl(group.property.code)
              const captadorName =
                users.find((u) => u.id === group.property.captador_id)?.name || 'Não informado'
              const captadorPhone = users.find((u) => u.id === group.property.captador_id)?.phone
              const isVisita = !!group.property.visitaDate && !group.property.fechamentoDate
              const isFechado = !!group.property.fechamentoDate

              const captureDateStr = group.property.capturedAt
                ? new Date(group.property.capturedAt).toLocaleDateString('pt-BR')
                : (() => {
                    if (import.meta.env.DEV)
                      console.error(`Data ausente em card [${group.property.code}]`)
                    return 'Data pendente'
                  })()

              return (
                <Card
                  key={group.property.code}
                  className="border-[2px] border-[#2E5F8A] shadow-sm flex flex-col h-full rounded-[16px] overflow-visible relative transition-all duration-150 ease-in-out hover:shadow-lg"
                >
                  <CardContent className="p-0 flex flex-col gap-0 flex-1 z-0 relative pointer-events-none">
                    <div className="px-4 pt-4 pb-3 border-b border-[#E5E5E5] bg-[#F5F5F5]/50 flex flex-col gap-3 pointer-events-auto relative z-10 rounded-t-[14px]">
                      {/* Date and Status Header */}
                      <div className="flex justify-between items-start">
                        <span className="text-[12px] text-[#6B7280] font-sans font-bold bg-white px-2.5 py-1.5 rounded-[6px] border border-[#E5E5E5] shadow-sm flex items-center gap-1.5">
                          📅 {captureDateStr}
                        </span>
                        <Badge
                          className={cn(
                            'font-bold border-none text-white text-[12px] px-2 py-1 shadow-sm uppercase tracking-wider',
                            isFechado ? 'bg-[#4CAF50]' : isVisita ? 'bg-[#FF9800]' : 'bg-[#3B82F6]',
                          )}
                        >
                          {isFechado ? '🟢 Negócio' : isVisita ? '🟠 Visita' : '🔵 Captado'}
                        </Badge>
                      </div>

                      {/* Code and Banner */}
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#1A3A52] font-bold text-[14px] shadow-sm px-2 py-1">
                          {group.property.code}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="font-bold border-[#E5E5E5] text-[10px] px-2 py-1 uppercase bg-white text-[#1A3A52] shadow-sm"
                        >
                          {group.property.propertyType || filterType || 'Venda'}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 flex flex-col space-y-3 relative z-0 pointer-events-none">
                      <p className="flex items-start gap-1.5 text-[14px] text-[#333333] font-medium leading-tight mt-1 pointer-events-auto">
                        <MapPin className="w-4 h-4 text-[#F44336] shrink-0 mt-0.5" />{' '}
                        <span className="line-clamp-2">{group.property.neighborhood}</span>
                      </p>
                      <p className="flex items-center gap-2 text-[16px] font-black text-[#10B981] tracking-tight pointer-events-auto">
                        <DollarSign className="w-4 h-4 text-[#10B981] shrink-0" /> R${' '}
                        {group.property.value?.toLocaleString('pt-BR')}
                      </p>
                      <div className="flex items-center justify-between pointer-events-auto">
                        <p className="flex items-center gap-2 text-[13px] text-[#666666] font-medium bg-[#F8FAFC] px-2 py-1.5 rounded-md border border-[#E5E5E5] w-full">
                          <Home className="w-4 h-4 text-[#1A3A52] shrink-0" />{' '}
                          {group.property.bedrooms} dorm, {group.property.bathrooms} banh,{' '}
                          {group.property.parkingSpots} vagas
                        </p>
                      </div>
                      <div className="flex flex-col gap-1 border-t border-[#E5E5E5] pt-3 mt-2 pointer-events-auto">
                        <p className="text-[12px] text-[#999999] leading-tight">
                          👤 Captador:{' '}
                          <span className="font-medium text-[#333333]">{captadorName}</span>
                        </p>
                      </div>
                    </div>

                    {/* Customers Block with Actions */}
                    <div className="px-4 pt-4 pb-4 bg-[#F5F5F5] space-y-3 border-t border-[#E5E5E5] mt-auto relative z-10 pointer-events-auto rounded-b-[14px]">
                      <h4 className="font-bold text-[13px] text-[#999999] uppercase tracking-wider">
                        Clientes Interessados
                      </h4>
                      <div className="space-y-4">
                        {group.demands.map((d) => (
                          <div
                            key={d.id}
                            className="flex flex-col gap-3 border-b border-[#E5E5E5] pb-4 last:border-0 last:pb-0"
                          >
                            <div className="flex items-center justify-between">
                              <p className="font-bold text-[14px] text-[#1A3A52] leading-tight break-words flex items-center gap-1.5">
                                👤 {d.clientName}
                              </p>
                              <span className="text-[11px] font-bold text-[#999999] shrink-0 bg-white px-2 py-0.5 rounded-md border border-[#E5E5E5] shadow-sm">
                                {d.status}
                              </span>
                            </div>

                            <div className="flex flex-col lg:flex-row flex-wrap gap-2 w-full mt-1 relative z-20">
                              <Button
                                className="flex-1 h-11 min-h-[44px] bg-[#10B981] hover:bg-[#059669] text-white font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out active:shadow-inner border-none w-full lg:w-auto"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (import.meta.env.DEV)
                                    console.log(
                                      'Botão [negocio] clicado em [MyClientsCapturedView]',
                                    )
                                  setActionDemand(d)
                                  setActionProperty(group.property)
                                  setActionType('negocio')
                                }}
                                aria-label={`Fechar negócio para cliente ${d.clientName}`}
                              >
                                <Handshake className="w-[14px] h-[14px] mr-1.5 shrink-0" />
                                <span className="truncate">Negócio</span>
                              </Button>

                              <Button
                                className="flex-1 h-11 min-h-[44px] bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold text-[13px] px-2 shadow-sm transition-all duration-150 ease-in-out active:shadow-inner border-none w-full lg:w-auto"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (import.meta.env.DEV)
                                    console.log('Botão [visita] clicado em [MyClientsCapturedView]')
                                  setActionDemand(d)
                                  setActionProperty(group.property)
                                  setActionType('visita')
                                }}
                                aria-label={`Agendar visita para cliente ${d.clientName}`}
                              >
                                <Eye className="w-[14px] h-[14px] mr-1.5 shrink-0" />
                                <span className="truncate">Visita</span>
                              </Button>

                              <Button
                                variant="destructive"
                                className="flex-1 h-11 min-h-[44px] font-bold text-[13px] bg-[#F44336] hover:bg-[#d32f2f] text-white transition-all duration-150 ease-in-out active:shadow-inner w-full lg:w-auto"
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  if (import.meta.env.DEV)
                                    console.log(
                                      'Botão [perdido] clicado em [MyClientsCapturedView]',
                                    )
                                  setActionDemand(d)
                                  setActionProperty(group.property)
                                  setActionType('lost')
                                }}
                                aria-label={`Marcar imóvel como perdido para ${d.clientName}`}
                              >
                                ❌ Perdido
                              </Button>

                              <div className="flex gap-2 w-full lg:w-auto lg:flex-1 order-last lg:order-none">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      className={cn(
                                        'flex-1 font-bold h-11 min-h-[44px] border-[#2E5F8A] text-[#1A3A52] text-[13px] bg-white hover:bg-gray-100 dark:hover:bg-gray-800 px-2 transition-all duration-150 ease-in-out active:shadow-inner shadow-sm',
                                        !publicUrl &&
                                          'opacity-50 cursor-not-allowed text-[#999999] border-[#E5E5E5]',
                                      )}
                                      disabled={!publicUrl}
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        if (import.meta.env.DEV)
                                          console.log(
                                            'Botão [ver_no_site] clicado em [MyClientsCapturedView]',
                                          )
                                        if (publicUrl) {
                                          window.open(publicUrl, '_blank')
                                        } else {
                                          toast({
                                            title: 'Erro',
                                            description: 'Ação indisponível',
                                            variant: 'destructive',
                                          })
                                        }
                                      }}
                                      aria-label={`Ver imóvel ${group.property.code} no site`}
                                    >
                                      <ExternalLink className="w-[14px] h-[14px] mr-1.5 shrink-0" />
                                      <span className="truncate">Ver Imóvel</span>
                                    </Button>
                                  </TooltipTrigger>
                                  {!publicUrl && (
                                    <TooltipContent zIndex={1100}>
                                      <p>Imóvel sem código cadastrado</p>
                                    </TooltipContent>
                                  )}
                                </Tooltip>

                                <Button
                                  className="w-[44px] h-11 min-h-[44px] p-0 shrink-0 bg-[#25D366] hover:bg-[#128C7E] text-white transition-all duration-150 ease-in-out active:shadow-inner border-none shadow-sm"
                                  onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (import.meta.env.DEV)
                                      console.log(
                                        'Botão [whatsapp] clicado em [MyClientsCapturedView]',
                                      )
                                    if (captadorPhone) {
                                      window.open(
                                        `https://wa.me/${captadorPhone.replace(/\D/g, '')}`,
                                        '_blank',
                                      )
                                    } else {
                                      toast({
                                        title: 'Telefone indisponível',
                                        description: 'O captador não possui número cadastrado.',
                                        variant: 'destructive',
                                      })
                                    }
                                  }}
                                  aria-label={`Contatar captador via WhatsApp`}
                                >
                                  <MessageCircle className="w-[16px] h-[16px]" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      <CapturedPropertyModals
        demand={actionDemand}
        property={actionProperty}
        actionType={actionType}
        onClose={() => setActionType(null)}
        onSubmitVisita={(data) => {
          if (actionProperty?.code) scheduleVisitByCode(actionProperty.code, data)
          setActionType(null)
        }}
        onSubmitProposta={() => {}}
        onSubmitNegocio={() => {}}
        onSubmitLost={(data) => {
          if (actionProperty?.code && actionDemand?.id) {
            markPropertyLost(actionProperty.code, actionDemand.id, data.reason, data.obs)
          }
          setActionType(null)
        }}
      />
    </div>
  )
}
