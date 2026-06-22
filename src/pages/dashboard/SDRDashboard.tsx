import { useSdrQueries } from '@/hooks/use-sdr-queries'
import { FilterBar } from '@/components/sdr-dashboard/FilterBar'
import { MetricsCardsSdr } from '@/components/sdr-dashboard/MetricsCardsSdr'
import { ListasSdr } from '@/components/sdr-dashboard/ListasSdr'
import { AlertasBannerSdr } from '@/components/sdr-dashboard/AlertasBannerSdr'
import { ChartsSdr } from '@/components/sdr-dashboard/ChartsSdr'
import { useAuth } from '@/hooks/use-auth'

export function SDRDashboard() {
  const { data, loading } = useSdrQueries()
  const { user } = useAuth()

  const role = user?.user_metadata?.role || user?.app_metadata?.role || 'sdr'
  const isLocacao = role === 'sdr'

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-[#1A3A52]">
            Dashboard {isLocacao ? 'SDR' : 'Corretor'}
          </h2>
          <p className="text-gray-500 font-medium">
            Acompanhamento e gestão de demandas em tempo real
          </p>
        </div>
      </div>

      <AlertasBannerSdr data={data} loading={loading} isLocacao={isLocacao} />

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-start gap-4">
        <FilterBar />
      </div>

      <MetricsCardsSdr data={data} loading={loading} />

      <ListasSdr data={data} loading={loading} isLocacao={isLocacao} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <ChartsSdr data={data} loading={loading} />
      </div>
    </div>
  )
}
