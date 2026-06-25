import { useState, useMemo, useEffect, useRef } from 'react'
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
  const containerRef = useRef<HTMLDivElement>(null)

  const [adminView, setAdminView] = useState<'all' | 'venda' | 'locacao'>('all')

  useEffect(() => {
    // Find parent containers with grid layout and remove to allow full width for charts
    const parentGrids = [
      containerRef.current?.closest('.lg\\:grid-cols-2'),
      containerRef.current?.closest('.md\\:grid-cols-2'),
      containerRef.current?.closest('.grid-cols-2'),
      containerRef.current?.closest('.xl\\:grid-cols-2'),
      containerRef.current?.closest('.xl\\:col-span-1'),
      containerRef.current?.closest('.lg\\:col-span-1'),
    ]

    parentGrids.forEach((el) => {
      if (el) {
        el.classList.remove(
          'lg:grid-cols-2',
          'md:grid-cols-2',
          'grid-cols-2',
          'xl:grid-cols-2',
          'xl:col-span-1',
          'lg:col-span-1',
        )
        if (!el.classList.contains('grid-cols-1')) {
          el.classList.add('grid-cols-1')
        }
        if (!el.classList.contains('col-span-full')) {
          el.classList.add('col-span-full')
        }
      }
    })
  }, [])

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

  const { demandStats, inventoryStats } = useMemo(() => {
    return processComparativeChartData(filteredDemandas, filteredImoveis)
  }, [filteredDemandas, filteredImoveis])

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full col-span-full">
        <Skeleton className="h-[400px] w-full rounded-xl" />
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div ref={containerRef} className="flex flex-col gap-8 w-full col-span-full animate-fade-in">
      {(role === 'admin' || role === 'gestor') && (
        <div className="flex justify-center md:justify-start">
          <ToggleGroup
            type="single"
            value={adminView}
            onValueChange={(v) => {
              if (v) setAdminView(v as 'all' | 'venda' | 'locacao')
            }}
            className="bg-muted p-1 rounded-lg"
          >
            <ToggleGroupItem
              value="all"
              className="rounded-md px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              Visão Geral
            </ToggleGroupItem>
            <ToggleGroupItem
              value="venda"
              className="rounded-md px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              Vendas
            </ToggleGroupItem>
            <ToggleGroupItem
              value="locacao"
              className="rounded-md px-4 data-[state=on]:bg-background data-[state=on]:shadow-sm"
            >
              Locação
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}

      {/* Demand Analysis (Top Row) */}
      <div className="w-full">
        <ChartSection
          title="Análise de Demandas"
          description="Perfil das demandas dos clientes no período selecionado"
          data={demandStats}
        />
      </div>

      {/* Capturing Analysis (Bottom Row) */}
      <div className="w-full">
        <ChartSection
          title="Análise de Captação"
          description={
            role === 'captador'
              ? 'Perfil dos seus imóveis captados no período'
              : 'Perfil do inventário de imóveis captados no período'
          }
          data={inventoryStats}
        />
      </div>
    </div>
  )
}
