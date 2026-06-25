import { useState, useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { processComparativeChartData } from './chart-utils'
import { ChartSection } from './ChartSection'
import { useUserRole } from '@/hooks/use-user-role'
import { useAuth } from '@/hooks/use-auth'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

export function ChartsSdr({
  data: propData,
  loading: propLoading,
}: {
  data?: any
  loading?: boolean
}) {
  const loading = propLoading ?? false
  const { role } = useUserRole()
  const { user } = useAuth()

  const [adminView, setAdminView] = useState<'all' | 'venda' | 'locacao'>('all')

  const demandas = Array.isArray(propData?.demandas) ? propData.demandas : []
  const imoveis = [
    ...(Array.isArray(propData?.imoveisLivres) ? propData.imoveisLivres : []),
    ...(Array.isArray(propData?.imoveisSobDemanda) ? propData.imoveisSobDemanda : []),
  ]

  const { filteredDemandas, filteredImoveis } = useMemo(() => {
    let fDemandas = demandas
    let fImoveis = imoveis

    if (role === 'sdr') {
      fDemandas = demandas.filter(
        (d) =>
          d.tipo?.toLowerCase() === 'locação' ||
          d.tipo?.toLowerCase() === 'aluguel' ||
          d.tipo_demanda?.toLowerCase() === 'locação' ||
          d.tipo_demanda?.toLowerCase() === 'aluguel' ||
          d.tipo === 'Locação' ||
          d.tipo_demanda === 'Locação',
      )
      fImoveis = imoveis.filter(
        (i) =>
          i.tipo?.toLowerCase() === 'locação' ||
          i.tipo?.toLowerCase() === 'ambos' ||
          i.tipo === 'Locação' ||
          i.tipo === 'Ambos',
      )
    } else if (role === 'corretor') {
      fDemandas = demandas.filter(
        (d) =>
          d.tipo?.toLowerCase() === 'venda' ||
          d.tipo_demanda?.toLowerCase() === 'venda' ||
          d.tipo === 'Venda' ||
          d.tipo_demanda === 'Venda',
      )
      fImoveis = imoveis.filter(
        (i) =>
          i.tipo?.toLowerCase() === 'venda' ||
          i.tipo?.toLowerCase() === 'ambos' ||
          i.tipo === 'Venda' ||
          i.tipo === 'Ambos',
      )
    } else if (role === 'captador') {
      fImoveis = imoveis.filter((i) => i.user_captador_id === user?.id)
    } else if (role === 'admin' || role === 'gestor') {
      if (adminView === 'venda') {
        fDemandas = demandas.filter(
          (d) =>
            d.tipo?.toLowerCase() === 'venda' ||
            d.tipo_demanda?.toLowerCase() === 'venda' ||
            d.tipo === 'Venda' ||
            d.tipo_demanda === 'Venda',
        )
        fImoveis = imoveis.filter(
          (i) =>
            i.tipo?.toLowerCase() === 'venda' ||
            i.tipo?.toLowerCase() === 'ambos' ||
            i.tipo === 'Venda' ||
            i.tipo === 'Ambos',
        )
      } else if (adminView === 'locacao') {
        fDemandas = demandas.filter(
          (d) =>
            d.tipo?.toLowerCase() === 'locação' ||
            d.tipo?.toLowerCase() === 'aluguel' ||
            d.tipo_demanda?.toLowerCase() === 'locação' ||
            d.tipo_demanda?.toLowerCase() === 'aluguel' ||
            d.tipo === 'Locação' ||
            d.tipo_demanda === 'Locação',
        )
        fImoveis = imoveis.filter(
          (i) =>
            i.tipo?.toLowerCase() === 'locação' ||
            i.tipo?.toLowerCase() === 'ambos' ||
            i.tipo === 'Locação' ||
            i.tipo === 'Ambos',
        )
      }
    }

    return { filteredDemandas: fDemandas, filteredImoveis: fImoveis }
  }, [demandas, imoveis, role, user?.id, adminView])

  const { demandStats, inventoryStats } = useMemo(
    () => processComparativeChartData(filteredDemandas, filteredImoveis),
    [filteredDemandas, filteredImoveis],
  )

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 w-full">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  const isAdmin = role === 'admin' || role === 'gestor'

  return (
    <div className="w-full flex flex-col gap-2">
      {isAdmin && (
        <div className="flex flex-row justify-end mb-4">
          <ToggleGroup
            type="single"
            value={adminView}
            onValueChange={(v) => {
              if (v) setAdminView(v as any)
            }}
            className="bg-white border rounded-md p-1 shadow-sm"
          >
            <ToggleGroupItem
              value="all"
              className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Visão Geral
            </ToggleGroupItem>
            <ToggleGroupItem
              value="venda"
              className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Apenas Venda
            </ToggleGroupItem>
            <ToggleGroupItem
              value="locacao"
              className="h-8 px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
            >
              Apenas Locação
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      <ChartSection
        title="Análise de Demanda (O que os clientes procuram)"
        data={demandStats}
        label="Demandas"
      />

      <div className="w-full h-[1px] bg-gray-200/60 my-6" />

      <ChartSection
        title="Análise de Captação (O que temos no inventário)"
        data={inventoryStats}
        label="Imóveis"
      />
    </div>
  )
}
