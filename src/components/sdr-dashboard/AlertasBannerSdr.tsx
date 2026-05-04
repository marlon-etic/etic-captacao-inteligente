import { Target, Trophy, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

export function AlertasBannerSdr({
  data,
  loading,
  isLocacao,
}: {
  data: any
  loading: boolean
  isLocacao: boolean
}) {
  if (loading) return <Skeleton className="h-16 w-full rounded-xl mb-6" />

  const inativas = data?.demandasInativas?.length || 0
  const fechados = data?.fechados?.length || 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
      {inativas > 0 && (
        <div className="bg-red-50 text-red-800 p-4 rounded-xl border border-red-200 font-bold flex items-center shadow-sm">
          <AlertTriangle className="w-5 h-5 mr-3 shrink-0 text-red-600" />
          <div className="flex-1">
            <span className="text-red-700">⚠️ {inativas} demandas inativas há mais de 7 dias!</span>
            <p className="text-xs font-medium text-red-500 mt-0.5">
              Atualize o status ou perca a demanda.
            </p>
          </div>
        </div>
      )}
      {fechados > 0 && (
        <div className="bg-emerald-50 text-emerald-800 p-4 rounded-xl border border-emerald-200 font-bold flex items-center shadow-sm">
          <Trophy className="w-5 h-5 mr-3 shrink-0 text-emerald-600" />
          <div className="flex-1">
            <span className="text-emerald-700">
              🔥 Parabéns! Você fechou {fechados} negócios neste período!
            </span>
          </div>
        </div>
      )}
      {inativas === 0 && fechados === 0 && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-200 font-bold flex items-center shadow-sm md:col-span-2">
          <Target className="w-5 h-5 mr-3 shrink-0" />
          {isLocacao
            ? 'Foque em demandas! Busque alinhar mais captações com as necessidades ativas dos clientes.'
            : 'Aumente visitas! Quanto mais imóveis oferecidos, maior a conversão.'}
        </div>
      )}
    </div>
  )
}
