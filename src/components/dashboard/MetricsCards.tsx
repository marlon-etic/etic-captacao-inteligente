import { CheckCircle, XCircle, Zap, AlertTriangle, TrendingUp, Clock } from 'lucide-react'
import { TIMEOUT_LOSS_REASON } from '@/lib/lost-reasons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface MetricsCardsProps {
  metrics: any
  loading: boolean
  activeFilter?: string
  onCardClick?: (filter: string) => void
}

export function MetricsCards({ metrics, loading, activeFilter, onCardClick }: MetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    )
  }

  const handleCardClick = (filter: string) => {
    if (onCardClick) onCardClick(activeFilter === filter ? '' : filter)
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Card
          className={cn(
            'rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white group cursor-pointer',
            activeFilter === 'sob_demanda' && 'ring-2 ring-emerald-500 shadow-md',
          )}
          onClick={() => handleCardClick('sob_demanda')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[14px] font-bold text-emerald-800">Sob Demanda</CardTitle>
            <div className="p-2 bg-emerald-100 rounded-full group-hover:scale-110 transition-transform">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-900">{metrics?.sobDemanda || 0}</div>
            <p className="text-xs font-bold text-emerald-600 mt-1">Imóveis vinculados</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-blue-100 bg-gradient-to-br from-blue-50 to-white group cursor-pointer',
            activeFilter === 'aleatorios' && 'ring-2 ring-blue-500 shadow-md',
          )}
          onClick={() => handleCardClick('aleatorios')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[14px] font-bold text-blue-800">Aleatórios</CardTitle>
            <div className="p-2 bg-blue-100 rounded-full group-hover:scale-110 transition-transform">
              <Zap className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-900">{metrics?.aleatorios || 0}</div>
            <p className="text-xs font-bold text-blue-600 mt-1">Avulsos no período</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-red-100 bg-gradient-to-br from-red-50 to-white group cursor-pointer',
            activeFilter === 'perdidos' && 'ring-2 ring-red-500 shadow-md',
          )}
          onClick={() => handleCardClick('perdidos')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[14px] font-bold text-red-800">Imóveis Perdidos</CardTitle>
            <div className="p-2 bg-red-100 rounded-full group-hover:scale-110 transition-transform">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-900">{metrics?.perdidos || 0}</div>
            <p className="text-xs font-bold text-red-600 mt-1">Descartados no período</p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-amber-100 bg-gradient-to-br from-amber-50 to-white group cursor-pointer',
            activeFilter === 'sem_resposta' && 'ring-2 ring-amber-500 shadow-md',
          )}
          onClick={() => handleCardClick('sem_resposta')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[14px] font-bold text-amber-800">Sem Resposta</CardTitle>
            <div className="p-2 bg-amber-100 rounded-full group-hover:scale-110 transition-transform">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-900">{metrics?.semResposta || 0}</div>
            <p className="text-xs font-bold text-amber-600 mt-1">
              Demandas abertas e sem resposta 72h
            </p>
          </CardContent>
        </Card>

        <Card
          className={cn(
            'rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-purple-100 bg-gradient-to-br from-purple-50 to-white group cursor-pointer',
            activeFilter === 'timeout' && 'ring-2 ring-purple-500 shadow-md',
          )}
          onClick={() => handleCardClick('timeout')}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[14px] font-bold text-purple-800">
              Perdas por Timeout (72h)
            </CardTitle>
            <div className="p-2 bg-purple-100 rounded-full group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-purple-900">
              {metrics?.timeoutPerdidos || 0}
            </div>
            <p className="text-xs font-bold text-purple-600 mt-1">Sem resposta coletiva</p>
          </CardContent>
        </Card>
      </div>

      <div className="mb-8">
        {metrics?.semResposta > 3 ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 font-bold flex items-center shadow-sm">
            <AlertTriangle className="w-5 h-5 mr-3" /> 🚨 Responda demandas! Você tem{' '}
            {metrics.semResposta} demandas aguardando sua ação.
          </div>
        ) : metrics?.perdidos > 2 ? (
          <div className="bg-orange-50 text-orange-700 p-4 rounded-xl border border-orange-200 font-bold flex items-center shadow-sm">
            <XCircle className="w-5 h-5 mr-3" /> ⚠️ Analise as perdas! Você perdeu{' '}
            {metrics.perdidos} imóveis neste período.
          </div>
        ) : metrics?.aleatorios > metrics?.sobDemanda ? (
          <div className="bg-blue-50 text-blue-700 p-4 rounded-xl border border-blue-200 font-bold flex items-center shadow-sm">
            <Zap className="w-5 h-5 mr-3" /> 🎯 Foque em demandas! Busque alinhar mais captações com
            as necessidades ativas dos clientes.
          </div>
        ) : metrics?.sobDemanda > 0 ? (
          <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-200 font-bold flex items-center shadow-sm">
            <TrendingUp className="w-5 h-5 mr-3" /> 🔥 Performance excelente! Continue trazendo
            imóveis sob demanda.
          </div>
        ) : null}
      </div>
    </>
  )
}
