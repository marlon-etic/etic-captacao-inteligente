import { Building2, Calendar, TrendingUp, CheckCircle2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Campanha } from '@/services/campanhaService'
import { cn } from '@/lib/utils'

interface CampanhaCardProps {
  campanha: Campanha
  onToggle: (id: string, currentStatus: string) => void
  onClick: (campanha: Campanha) => void
}

const tipoLabels: Record<string, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  galpao: 'Galpão',
  comercial: 'Comercial',
}

const formatCurrency = (val: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(val)

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  } catch {
    return '—'
  }
}

export function CampanhaCard({ campanha, onToggle, onClick }: CampanhaCardProps) {
  const pct = Math.min(100, (campanha.progresso / campanha.meta) * 100)
  const isAtiva = campanha.status === 'ativa'
  const isFechada = campanha.status === 'fechada'
  const goalReached = campanha.progresso >= campanha.meta
  const isExpired = new Date(campanha.data_fim) < new Date()

  return (
    <div
      className={cn(
        'bg-white rounded-xl border shadow-sm p-5 transition-all duration-200 hover:shadow-md cursor-pointer',
        isFechada ? 'border-gray-200 opacity-70' : 'border-[#E5E5E5]',
      )}
      onClick={() => onClick(campanha)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isAtiva ? 'bg-green-100' : 'bg-gray-100',
            )}
          >
            <Building2 className={cn('w-5 h-5', isAtiva ? 'text-green-600' : 'text-gray-500')} />
          </div>
          <div>
            <h3 className="font-bold text-[#1A3A52] text-[15px]">
              {tipoLabels[campanha.tipo_imovel] || campanha.tipo_imovel}
            </h3>
            <p className="text-xs text-[#999999] font-medium">
              {formatCurrency(campanha.faixa_valor_min)} —{' '}
              {formatCurrency(campanha.faixa_valor_max)}
            </p>
          </div>
        </div>
        {!isFechada && (
          <div onClick={(e) => e.stopPropagation()}>
            <Switch
              checked={isAtiva}
              onCheckedChange={() => onToggle(campanha.id, campanha.status)}
            />
          </div>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold text-[#666666]">Progresso</span>
          <span
            className={cn('text-sm font-black', goalReached ? 'text-green-600' : 'text-[#1A3A52]')}
          >
            {campanha.progresso}/{campanha.meta}
            {goalReached && <CheckCircle2 className="inline-block w-4 h-4 ml-1" />}
          </span>
        </div>
        <Progress
          value={pct}
          className={cn('h-2', isAtiva ? '[&>div]:bg-green-500' : '[&>div]:bg-gray-400')}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#999999] font-medium">
        <span className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(campanha.data_fim)}
          {isExpired && !isFechada && (
            <span className="text-red-500 font-bold ml-1">(Expirada)</span>
          )}
        </span>
        {isFechada && (
          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 font-bold">
            Fechada
          </span>
        )}
        {isAtiva && !isExpired && (
          <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" /> Ativa
          </span>
        )}
      </div>
    </div>
  )
}
