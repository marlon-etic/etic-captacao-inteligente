import {
  UserPlus,
  Clock,
  Home,
  Link as LinkIcon,
  Calendar,
  CheckCircle,
  TrendingUp,
  Target,
  ArchiveX,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useSdrStore } from '@/hooks/use-sdr-store'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

export function MetricsCardsSdr({ data, loading }: { data: any; loading: boolean }) {
  const { cardFiltrado, setCardFiltrado } = useSdrStore()

  if (loading)
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    )

  const demandasList = Array.isArray(data?.demandas) ? data.demandas : []
  const imoveisLivresList = Array.isArray(data?.imoveisLivres) ? data.imoveisLivres : []
  const imoveisSobDemandaList = Array.isArray(data?.imoveisSobDemanda) ? data.imoveisSobDemanda : []
  const visitasList = Array.isArray(data?.visitas) ? data.visitas : []
  const fechadosList = Array.isArray(data?.fechados) ? data.fechados : []

  const totais = demandasList.length || 0
  const novas =
    demandasList.filter(
      (d: any) =>
        !d?.status_demanda || d.status_demanda === 'aberta' || d.status_demanda === 'nova',
    ).length || 0
  const ativas =
    demandasList.filter((d: any) =>
      ['aberta', 'em busca', 'em visita', 'nova'].includes(d?.status_demanda?.toLowerCase() || ''),
    ).length || 0
  const perdidas =
    demandasList.filter(
      (d: any) => d?.status_demanda === 'perdida' || d?.status_demanda?.includes('PERDIDA'),
    ).length || 0
  const livres = imoveisLivresList.length || 0
  const sobDemanda = imoveisSobDemandaList.length || 0
  const visitas = visitasList.length || 0
  const fechados = fechadosList.length || 0

  const convVisitas = novas > 0 ? Math.round((visitas / novas) * 100) : 0
  const convNegocios = totais > 0 ? Math.round((fechados / totais) * 100) : 0
  const vinculacaoPct =
    ativas > 0 ? Math.round(((sobDemanda > ativas ? ativas : sobDemanda) / ativas) * 100) : 0

  const toggle = (val: any) => {
    setCardFiltrado(cardFiltrado === val ? 'nenhum' : val)
    setTimeout(() => {
      document.getElementById('listas-sdr-container')?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  const cards = [
    {
      id: 'novas',
      title: 'Novas Demandas',
      val: novas,
      sub: 'hoje',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: UserPlus,
    },
    {
      id: 'ativas',
      title: 'Demandas Ativas',
      val: ativas,
      sub: 'aguardando imóvel',
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
      title: 'Imóveis Vinculados',
      val: sobDemanda,
      sub: 'sob demanda',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      icon: LinkIcon,
    },
    {
      id: 'visitas',
      title: 'Visitas Agendadas',
      val: visitas,
      sub: 'esta semana',
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
      title: 'Taxa Conversão',
      val: `${convNegocios}%`,
      sub: 'meta 40%',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      icon: TrendingUp,
    },
    {
      id: 'nenhum2',
      title: 'Perf. Vinculação',
      val: `${vinculacaoPct}%`,
      sub: 'demandas com imóvel',
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
            'cursor-pointer transition-all border-gray-100 relative overflow-hidden group',
            cardFiltrado === c.id
              ? 'ring-2 ring-[#1A3A52] shadow-md bg-slate-50'
              : 'hover:shadow-lg hover:-translate-y-0.5 bg-white',
          )}
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-[11px] md:text-xs font-bold text-gray-500 uppercase tracking-wider">
              {c.title}
            </CardTitle>
            <div
              className={cn('p-2 rounded-full transition-transform group-hover:scale-110', c.bg)}
            >
              <c.icon className={cn('h-4 w-4', c.color)} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-black text-gray-800">{c.val}</div>
            <p className="text-xs text-gray-400 font-medium mt-1">{c.sub}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
