import {
  UserPlus,
  Clock,
  Home,
  Link as LinkIcon,
  Calendar,
  CheckCircle,
  TrendingUp,
  Target,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSdrStore } from '@/hooks/use-sdr-store'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function MetricsCardsSdr({ data, loading }: { data: any; loading: boolean }) {
  const { cardFiltrado, setCardFiltrado } = useSdrStore()

  if (loading)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )

  const totais = data?.demandas?.length || 0
  const novas =
    data?.demandas?.filter((d: any) => !d.status_demanda || d.status_demanda === 'aberta').length ||
    0
  const ativas =
    data?.demandas?.filter((d: any) =>
      ['aberta', 'em busca', 'em visita', 'em negociação'].includes(
        d.status_demanda?.toLowerCase(),
      ),
    ).length || 0
  const livres = data?.imoveisLivres?.length || 0
  const sobDemanda = data?.imoveisSobDemanda?.length || 0
  const visitas = data?.visitas?.length || 0
  const fechados = data?.fechados?.length || 0

  const convVisitas = novas > 0 ? Math.round((visitas / novas) * 100) : 0
  const convNegocios = totais > 0 ? Math.round((fechados / totais) * 100) : 0

  const toggle = (val: any) => setCardFiltrado(cardFiltrado === val ? 'nenhum' : val)

  const cards = [
    {
      id: 'novas',
      title: 'Novas Demandas',
      val: novas,
      sub: 'no período',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: UserPlus,
    },
    {
      id: 'ativas',
      title: 'Demandas Ativas',
      val: ativas,
      sub: 'aguardando / em processo',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: Clock,
    },
    {
      id: 'livres',
      title: 'Imóveis Livres',
      val: livres,
      sub: 'disponíveis',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      icon: Home,
    },
    {
      id: 'sob_demanda',
      title: 'Sob Demanda',
      val: sobDemanda,
      sub: 'vinculados',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: LinkIcon,
    },
    {
      id: 'visitas',
      title: 'Visitas',
      val: visitas,
      sub: 'no período',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: Calendar,
    },
    {
      id: 'fechados',
      title: 'Fechados',
      val: fechados,
      sub: 'negócios',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: CheckCircle,
    },
    {
      id: 'nenhum',
      title: 'Conv. Clientes (Visitas)',
      val: `${convVisitas}%`,
      sub: 'visitas / novas demandas',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: TrendingUp,
    },
    {
      id: 'nenhum2',
      title: 'Conv. Negócios',
      val: `${convNegocios}%`,
      sub: 'fechados / total demandas',
      color: 'text-purple-600',
      bg: 'bg-purple-50',
      icon: Target,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((c) => (
        <Card
          key={c.title}
          onClick={() => !c.id.startsWith('nenhum') && toggle(c.id)}
          className={cn(
            'cursor-pointer hover:shadow-lg transition-all border-gray-100',
            cardFiltrado === c.id && 'ring-2 ring-blue-500 shadow-md',
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-bold text-gray-600 uppercase tracking-wider">
              {c.title}
            </CardTitle>
            <div className={cn('p-2 rounded-full', c.bg)}>
              <c.icon className={cn('h-4 w-4', c.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-gray-800">{c.val}</div>
            <p className="text-xs text-gray-400 font-medium mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
