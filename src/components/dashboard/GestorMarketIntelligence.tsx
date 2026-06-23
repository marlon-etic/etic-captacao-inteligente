import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts'
import { TrendingUp, AlertTriangle } from 'lucide-react'
import { useIsMobile } from '@/hooks/use-mobile'

export function GestorMarketIntelligence() {
  const [data, setData] = useState<{ demandas: any[]; imoveis: any[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const isMobile = useIsMobile()

  useEffect(() => {
    Promise.all([
      supabase
        .from('imoveis_captados')
        .select(
          'tipo, tipo_imovel, preco, valor, dormitorios, vagas, endereco, localizacao_texto, etapa_funil, status_captacao',
        ),
      supabase
        .from('demandas_locacao')
        .select(
          'tipo_imovel, valor_maximo, orcamento_max, dormitorios, quartos, vagas, vagas_estacionamento, bairros, localizacoes, status_demanda',
        ),
      supabase
        .from('demandas_vendas')
        .select(
          'tipo_imovel, valor_maximo, orcamento_max, dormitorios, quartos, vagas, vagas_estacionamento, bairros, localizacoes, status_demanda',
        ),
    ]).then(([resImv, resLoc, resVen]) => {
      const loc = (resLoc.data || []).map((d) => ({ ...d, tipo_geral: 'Locação' }))
      const ven = (resVen.data || []).map((d) => ({ ...d, tipo_geral: 'Venda' }))
      const imv = resImv.data || []

      setData({ demandas: [...loc, ...ven], imoveis: imv })
      setIsLoading(false)
    })
  }, [])

  const chartsData = useMemo(() => {
    if (!data) return { tipologia: [], bairros: [], precos: [], specs: [] }

    const isAtiva = (d: any) => {
      const s = (d.status_demanda || '').toLowerCase()
      return (
        !s.includes('perdid') &&
        !s.includes('fechad') &&
        !s.includes('inativ') &&
        !s.includes('impossível')
      )
    }

    const isAvailable = (i: any) => {
      const st = (i.status_captacao || '').toLowerCase()
      const funil = (i.etapa_funil || '').toLowerCase()
      return !st.includes('inativ') && !funil.includes('fechado') && !funil.includes('perdido')
    }

    const ativas = data.demandas.filter(isAtiva)
    const disponiveis = data.imoveis.filter(isAvailable)

    const buildChartData = (
      demandsKeyFn: (d: any) => string | null,
      imoveisKeyFn: (i: any) => string | null,
      limit = 5,
    ) => {
      const map = new Map<string, { name: string; Demanda: number; Oferta: number }>()

      ativas.forEach((d) => {
        const k = demandsKeyFn(d)
        if (!k) return
        if (!map.has(k)) map.set(k, { name: k, Demanda: 0, Oferta: 0 })
        map.get(k)!.Demanda++
      })

      disponiveis.forEach((i) => {
        const k = imoveisKeyFn(i)
        if (!k) return
        if (!map.has(k)) map.set(k, { name: k, Demanda: 0, Oferta: 0 })
        map.get(k)!.Oferta++
      })

      return Array.from(map.values())
        .sort((a, b) => b.Demanda - a.Demanda)
        .slice(0, limit)
    }

    const tipologia = buildChartData(
      (d) => d.tipo_imovel || 'Outro',
      (i) => i.tipo_imovel || 'Outro',
      5,
    )

    const bairros = buildChartData(
      (d) => {
        const b = d.bairros?.[0] || d.localizacoes?.[0]
        return b ? b.split(',')[0].trim() : null
      },
      (i) => {
        const loc = i.localizacao_texto || i.endereco
        if (!loc) return null
        const parts = loc.split(',')
        return parts.length > 1 ? parts[1].trim() : loc.substring(0, 15).trim()
      },
      6,
    )

    const precos = buildChartData(
      (d) => {
        const v = d.valor_maximo || d.orcamento_max || 0
        if (v === 0) return null
        if (d.tipo_geral === 'Venda') {
          if (v <= 500000) return 'V: Até 500k'
          if (v <= 1000000) return 'V: 500k-1M'
          return 'V: 1M+'
        } else {
          if (v <= 3000) return 'L: Até 3k'
          if (v <= 6000) return 'L: 3k-6k'
          return 'L: 6k+'
        }
      },
      (i) => {
        const v = i.preco || i.valor || 0
        if (v === 0) return null
        const isVenda = i.tipo === 'Venda' || v > 50000
        if (isVenda) {
          if (v <= 500000) return 'V: Até 500k'
          if (v <= 1000000) return 'V: 500k-1M'
          return 'V: 1M+'
        } else {
          if (v <= 3000) return 'L: Até 3k'
          if (v <= 6000) return 'L: 3k-6k'
          return 'L: 6k+'
        }
      },
      6,
    )

    const specsMap = new Map<string, { name: string; Demanda: number; Oferta: number }>()
    const initSpec = (k: string) => {
      if (!specsMap.has(k)) specsMap.set(k, { name: k, Demanda: 0, Oferta: 0 })
    }

    ativas.forEach((d) => {
      const dorms = d.dormitorios ?? d.quartos ?? 0
      const vagas = d.vagas ?? d.vagas_estacionamento ?? 0
      if (dorms > 0) {
        const k = `${dorms >= 4 ? '4+' : dorms} Dorms`
        initSpec(k)
        specsMap.get(k)!.Demanda++
      }
      if (vagas > 0) {
        const k = `${vagas >= 4 ? '4+' : vagas} Vagas`
        initSpec(k)
        specsMap.get(k)!.Demanda++
      }
    })

    disponiveis.forEach((i) => {
      const dorms = i.dormitorios ?? 0
      const vagas = i.vagas ?? 0
      if (dorms > 0) {
        const k = `${dorms >= 4 ? '4+' : dorms} Dorms`
        initSpec(k)
        specsMap.get(k)!.Oferta++
      }
      if (vagas > 0) {
        const k = `${vagas >= 4 ? '4+' : vagas} Vagas`
        initSpec(k)
        specsMap.get(k)!.Oferta++
      }
    })

    const specs = Array.from(specsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    return { tipologia, bairros, precos, specs }
  }, [data])

  const chartConfig = {
    Demanda: { label: 'Demanda', color: 'hsl(var(--primary))' },
    Oferta: { label: 'Oferta', color: 'hsl(var(--chart-2))' },
  }

  const renderChart = (
    dataArray: any[],
    title: string,
    desc: string,
    layout: 'horizontal' | 'vertical' = 'horizontal',
  ) => {
    const hasGaps = dataArray.some((d) => d.Demanda > d.Oferta * 1.5 && d.Demanda > 1)

    return (
      <Card className="border-0 shadow-md flex flex-col min-w-0 animate-fade-in-up">
        <CardHeader className="bg-muted/10 border-b p-4 relative">
          <CardTitle className="text-base flex items-center justify-between">
            {title}
            {hasGaps && (
              <div className="flex items-center text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold uppercase tracking-wider">
                <AlertTriangle className="w-3 h-3 mr-1" />
                Gargalo
              </div>
            )}
          </CardTitle>
          <CardDescription className="text-xs">{desc}</CardDescription>
        </CardHeader>
        <CardContent className="h-[280px] p-4 relative flex-1">
          {dataArray.length > 0 ? (
            <ChartContainer
              config={chartConfig}
              className="h-full w-full absolute inset-0 p-4 pb-0"
            >
              <ResponsiveContainer width="100%" height="100%">
                {layout === 'vertical' ? (
                  <BarChart
                    data={dataArray}
                    layout="vertical"
                    margin={{ left: 10, right: 30, top: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={100}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                      tickFormatter={(val) =>
                        val.length > 15 ? val.substring(0, 12) + '...' : val
                      }
                    />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                    <Bar
                      dataKey="Demanda"
                      fill="var(--color-Demanda)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                    />
                    <Bar
                      dataKey="Oferta"
                      fill="var(--color-Oferta)"
                      radius={[0, 4, 4, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                ) : (
                  <BarChart data={dataArray} margin={{ left: -20, right: 10, top: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 11 }}
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
                    <Bar
                      dataKey="Demanda"
                      fill="var(--color-Demanda)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                    <Bar
                      dataKey="Oferta"
                      fill="var(--color-Oferta)"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={30}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-muted-foreground bg-muted/10 rounded-lg absolute inset-0">
              <p className="text-sm font-medium">Sem dados disponíveis</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4 w-full mt-8">
        <Skeleton className="h-8 w-80" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          <Skeleton className="h-[320px] w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
          <Skeleton className="h-[320px] w-full rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 w-full mt-10 border-t pt-8">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight">
            Inteligência de Mercado: Oferta vs. Demanda
          </h2>
          <p className="text-sm text-muted-foreground">
            Comparativo entre a carteira de imóveis ativos e as necessidades dos clientes
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        {renderChart(
          chartsData.tipologia,
          'Cruzamento de Tipologia',
          'Distribuição de clientes vs imóveis por tipo',
        )}
        {renderChart(
          chartsData.bairros,
          'Gargalos por Bairro',
          'Top regiões demandadas vs estoque disponível',
          'vertical',
        )}
        {renderChart(
          chartsData.precos,
          'Faixas de Preço',
          'Orçamento dos clientes vs Valor dos imóveis',
        )}
        {renderChart(
          chartsData.specs,
          'Dormitórios e Vagas',
          'Demanda por características específicas',
        )}
      </div>
    </div>
  )
}
