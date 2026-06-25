import { useMemo } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { processChartData } from './chart-utils'
import { ChartSection } from './ChartSection'

export function ChartsSdr({
  data: propData,
  loading: propLoading,
}: {
  data?: any
  loading?: boolean
}) {
  const loading = propLoading ?? false

  const demandas = Array.isArray(propData?.demandas) ? propData.demandas : []
  const imoveis = [
    ...(Array.isArray(propData?.imoveisLivres) ? propData.imoveisLivres : []),
    ...(Array.isArray(propData?.imoveisSobDemanda) ? propData.imoveisSobDemanda : []),
  ]

  const demandStats = useMemo(() => processChartData(demandas, 'demanda', 'Demandas'), [demandas])
  const inventoryStats = useMemo(() => processChartData(imoveis, 'imovel', 'Imóveis'), [imoveis])

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-10 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
          <Skeleton className="h-[380px] w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex flex-col gap-2">
      <ChartSection
        title="Análise de Demanda (O que os clientes procuram)"
        data={demandStats}
        label="Demandas"
        color1="#3b82f6"
        color2="#f59e0b"
      />

      <div className="w-full h-[1px] bg-gray-200/60 my-6" />

      <ChartSection
        title="Análise de Captação (O que temos no inventário)"
        data={inventoryStats}
        label="Imóveis"
        color1="#3b82f6"
        color2="#f59e0b"
      />
    </div>
  )
}
