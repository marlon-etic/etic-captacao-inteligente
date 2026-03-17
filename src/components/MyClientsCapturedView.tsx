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
  const { demands, currentUser, markPropertyLost, scheduleVisitByCode } = useAppStore()
  const { toast } = useToast()
  const [actionDemand, setActionDemand] = useState<Demand | null>(null)
  const [actionProperty, setActionProperty] = useState<CapturedProperty | null>(null)
  const [actionType, setActionType] = useState<'visita' | 'lost' | null>(null)

  const [filters, setFilters] = useViewFilters('my_clients_view', { tipo: 'Todos', bairro: '' })
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
    <div className="flex flex-col gap-4 animate-fade-in">
      <StickyFilterBar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={propertyGroups.length}
      />

      {isFiltering ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-[250px] w-full rounded-[12px]" />
          ))}
        </div>
      ) : propertyGroups.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] border rounded-xl border-dashed border-[#E5E5E5] w-full animate-fade-in">
          <Search className="w-12 h-12 text-[#999999]/30 mx-auto mb-3" />
          <p className="text-[16px] font-bold text-[#333333]">
            Nenhum imóvel captado para seus clientes
          </p>
        </div>
      ) : (
        propertyGroups.map((group) => {
          const publicUrl = getPropertyPublicUrl(group.property.code)

          return (
            <Card key={group.property.code} className="border-[2px] border-[#2E5F8A] shadow-sm">
              <CardContent className="p-4 flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge className="bg-[#1A3A52] font-bold">{group.property.code}</Badge>
                    <Badge variant="outline" className="font-bold border-[#E5E5E5]">
                      {group.property.propertyType}
                    </Badge>
                  </div>

                  <p className="flex items-center gap-2 text-sm text-[#333333] font-medium">
                    <span>🏷️ Código:</span>
                    <a
                      href={publicUrl || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        'font-bold text-[#1A3A52] hover:underline',
                        !publicUrl && 'pointer-events-none text-gray-400',
                      )}
                      onClick={(e) => {
                        if (!publicUrl) e.preventDefault()
                        e.stopPropagation()
                      }}
                    >
                      {group.property.code || 'N/A'}
                    </a>
                  </p>

                  <p className="flex items-center gap-2 text-sm text-[#333333] font-medium">
                    <MapPin className="w-4 h-4 text-[#1A3A52]" /> {group.property.neighborhood}
                  </p>
                  <p className="flex items-center gap-2 text-[16px] font-bold text-[#1A3A52]">
                    <DollarSign className="w-4 h-4 text-[#1A3A52]" /> R${' '}
                    {group.property.value?.toLocaleString('pt-BR')}
                  </p>
                  <p className="flex items-center gap-2 text-sm text-[#333333] font-medium">
                    <Home className="w-4 h-4 text-[#1A3A52]" /> {group.property.bedrooms} dorm,{' '}
                    {group.property.parkingSpots} vagas
                  </p>

                  <div className="flex flex-row gap-[8px] w-full pt-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className={cn(
                            'flex-1 font-bold h-[40px] md:h-[44px]',
                            publicUrl
                              ? 'bg-[#1A3A52] hover:bg-[#153045] text-white'
                              : 'bg-[#E5E5E5] text-[#999999] hover:bg-[#E5E5E5] cursor-not-allowed',
                          )}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (publicUrl) window.open(publicUrl, '_blank')
                          }}
                        >
                          👁️ Visualizar no Site
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          {publicUrl
                            ? 'Visualizar imóvel em www.eticimoveis.com.br'
                            : 'Código do imóvel não informado'}
                        </p>
                      </TooltipContent>
                    </Tooltip>

                    <Button
                      variant="outline"
                      className={cn(
                        'w-[40px] md:w-[44px] h-[40px] md:h-[44px] p-0 shrink-0 border-[2px]',
                        publicUrl
                          ? 'border-[#2E5F8A] text-[#1A3A52] hover:bg-[#F5F5F5]'
                          : 'border-[#E5E5E5] text-[#999999] hover:bg-transparent cursor-not-allowed',
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (publicUrl) handleCopyLink(e, publicUrl)
                      }}
                      title="Copiar Link"
                    >
                      📋
                    </Button>
                  </div>
                </div>

                <div className="flex-1 md:flex-[2] bg-[#F5F5F5] p-4 rounded-xl space-y-4 border border-[#E5E5E5]">
                  <h4 className="font-bold text-sm text-[#999999] uppercase tracking-wider">
                    Clientes Correspondentes
                  </h4>
                  <div className="space-y-3">
                    {group.demands.map((d) => (
                      <div
                        key={d.id}
                        className="bg-[#FFFFFF] p-3 rounded-lg border border-[#E5E5E5] flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-[14px] text-[#1A3A52]">{d.clientName}</p>
                          <p className="text-[12px] text-[#999999] font-medium">
                            Demanda: R$ {d.maxBudget?.toLocaleString('pt-BR')} • Status: {d.status}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            size="sm"
                            className="flex-1 sm:flex-none bg-[#4CAF50] hover:bg-[#388E3C] text-white font-bold h-[36px]"
                            onClick={() => {
                              setActionDemand(d)
                              setActionProperty(group.property)
                              setActionType('visita')
                            }}
                          >
                            <Check className="w-4 h-4 mr-1" /> Agendar Visita para {d.clientName}
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none font-bold h-[36px]"
                            onClick={() => {
                              setActionDemand(d)
                              setActionProperty(group.property)
                              setActionType('lost')
                            }}
                          >
                            <X className="w-4 h-4 mr-1" /> Perdido para {d.clientName}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
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
