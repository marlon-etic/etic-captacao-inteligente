import { useCaptadorDashboard } from '@/hooks/use-captador-dashboard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts'
import { Clock, Search, CheckCircle, XCircle, Building } from 'lucide-react'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { DashboardCharts } from './DashboardCharts'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function CaptadorDashboardOverview() {
  const { metrics, charts, loading } = useCaptadorDashboard()
  const navigate = useNavigate()

  if (loading)
    return (
      <div className="p-8 flex justify-center">
        <LoadingSpinner />
      </div>
    )

  const engajamentoData = [
    { name: 'Captados', value: metrics?.captados || 0, fill: 'hsl(var(--chart-1))' },
    { name: 'Buscando', value: metrics?.emBusca || 0, fill: 'hsl(var(--chart-2))' },
    {
      name: 'Perdidos (Inatividade)',
      value: metrics?.perdidosInatividade || 0,
      fill: 'hsl(var(--chart-3))',
    },
    { name: 'Perdidos (Outros)', value: metrics?.perdidosOutros || 0, fill: 'hsl(var(--chart-4))' },
  ]

  const chartConfig = {
    captados: { label: 'Captados', color: 'hsl(var(--chart-1))' },
    buscando: { label: 'Buscando', color: 'hsl(var(--chart-2))' },
    inativos: { label: 'Perdidos (Inatividade)', color: 'hsl(var(--chart-3))' },
    outros: { label: 'Perdidos (Outros)', color: 'hsl(var(--chart-4))' },
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard de Engajamento</h2>
        <Button
          onClick={() => navigate('/app/demandas')}
          className="bg-[#10B981] hover:bg-[#059669] text-white font-bold h-11 px-6 shadow-sm flex items-center gap-2"
        >
          <Search className="w-5 h-5" />
          Começar Busca
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Buscando (Ativos)
            </CardTitle>
            <Search className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {metrics?.emBusca || 0}
            </div>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80">
              Demandas sendo trabalhadas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Perdidos por Inatividade
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">
              {metrics?.perdidosInatividade || 0}
            </div>
            <p className="text-xs text-amber-600/80 dark:text-amber-400/80">
              Regra de 48h sem interação
            </p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
              Imóveis Captados
            </CardTitle>
            <Building className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
              {metrics?.captados || 0}
            </div>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">Total no período</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50/50 dark:bg-red-900/10 border-red-100 dark:border-red-900">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">
              Perdidos (Outros)
            </CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700 dark:text-red-300">
              {metrics?.perdidosOutros || 0}
            </div>
            <p className="text-xs text-red-600/80 dark:text-red-400/80">
              Descartados ou Indisponíveis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Engajamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={engajamentoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {engajamentoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Análise Comparativa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ChartContainer config={chartConfig}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={engajamentoData}
                    margin={{ top: 20, right: 20, left: -20, bottom: 0 }}
                  >
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {engajamentoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-bold tracking-tight mb-4">Análise de Mercado</h3>
        <DashboardCharts charts={charts} loading={loading} />
      </div>
    </div>
  )
}
