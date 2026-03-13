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
    <div className="bg-card p-4 md:p-6 rounded-xl border border-border shadow-sm space-y-4 lg:space-y-0 lg:flex lg:gap-4 lg:items-end">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-1 gap-4">
        <div className="space-y-2 lg:flex-1">
          <label className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold text-muted-foreground">
            Período
          </label>
          <Select
            value={local.period}
            onValueChange={(v: any) => setLocal({ ...local, period: v })}
          >
            <SelectTrigger className="min-h-[44px] bg-background">
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
            <div className="space-y-2 lg:flex-1">
              <label className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold text-muted-foreground">
                Início
              </label>
              <DatePicker
                date={local.startDate ? new Date(local.startDate) : undefined}
                setDate={(d) => setLocal({ ...local, startDate: d?.toISOString() || null })}
                className="min-h-[44px]"
              />
            </div>
            <div className="space-y-2 lg:flex-1">
              <label className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold text-muted-foreground">
                Fim
              </label>
              <DatePicker
                date={local.endDate ? new Date(local.endDate) : undefined}
                setDate={(d) => setLocal({ ...local, endDate: d?.toISOString() || null })}
                className="min-h-[44px]"
              />
            </div>
          </>
        )}

        <div className="space-y-2 lg:flex-1">
          <label className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold text-muted-foreground">
            Tipo de Negócio
          </label>
          <Select value={local.type} onValueChange={(v: any) => setLocal({ ...local, type: v })}>
            <SelectTrigger className="min-h-[44px] bg-background">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent zIndex={100}>
              <SelectItem value="Ambos">Ambos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 lg:flex-1">
          <label className="text-[12px] md:text-[13px] lg:text-[14px] font-semibold text-muted-foreground">
            Bairro
          </label>
          <Select
            value={local.neighborhood}
            onValueChange={(v: any) => setLocal({ ...local, neighborhood: v })}
          >
            <SelectTrigger className="min-h-[44px] bg-background">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent zIndex={100}>
              <SelectItem value="Todos">Todos</SelectItem>
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
        className="w-full lg:w-auto min-h-[44px] gap-2 font-bold shrink-0 mt-4 lg:mt-0"
      >
        <Filter className="w-4 h-4" /> Aplicar Filtros
      </Button>
    </div>
  )
}
