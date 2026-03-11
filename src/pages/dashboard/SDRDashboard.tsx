import { Link } from 'react-router-dom'
import { PlusCircle, Search, Activity, Target } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DemandCard } from '@/components/DemandCard'
import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import { LoosePropertiesView } from '@/components/LoosePropertiesView'
import useAppStore from '@/stores/useAppStore'

export function SDRDashboard() {
  const { demands, currentUser } = useAppStore()

  const myDemands = demands.filter((d) => d.createdBy === currentUser?.id)
  const activeCount = myDemands.filter(
    (d) => d.status === 'Pendente' || d.status === 'Em Captação',
  ).length
  const successCount = myDemands.filter(
    (d) => d.status === 'Captado sob demanda' || d.status === 'Negócio',
  ).length

  const historyDemands = myDemands.filter((d) =>
    ['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status),
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-tight mb-1">Meu Painel</h1>
          <p className="text-muted-foreground text-sm">Acompanhe as demandas que você gerou.</p>
        </div>
        <Button asChild className="hidden sm:flex" size="sm">
          <Link to="/app/nova-demanda">
            <PlusCircle className="w-4 h-4 mr-2" /> Nova Demanda
          </Link>
        </Button>
      </div>

      <Tabs defaultValue="demandas" className="w-full">
        <TabsList className="grid w-full sm:w-[600px] grid-cols-4 mb-6">
          <TabsTrigger value="demandas">DEMANDAS</TabsTrigger>
          <TabsTrigger value="captados">CAPTADOS</TabsTrigger>
          <TabsTrigger value="disponiveis">DISPONÍVEIS</TabsTrigger>
          <TabsTrigger value="historico">HISTÓRICO</TabsTrigger>
        </TabsList>

        <TabsContent value="demandas" className="space-y-6 mt-0">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-primary/20 p-3 rounded-full text-primary">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Em Andamento</p>
                  <p className="text-3xl font-bold text-primary">{activeCount}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-emerald-50 border-emerald-200">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="bg-emerald-200 p-3 rounded-full text-emerald-700">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm text-emerald-700/80 font-medium">Convertidas</p>
                  <p className="text-3xl font-bold text-emerald-700">{successCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Minhas Demandas Ativas</h2>
            {myDemands.length === 0 ? (
              <div className="text-center p-12 bg-background border rounded-xl border-dashed">
                <Search className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-medium">Você ainda não criou demandas.</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link to="/app/nova-demanda">Criar Primeira Demanda</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {myDemands
                  .filter(
                    (d) => !['Negócio', 'Perdida', 'Impossível', 'Arquivado'].includes(d.status),
                  )
                  .slice(0, 4)
                  .map((demand) => (
                    <DemandCard key={demand.id} demand={demand} />
                  ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="captados" className="mt-0">
          <CapturedPropertiesView />
        </TabsContent>

        <TabsContent value="disponiveis" className="mt-0">
          <LoosePropertiesView />
        </TabsContent>

        <TabsContent value="historico" className="mt-0">
          <h2 className="text-lg font-semibold mb-4">Histórico de Demandas</h2>
          {historyDemands.length === 0 ? (
            <div className="text-center p-12 bg-background border rounded-xl border-dashed">
              <p className="text-muted-foreground font-medium">Nenhum histórico encontrado.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {historyDemands.map((demand) => (
                <DemandCard key={demand.id} demand={demand} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
