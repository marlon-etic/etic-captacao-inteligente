import { useMemo } from 'react'
import { Bar, BarChart, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer } from '@/components/ui/chart'
import useAppStore from '@/stores/useAppStore'

export function GestorDashboard() {
  const { demands, users } = useAppStore()

  const funnelData = useMemo(() => {
    const statusCounts = demands.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return [
      { name: 'Total Geradas', value: demands.length, fill: 'var(--color-primary)' },
      {
        name: 'Em Captação',
        value: statusCounts['Em Captação'] || 0,
        fill: 'var(--color-chart-2)',
      },
      {
        name: 'Captadas',
        value: statusCounts['Captado sob demanda'] || 0,
        fill: 'var(--color-chart-3)',
      },
      { name: 'Negócios', value: statusCounts['Negócio'] || 0, fill: 'var(--color-chart-4)' },
    ]
  }, [demands])

  const chartConfig = {
    value: { label: 'Quantidade', color: 'hsl(var(--primary))' },
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight mb-1">Visão Gerencial</h1>
        <p className="text-muted-foreground text-sm">
          Métricas de performance e funil de conversão.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Demandas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{demands.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{users.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Taxa de Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">32%</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tempo Médio</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">4.2h</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Funil de Captação</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ChartContainer config={chartConfig}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={funnelData}
                  layout="vertical"
                  margin={{ left: 40, right: 20, top: 20, bottom: 20 }}
                >
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[0, 4, 4, 0]}
                    barSize={30}
                    fill="var(--color-primary)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
