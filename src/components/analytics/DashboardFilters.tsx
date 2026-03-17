import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Filter } from 'lucide-react'
import { AnalyticsFiltersState } from '@/lib/analytics-utils'

interface Props {
  initialFilters: AnalyticsFiltersState
  onApply: (filters: AnalyticsFiltersState) => void
}

export function DashboardFilters({ initialFilters, onApply }: Props) {
  const [filters, setFilters] = useState<AnalyticsFiltersState>(initialFilters)

  const handlePeriodChange = (val: string) => {
    setFilters((p) => {
      const next = { ...p, period: val as any }
      if (val !== 'custom') {
        next.startDate = undefined
        next.endDate = undefined
      }
      return next
    })
  }

  return (
    <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-xl shadow-[0_4px_12px_rgba(26,58,82,0.05)] border-[2px] border-[#2E5F8A]/20">
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-[#999999] uppercase tracking-wider">
            Período
          </label>
          <Select value={filters.period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="h-[44px]">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Semana Atual</SelectItem>
              <SelectItem value="month">Mês Atual</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filters.period === 'custom' && (
          <>
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[12px] font-bold text-[#999999] uppercase tracking-wider">
                Data Início
              </label>
              <DatePicker
                date={filters.startDate}
                setDate={(d) => setFilters((p) => ({ ...p, startDate: d }))}
                className="h-[44px]"
              />
            </div>
            <div className="space-y-1.5 animate-fade-in">
              <label className="text-[12px] font-bold text-[#999999] uppercase tracking-wider">
                Data Fim
              </label>
              <DatePicker
                date={filters.endDate}
                setDate={(d) => setFilters((p) => ({ ...p, endDate: d }))}
                className="h-[44px]"
              />
            </div>
          </>
        )}

        <div className="space-y-1.5">
          <label className="text-[12px] font-bold text-[#999999] uppercase tracking-wider">
            Tipo de Negócio
          </label>
          <Select
            value={filters.type}
            onValueChange={(v) => setFilters((p) => ({ ...p, type: v as any }))}
          >
            <SelectTrigger className="h-[44px]">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Ambos">Ambos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-end">
        <Button
          onClick={() => onApply(filters)}
          className="h-[44px] w-full xl:w-auto px-8 font-bold transition-all"
        >
          <Filter className="w-4 h-4 mr-2" /> Aplicar Filtros
        </Button>
      </div>
    </div>
  )
}
