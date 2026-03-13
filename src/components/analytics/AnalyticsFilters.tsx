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
    <div className="flex flex-col xl:flex-row gap-[16px] xl:gap-[24px] bg-card p-[16px] md:p-[20px] lg:p-[24px] rounded-xl border border-border shadow-sm w-full">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-[16px] xl:gap-[24px]">
        <div className="flex flex-col gap-2">
          <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-foreground">
            Data Início
          </label>
          <DatePicker
            date={localFilters.startDate ? new Date(localFilters.startDate) : undefined}
            setDate={(d) =>
              setLocalFilters((prev) => ({ ...prev, startDate: d?.toISOString() || null }))
            }
            className="h-[48px] xl:h-[44px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-foreground">
            Data Fim
          </label>
          <DatePicker
            date={localFilters.endDate ? new Date(localFilters.endDate) : undefined}
            setDate={(d) =>
              setLocalFilters((prev) => ({ ...prev, endDate: d?.toISOString() || null }))
            }
            className="h-[48px] xl:h-[44px]"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-[12px] sm:text-[13px] lg:text-[14px] font-semibold text-foreground">
            Tipo de Demanda
          </label>
          <Select
            value={localFilters.type}
            onValueChange={(v) => setLocalFilters((p) => ({ ...p, type: v as any }))}
          >
            <SelectTrigger className="h-[48px] xl:h-[44px] bg-background font-medium border-input">
              <SelectValue placeholder="Selecione o Tipo" />
            </SelectTrigger>
            <SelectContent className="z-50">
              <SelectItem value="Ambos">Ambos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="flex flex-col sm:flex-row xl:flex-col justify-end gap-[12px] xl:w-[200px] mt-2 xl:mt-0 pt-2 xl:pt-6">
        <Button
          onClick={() => onApply(localFilters)}
          className="h-[48px] xl:h-[44px] w-full font-bold shadow-sm"
        >
          <Filter className="w-[18px] h-[18px] mr-2" /> Aplicar Filtros
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            const reset = { startDate: null, endDate: null, type: 'Ambos' as const }
            setLocalFilters(reset)
            onApply(reset)
          }}
          className="h-[48px] xl:h-[44px] w-full font-semibold border-input bg-background hover:bg-accent text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="w-[18px] h-[18px] mr-2" /> Resetar Filtros
        </Button>
      </div>
    </div>
  )
}
