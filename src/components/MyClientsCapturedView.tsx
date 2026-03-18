import { useMemo, useState } from 'react'
import useAppStore from '@/stores/useAppStore'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CapturedProperty, Demand } from '@/types'
import { MapPin, DollarSign, Home, Check, X, Search } from 'lucide-react'
import { CapturedPropertyModals } from './CapturedPropertyModals'
import { getPropertyPublicUrl } from '@/lib/propertyUrl'
import { useToast } from '@/hooks/use-toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'

export function MyClientsCapturedView({ filterType }: { filterType?: 'Venda' | 'Aluguel' }) {
  const { demands, users, currentUser, markPropertyLost, scheduleVisitByCode } = useAppStore()
  const { toast } = useToast()
  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<'visita' | 'lost' | 'negocio' | null>(null)

  const [filters, setFilters] = useViewFilters('my_clients_view_' + (filterType || 'all'), {
    tipo: 'Todos',
    bairro: '',
  })
  const [isFiltering, setIsFiltering] = useState(false)

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
        if (!p.discarded) {
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

  const handleCopyLink = async (e: React.MouseEvent, url: string) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: 'Link copiado!',
        description: 'A URL do imóvel foi copiada para a área de transferência.',
      })
    } catch (err) {
      toast({
        title: 'Erro ao copiar link',
        description: 'Não foi possível copiar a URL.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="flex flex-col gap-[16px] animate-fade-in w-full">
      <StickyFilterBar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={propertyGroups.length}
        stickyTop="top-[128px] sm:top-[136px]"
      />

      {isFiltering ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-[250px] w-full rounded-[12px]" />
          ))}
        </div>
      ) : propertyGroups.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] w-full animate-fade-in">
          <Search className="w-12 h-12 text-[#999999]/30 mx-auto mb-3" />
          <p className="text-[16px] font-bold text-[#333333]">
            Nenhum imóvel captado para seus clientes
          </p>
        </div>
      ) : (
        <div className="grid gap-[16px] grid-cols-1 md:grid-cols-2">
          {propertyGroups.map((group) => {
            const publicUrl = getPropertyPublicUrl(group.property.code)
            const captadorName =
              users.find((u) => u.id === group.property.captador_id)?.name || 'Não informado'
            const captadorPhone = users.find((u) => u.id === group.property.captador_id)?.phone
            const isVisita = !!group.property.visitaDate && !group.property.fechamentoDate
            const isFechado = !!group.property.fechamentoDate

            return (
              <Card key={group.property.code} className="border-[2px] border-[#2E5F8A] shadow-sm">
                <CardContent className="p-[16px] flex flex-col gap-4">
                  <div className="flex flex-col space-y-2">
                    <div className="flex items-center gap-2 mb-1 justify-between">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-[#1A3A52] font-bold">{group.property.code}</Badge>
                        <Badge variant="outline" className="font-bold border-[#E5E5E5]">
                          {group.property.propertyType}
                        </Badge>
                      </div>
                      <Badge
                        className={cn(
                          'font-bold border-none text-white',
                          isFechado ? 'bg-[#4CAF50]' : isVisita ? 'bg-[#FF9800]' : 'bg-[#9C27B0]',
                        )}
                      >
                        {isFechado ? '🟢 Negócio' : isVisita ? '🟠 Visita' : '🟣 Captado'}
                      </Badge>
                    </div>

                    <p className="flex items-center gap-2 text-[14px] text-[#333333] font-medium leading-tight">
                      <MapPin className="w-4 h-4 text-[#1A3A52]" /> {group.property.neighborhood}
                    </p>
                    <p className="flex items-center gap-2 text-[16px] font-bold text-[#1A3A52] leading-tight">
                      <DollarSign className="w-4 h-4 text-[#1A3A52]" /> R${' '}
                      {group.property.value?.toLocaleString('pt-BR')}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="flex items-center gap-2 text-[14px] text-[#333333] font-medium leading-tight">
                        <Home className="w-4 h-4 text-[#1A3A52]" /> {group.property.bedrooms} dorm,{' '}
                        {group.property.bathrooms} banh, {group.property.parkingSpots} vagas
                      </p>
                    </div>
                    <div className="flex flex-col gap-1 border-t border-[#E5E5E5] pt-2 mt-2">
                      <p className="text-[12px] text-[#999999] leading-tight">
                        👤 Captador:{' '}
                        <span className="font-medium text-[#333333]">{captadorName}</span>
                      </p>
                      <p className="text-[12px] text-[#999999] leading-tight">
                        📅 Captação:{' '}
                        <span className="font-medium text-[#333333]">
                          {new Date(group.property.capturedAt || '').toLocaleDateString('pt-BR')}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="bg-[#F5F5F5] p-3 rounded-[8px] space-y-3 border border-[#E5E5E5] mt-auto">
                    <h4 className="font-bold text-[13px] text-[#999999] uppercase tracking-wider">
                      Clientes Interessados
                    </h4>
                    <div className="space-y-3">
                      {group.demands.map((d) => (
                        <div key={d.id} className="flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <p className="font-bold text-[14px] text-[#1A3A52] leading-tight break-words">
                              👤 {d.clientName}
                            </p>
                            <span className="text-[12px] font-bold text-[#999999] shrink-0 ml-2">
                              {d.status}
                            </span>
                          </div>

                          <div className="flex flex-col gap-2 w-full mt-1">
                            <div className="flex gap-2 w-full">
                              <Button
                                className="flex-1 bg-[#FF9800] hover:bg-[#F57C00] text-white font-bold h-[48px] text-[12px] px-1"
                                onClick={() => {
                                  setActionDemand(d)
                                  setActionProperty(group.property)
                                  setActionType('visita')
                                }}
                              >
                                👁️ Visita
                              </Button>
                              <Button
                                className="flex-1 bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-[48px] text-[12px] px-1"
                                onClick={() => {
                                  setActionDemand(d)
                                  setActionProperty(group.property)
                                  setActionType('negocio')
                                }}
                              >
                                💰 Negócio
                              </Button>
                            </div>
                            <div className="flex gap-2 w-full">
                              <Button
                                variant="outline"
                                className={cn(
                                  'flex-1 font-bold h-[48px] border-[#2E5F8A] text-[#1A3A52] text-[12px] px-1 bg-white hover:bg-[#F5F5F5]',
                                  !publicUrl && 'opacity-50 cursor-not-allowed',
                                )}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (publicUrl) window.open(publicUrl, '_blank')
                                }}
                              >
                                🔗 Ver Imóvel
                              </Button>
                              <Button
                                className="flex-1 bg-[#25D366] hover:bg-[#128C7E] text-white font-bold h-[48px] text-[12px] px-1"
                                onClick={() => {
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
                              >
                                💬 WhatsApp
                              </Button>
                            </div>
                            <Button
                              variant="destructive"
                              className="w-full font-bold h-[48px] text-[12px]"
                              onClick={() => {
                                setActionDemand(d)
                                setActionProperty(group.property)
                                setActionType('lost')
                              }}
                            >
                              ❌ Perdido
                            </Button>
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
