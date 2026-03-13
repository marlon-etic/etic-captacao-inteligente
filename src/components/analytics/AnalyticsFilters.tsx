import { useState } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { RefreshCw, Filter } from 'lucide-react'
import { AnalyticsFilterState } from '@/pages/analytics/AnalyticsDashboard'

export function AnalyticsFilters({
  filters,
  onApply,
}: {
  filters: AnalyticsFilterState
  onApply: (f: AnalyticsFilterState) => void
}) {
  const [localFilters, setLocalFilters] = useState<AnalyticsFilterState>(filters)

  return (
    <div className="flex flex-col xl:flex-row gap-4 xl:gap-6 bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm w-full min-w-0">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 xl:gap-6">
        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide">
            Data Início
          </label>
          <DatePicker
            date={localFilters.startDate ? new Date(localFilters.startDate) : undefined}
            setDate={(d) =>
              setLocalFilters((prev) => ({ ...prev, startDate: d?.toISOString() || null }))
            }
            className="min-h-[44px] h-[44px]"
            placeholder="Data inicial"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide">
            Data Fim
          </label>
          <DatePicker
            date={localFilters.endDate ? new Date(localFilters.endDate) : undefined}
            setDate={(d) =>
              setLocalFilters((prev) => ({ ...prev, endDate: d?.toISOString() || null }))
            }
            className="min-h-[44px] h-[44px]"
            placeholder="Data final"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label
            htmlFor="analytics-type-select"
            className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide"
          >
            Tipo de Demanda
          </label>
          <Select
            value={localFilters.type}
            onValueChange={(v) => setLocalFilters((p) => ({ ...p, type: v as any }))}
          >
            <SelectTrigger
              id="analytics-type-select"
              className="min-h-[44px] h-[44px] bg-background font-medium border-input"
              aria-label="Filtrar por tipo de demanda"
            >
              <SelectValue placeholder="Selecione o Tipo" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="Ambos">Ambos os tipos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row xl:flex-col justify-end gap-3 xl:w-[220px] shrink-0 mt-2 xl:mt-0 xl:pt-[28px]">
        <Button
          onClick={() => onApply(localFilters)}
          className="min-h-[44px] h-[44px] w-full font-bold shadow-sm"
          aria-label="Aplicar filtros"
        >
          <Filter className="w-[18px] h-[18px] mr-2" aria-hidden="true" /> Aplicar Filtros
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const reset = { startDate: null, endDate: null, type: 'Ambos' as const }
            setLocalFilters(reset)
            onApply(reset)
          }}
          className="min-h-[44px] h-[44px] w-full font-semibold border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
          aria-label="Resetar filtros"
        >
          <RefreshCw className="w-[18px] h-[18px] mr-2" aria-hidden="true" /> Limpar
        </Button>
      </div>
    </div>
  )
}
