import { Home, CheckCircle, DollarSign, XCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

interface MetricsCardsProps {
  metrics: any
  loading: boolean
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[140px] rounded-2xl" />
        ))}
      </div>
    )
  }

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-blue-800">Imóveis Captados</CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <Home className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-blue-900">{metrics?.total || 0}</div>
          <p className="text-xs font-bold text-blue-600 mt-1">Neste período selecionado</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-emerald-800">Convertidos</CardTitle>
          <div className="p-2 bg-emerald-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-emerald-900">{metrics?.convertidos || 0}</div>
          <p className="text-xs font-bold text-emerald-600 mt-1">Negócios fechados</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-purple-100 bg-gradient-to-br from-purple-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-purple-800">Receita Gerada</CardTitle>
          <div className="p-2 bg-purple-100 rounded-full">
            <DollarSign className="h-5 w-5 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-purple-900">
            {formatCurrency(metrics?.receita || 0)}
          </div>
          <p className="text-xs font-bold text-purple-600 mt-1">Valor VGV estimado</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 border-red-100 bg-gradient-to-br from-red-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-red-800">Imóveis Perdidos</CardTitle>
          <div className="p-2 bg-red-100 rounded-full">
            <XCircle className="h-5 w-5 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-red-900">{metrics?.perdidos || 0}</div>
          <p className="text-xs font-bold text-red-600 mt-1">Descartados no período</p>
        </CardContent>
      </Card>
    </div>
  )
}
