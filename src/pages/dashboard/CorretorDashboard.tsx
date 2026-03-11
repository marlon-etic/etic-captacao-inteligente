import { Link } from 'react-router-dom'
import { PlusCircle, Search, Activity, Target, Building2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DemandCard } from '@/components/DemandCard'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import useAppStore from '@/stores/useAppStore'

export function CorretorDashboard() {
  const { demands, currentUser } = useAppStore()

  // The demands list is already securely filtered by the global store state for Corretor
  const myDemands = demands.filter((d) => d.createdBy === currentUser?.id)
  const activeCount = myDemands.filter(
    (d) => d.status === 'Pendente' || d.status === 'Em Captação',
  ).length
  const successCount = myDemands.filter(
    (d) => d.status === 'Captado sob demanda' || d.status === 'Negócio',
  ).length

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Painel do Corretor</h1>
          <p className="text-muted-foreground text-sm">
            Gerencie suas demandas de vendas e imóveis captados.
          </p>
        </div>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link to="/app/nova-demanda">
            <PlusCircle className="w-4 h-4 mr-2" /> Nova Demanda
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="demandas" className="w-full">
        <TabsList className="grid w-full sm:w-[400px] grid-cols-2 mb-6">
          <TabsTrigger value="demandas">Minhas Vendas</TabsTrigger>
          <TabsTrigger value="captados">Imóveis Vinculados</TabsTrigger>
        </TabsList>

        <TabsContent value="demandas" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-full text-primary mb-2 sm:mb-0">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Em Captação</p>
                  <p className="text-3xl font-bold text-primary">{activeCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="bg-emerald-200 p-3 rounded-full text-emerald-700 mb-2 sm:mb-0">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-emerald-700/80 font-medium">Negócios / Captados</p>
                  <p className="text-3xl font-bold text-emerald-700">{successCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Demandas Recentes</h2>
            {myDemands.length === 0 ? (
              <div className="text-center p-12 bg-background border rounded-xl border-dashed">
                <Building2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Nenhuma demanda de venda ativa.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/app/nova-demanda">Criar Demanda de Venda</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myDemands.slice(0, 4).map((demand) => (
                  <DemandCard key={demand.id} demand={demand} />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="captados" className="mt-0">
          <CapturedPropertiesView />
        </TabsContent>
      </Tabs>
    </div>
  )
}
