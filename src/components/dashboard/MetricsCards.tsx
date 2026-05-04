import { UserPlus, CheckCircle, DollarSign, TrendingUp } from 'lucide-react'
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
      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-blue-100 bg-gradient-to-br from-blue-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-blue-800">Leads Captados</CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <UserPlus className="h-5 w-5 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-blue-900">{metrics?.total || 0}</div>
          <p className="text-xs font-semibold text-blue-600 mt-1 flex items-center">
            Neste período
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-emerald-100 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-emerald-800">Convertidos</CardTitle>
          <div className="p-2 bg-emerald-100 rounded-full">
            <CheckCircle className="h-5 w-5 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-emerald-900">{metrics?.convertidos || 0}</div>
          <p className="text-xs font-semibold text-emerald-600 mt-1 flex items-center">
            Negócios fechados
          </p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-purple-100 bg-gradient-to-br from-purple-50 to-white">
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
          <p className="text-xs font-semibold text-purple-600 mt-1 flex items-center">Valor VGV</p>
        </CardContent>
      </Card>

      <Card className="rounded-2xl hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer border-amber-100 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-[14px] font-bold text-amber-800">Taxa Conversão</CardTitle>
          <div className="p-2 bg-amber-100 rounded-full">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-black text-amber-900">{metrics?.taxa || 0}%</div>
          <p className="text-xs font-semibold text-amber-600 mt-1 flex items-center">
            Fechados / Total
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
