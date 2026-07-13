import { Building2, Home, Clock, Trophy } from 'lucide-react'
import type { KpiData } from '@/lib/campanha-historico-utils'

interface HistoricoKpiCardsProps {
  kpis: KpiData
}

export function HistoricoKpiCards({ kpis }: HistoricoKpiCardsProps) {
  const cards = [
    {
      label: 'Campanhas Encerradas',
      value: kpis.totalCampanhas.toString(),
      icon: Building2,
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      subvalue: '',
    },
    {
      label: 'Imóveis Captados',
      value: kpis.totalImoveis.toString(),
      icon: Home,
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      subvalue: '',
    },
    {
      label: 'Tempo Médio (dias)',
      value: kpis.avgTempoDias.toFixed(0),
      icon: Clock,
      bg: 'bg-orange-50',
      iconBg: 'bg-orange-100',
      iconColor: 'text-orange-600',
      subvalue: '',
    },
    {
      label: 'Top Captador',
      value: kpis.topCaptador?.nome || '—',
      icon: Trophy,
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      subvalue: kpis.topCaptador ? `${kpis.topCaptador.capturas} capturas` : '',
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, i) => {
        const Icon = card.icon
        return (
          <div key={i} className={`${card.bg} p-5 rounded-xl border border-gray-100 shadow-sm`}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wider text-[#666666]">
                {card.label}
              </p>
              <div
                className={`w-9 h-9 ${card.iconBg} rounded-full flex items-center justify-center`}
              >
                <Icon className={`w-4 h-4 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-2xl font-black text-[#1A3A52] truncate">{card.value}</p>
            {card.subvalue && (
              <p className="text-xs text-[#999999] font-medium mt-1">{card.subvalue}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
