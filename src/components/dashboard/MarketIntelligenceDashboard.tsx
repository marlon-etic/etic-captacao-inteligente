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
import { TrendingUp } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useUserRole } from '@/hooks/use-user-role'

export function MarketIntelligenceDashboard() {
  const [data, setData] = useState<{ demandas: any[]; imoveis: any[] } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { user } = useAuth()
  const { role } = useUserRole()

  useEffect(() => {
    if (!user || !role) return

    const fetchData = async () => {
      setIsLoading(true)

      let imoveisQuery = supabase
        .from('imoveis_captados')
        .select(
          'tipo, tipo_imovel, preco, valor, dormitorios, vagas, endereco, localizacao_texto, etapa_funil, status_captacao',
        )

      let locacaoQuery = supabase
        .from('demandas_locacao')
        .select(
          'sdr_id, tipo_imovel, valor_maximo, orcamento_max, dormitorios, quartos, vagas, vagas_estacionamento, bairros, localizacoes, status_demanda',
        )

      let vendasQuery = supabase
        .from('demandas_vendas')
        .select(
          'corretor_id, tipo_imovel, valor_maximo, orcamento_max, dormitorios, quartos, vagas, vagas_estacionamento, bairros, localizacoes, status_demanda',
        )

      let fetchLocacao = true
      let fetchVendas = true

      if (role === 'sdr') {
        imoveisQuery = imoveisQuery.in('tipo', ['Locação', 'Ambos'])
        locacaoQuery = locacaoQuery.eq('sdr_id', user.id)
        fetchVendas = false
      } else if (role === 'corretor') {
        imoveisQuery = imoveisQuery.in('tipo', ['Venda', 'Ambos'])
        vendasQuery = vendasQuery.eq('corretor_id', user.id)
        fetchLocacao = false
      } else if (role === 'captador') {
        imoveisQuery = imoveisQuery.eq('user_captador_id', user.id)
      }

      try {
        const [resImv, resLoc, resVen] = await Promise.all([
          imoveisQuery,
          fetchLocacao ? locacaoQuery : Promise.resolve({ data: [] }),
          fetchVendas ? vendasQuery : Promise.resolve({ data: [] }),
        ])

        const loc = (resLoc.data || []).map((d) => ({ ...d, tipo_geral: 'Locação' }))
        const ven = (resVen.data || []).map((d) => ({ ...d, tipo_geral: 'Venda' }))
        const imv = resImv.data || []

        setData({ demandas: [...loc, ...ven], imoveis: imv })
      } catch (error) {
        console.error('Error fetching market intel data:', error)
        setData({ demandas: [], imoveis: [] })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [user, role])

  const handleChartClick = (chartData: any, type: string) => {
    if (!chartData || !chartData.name) return
    const prefix = type === 'Locação' ? 'L:' : 'V:'
    const filterString = `${prefix} ${chartData.name}`
    window.dispatchEvent(
      new CustomEvent('navigate-to', {
        detail: `/app/buscar-imoveis?filter=${encodeURIComponent(filterString)}`,
      }),
    )
  }

  const chartsData = useMemo(() => {
    if (!data) return { precos: [] }

    const isAtiva = (d: any) => {
      const s = (d.status_demanda || '').toLowerCase()
      return (
        !s.includes('perdid') &&
        !s.includes('fechad') &&
        !s.includes('inativ') &&
        !s.includes('impossível')
      )
    }

    const precosMap = new Map<
      string,
      { name: string; Locação: number; Venda: number; Imóveis: number }
    >()

    const faixas = ['0 - 2k', '2k - 4k', '4k - 8k', '8k - 15k', '15k+']
    faixas.forEach((f) => precosMap.set(f, { name: f, Locação: 0, Venda: 0, Imóveis: 0 }))

    const getFaixa = (v: number) => {
      if (v < 2000) return '0 - 2k'
      if (v < 4000) return '2k - 4k'
      if (v < 8000) return '4k - 8k'
      if (v < 15000) return '8k - 15k'
      return '15k+'
    }

    data.demandas.filter(isAtiva).forEach((d) => {
      const val = d.valor_maximo || d.orcamento_max || 0
      if (val > 0) {
        const f = getFaixa(val)
        const entry = precosMap.get(f)
        if (entry) {
          if (d.tipo_geral === 'Locação') entry.Locação += 1
          else entry.Venda += 1
        }
      }
    })

    data.imoveis.forEach((i) => {
      const val = i.valor || i.preco || 0
      if (val > 0) {
        const f = getFaixa(val)
        const entry = precosMap.get(f)
        if (entry) entry.Imóveis += 1
      }
    })

    return {
      precos: Array.from(precosMap.values()),
    }
  }, [data])

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6">
        <Skeleton className="h-[400px] w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Inteligência de Preços</CardTitle>
          <CardDescription>
            Comparativo entre demandas ativas e imóveis captados por faixa de valor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              Locação: { color: 'hsl(var(--primary))' },
              Venda: { color: 'hsl(var(--chart-2))' },
              Imóveis: { color: 'hsl(var(--chart-3))' },
            }}
            className="h-[350px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartsData.precos}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tickMargin={10} />
                <YAxis axisLine={false} tickLine={false} tickMargin={10} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar
                  dataKey="Locação"
                  fill="var(--color-Locação)"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => handleChartClick(data, 'Locação')}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
                <Bar
                  dataKey="Venda"
                  fill="var(--color-Venda)"
                  radius={[4, 4, 0, 0]}
                  onClick={(data) => handleChartClick(data, 'Venda')}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                />
                <Bar dataKey="Imóveis" fill="var(--color-Imóveis)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          <div className="mt-4 flex items-start gap-3 text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg">
            <TrendingUp className="h-5 w-5 text-primary shrink-0" />
            <p>
              <strong>Dica de Uso:</strong> Clique nas barras de Locação ou Venda acima para filtrar
              a lista de imóveis na busca com a faixa de preço correspondente.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
