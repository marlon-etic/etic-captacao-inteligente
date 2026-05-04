import { SdrStoreProvider } from '@/hooks/use-sdr-store'
import { useSdrQueries } from '@/hooks/use-sdr-queries'
import { MetricsCardsSdr } from '@/components/sdr-dashboard/MetricsCardsSdr'
import { FilterBar } from '@/components/sdr-dashboard/FilterBar'
import { ChartsSdr } from '@/components/sdr-dashboard/ChartsSdr'
import { ListasSdr } from '@/components/sdr-dashboard/ListasSdr'
import { useAuth } from '@/hooks/use-auth'
import { Zap } from 'lucide-react'

function DashboardContent() {
  const { user } = useAuth()
  const { data, loading } = useSdrQueries()
  const role = user?.user_metadata?.role || user?.app_metadata?.role || 'sdr'
  const isLocacao = role === 'sdr'

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 bg-[#f8fafc] min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-[#1A3A52]">
            Dashboard {isLocacao ? 'SDR' : 'Corretor'}
          </h1>
          <p className="text-gray-500 font-bold text-sm mt-1">
            Acompanhe o funil de {isLocacao ? 'locação' : 'vendas'}, matches automáticos e métricas.
          </p>
        </div>
        <FilterBar />
      </div>

      <MetricsCardsSdr data={data} loading={loading} />

      <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 font-bold flex items-center shadow-sm">
        <Zap className="w-5 h-5 mr-3 shrink-0" />
        {isLocacao
          ? 'Foque em demandas! Busque alinhar mais captações com as necessidades ativas dos clientes.'
          : 'Aumente visitas! Quanto mais imóveis oferecidos, maior a conversão.'}
      </div>

      <ChartsSdr data={data} loading={loading} />

      <ListasSdr data={data} loading={loading} isLocacao={isLocacao} />
    </div>
  )
}

export default function SdrCorretorDashboard() {
  return (
    <SdrStoreProvider>
      <DashboardContent />
    </SdrStoreProvider>
  )
}
