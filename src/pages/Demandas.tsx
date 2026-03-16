import { useState, useTransition, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { DemandCard } from '@/components/DemandCard'
import useAppStore from '@/stores/useAppStore'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

export default function Demandas() {
  const { demands } = useAppStore()

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterPeriod, setFilterPeriod] = useState<string>('all')

  const [activeFilters, setActiveFilters] = useState({
    status: 'all',
    type: 'all',
    period: 'all',
  })

  const [isPending, startTransition] = useTransition()

  const applyFilters = () => {
    startTransition(() => {
      setActiveFilters({
        status: filterStatus,
        type: filterType,
        period: filterPeriod,
      })
    })
  }

  const now = Date.now()

  const filtered = useMemo(
    () =>
      demands.filter((d) => {
        if (activeFilters.status === 'open') {
          if (d.status === 'Perdida') return false
          if (d.isPrioritized) return false
        } else if (activeFilters.status === 'prioritized') {
          if (!d.isPrioritized || d.status === 'Perdida') return false
        } else if (activeFilters.status === 'lost') {
          if (d.status !== 'Perdida') return false
        }

        if (activeFilters.type !== 'all' && d.type !== activeFilters.type) return false

        const createdAt = new Date(d.createdAt).getTime()
        const diffDays = (now - createdAt) / 86400000
        if (activeFilters.period === '7days' && diffDays > 7) return false
        if (activeFilters.period === '30days' && diffDays > 30) return false

        return true
      }),
    [demands, activeFilters, now],
  )

  const sorted = useMemo(
    () =>
      [...filtered].sort((a, b) => {
        if (a.isPrioritized && !b.isPrioritized) return -1
        if (!a.isPrioritized && b.isPrioritized) return 1

        if (a.status === 'Perdida' && b.status !== 'Perdida') return 1
        if (a.status !== 'Perdida' && b.status === 'Perdida') return -1

        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    [filtered],
  )

  const filterHash = JSON.stringify(activeFilters)

  return (
    <div className="space-y-[16px] md:space-y-[24px]">
      <div className="animate-fade-in-up">
        <h1 className="text-2xl font-bold tracking-tight">Painel de Demandas</h1>
        <p className="text-muted-foreground text-sm">
          Gerencie os requisitos dos clientes e priorize tarefas.
        </p>
      </div>

      <div className="bg-card border rounded-xl p-[16px] md:p-[24px] space-y-[16px] animate-fade-in-up delay-75">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-[16px] items-end">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Status</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-[44px]">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="open">Abertas</SelectItem>
                <SelectItem value="prioritized">Priorizadas</SelectItem>
                <SelectItem value="lost">Perdidas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tipo de Demanda</Label>
            <div className="flex bg-muted/40 p-1 rounded-md border h-[44px]">
              <button
                onClick={() => setFilterType('all')}
                className={cn(
                  'flex-1 rounded-sm text-sm font-bold transition-all',
                  filterType === 'all'
                    ? 'bg-[#999999] text-white shadow-md'
                    : 'text-muted-foreground hover:bg-muted',
                )}
              >
                Todas
              </button>
              <button
                onClick={() => setFilterType('Venda')}
                className={cn(
                  'flex-1 rounded-sm text-sm font-bold transition-all',
                  filterType === 'Venda'
                    ? 'bg-[#FF4444] text-white shadow-md'
                    : 'text-muted-foreground hover:bg-[#FF4444]/10 hover:text-[#FF4444]',
                )}
              >
                Venda
              </button>
              <button
                onClick={() => setFilterType('Aluguel')}
                className={cn(
                  'flex-1 rounded-sm text-sm font-bold transition-all',
                  filterType === 'Aluguel'
                    ? 'bg-[#4444FF] text-white shadow-md'
                    : 'text-muted-foreground hover:bg-[#4444FF]/10 hover:text-[#4444FF]',
                )}
              >
                Aluguel
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Período</Label>
            <Select value={filterPeriod} onValueChange={setFilterPeriod}>
              <SelectTrigger className="h-[44px]">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7days">Últimos 7 dias</SelectItem>
                <SelectItem value="30days">30 dias</SelectItem>
                <SelectItem value="all">Todas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <Button
            onClick={applyFilters}
            className="w-full sm:w-auto h-[44px] gap-2 transition-[transform,background-color,color] duration-100 ease-in-out"
          >
            <RefreshCw className={cn('w-4 h-4', isPending && 'animate-spin')} />
            Aplicar Filtros
          </Button>
        </div>
      </div>

      <div
        key={filterHash}
        className={cn(
          'grid gap-[16px] md:gap-[24px] grid-cols-1 md:grid-cols-2 animate-slide-in-filters',
          isPending && 'opacity-50',
        )}
      >
        {sorted.map((demand, index) => (
          <DemandCard key={demand.id} demand={demand} index={index} />
        ))}
        {sorted.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center bg-muted/10 border border-dashed rounded-xl opacity-0 animate-fade-in-up forwards">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-muted-foreground font-medium">Nenhuma demanda no momento</p>
          </div>
        )}
      </div>
    </div>
  )
}
