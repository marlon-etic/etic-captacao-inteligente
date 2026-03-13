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
import { Filter } from 'lucide-react'
import { BAIRROS_ETIC } from '@/lib/bairros'

export interface PerformanceFilterState {
  period: 'Semana' | 'Mês' | 'Ano' | 'Customizado'
  startDate: string | null
  endDate: string | null
  type: 'Venda' | 'Aluguel' | 'Ambos'
  neighborhood: string
}

interface Props {
  filters: PerformanceFilterState
  onApply: (f: PerformanceFilterState) => void
}

export function PerformanceFilters({ filters, onApply }: Props) {
  const [local, setLocal] = useState<PerformanceFilterState>(filters)

  return (
    <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm flex flex-col xl:flex-row xl:items-end gap-4 w-full min-w-0">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
        <div className="flex flex-col gap-2">
          <label
            htmlFor="period-select"
            className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide"
          >
            Período
          </label>
          <Select
            value={local.period}
            onValueChange={(v: any) => setLocal({ ...local, period: v })}
          >
            <SelectTrigger
              id="period-select"
              className="min-h-[44px] h-[44px] bg-background border-input text-sm"
              aria-label="Selecionar período"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent zIndex={100}>
              <SelectItem value="Semana">Última Semana</SelectItem>
              <SelectItem value="Mês">Último Mês</SelectItem>
              <SelectItem value="Ano">Último Ano</SelectItem>
              <SelectItem value="Customizado">Customizado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {local.period === 'Customizado' && (
          <>
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide">
                Início
              </label>
              <DatePicker
                date={local.startDate ? new Date(local.startDate) : undefined}
                setDate={(d) => setLocal({ ...local, startDate: d?.toISOString() || null })}
                className="min-h-[44px] h-[44px]"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide">
                Fim
              </label>
              <DatePicker
                date={local.endDate ? new Date(local.endDate) : undefined}
                setDate={(d) => setLocal({ ...local, endDate: d?.toISOString() || null })}
                className="min-h-[44px] h-[44px]"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-2">
          <label
            htmlFor="type-select"
            className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide"
          >
            Tipo de Negócio
          </label>
          <Select value={local.type} onValueChange={(v: any) => setLocal({ ...local, type: v })}>
            <SelectTrigger
              id="type-select"
              className="min-h-[44px] h-[44px] bg-background border-input text-sm"
              aria-label="Selecionar tipo de negócio"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent zIndex={100}>
              <SelectItem value="Ambos">Ambos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col gap-2">
          <label
            htmlFor="neighborhood-select"
            className="text-xs sm:text-sm font-bold text-foreground/80 uppercase tracking-wide"
          >
            Bairro
          </label>
          <Select
            value={local.neighborhood}
            onValueChange={(v: any) => setLocal({ ...local, neighborhood: v })}
          >
            <SelectTrigger
              id="neighborhood-select"
              className="min-h-[44px] h-[44px] bg-background border-input text-sm"
              aria-label="Selecionar bairro"
            >
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent zIndex={100} className="max-h-[300px]">
              <SelectItem value="Todos">Todos os bairros</SelectItem>
              {BAIRROS_ETIC.map((b) => (
                <SelectItem key={b} value={b}>
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        onClick={() => onApply(local)}
        className="w-full xl:w-auto min-h-[44px] h-[44px] gap-2 font-bold shrink-0 shadow-sm mt-2 xl:mt-0"
        aria-label="Aplicar filtros de performance"
      >
        <Filter className="w-4 h-4" aria-hidden="true" /> Aplicar Filtros
      </Button>
    </div>
  )
}
