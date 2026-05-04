import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePeriodStore } from '@/stores/use-period-store'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

export function PeriodSelector() {
  const { period, setPeriod, customRange, setCustomRange, transactionType, setTransactionType } =
    usePeriodStore()
  const [showCustom, setShowCustom] = useState(period === 'custom')
  const [start, setStart] = useState<Date | undefined>(customRange?.start)
  const [end, setEnd] = useState<Date | undefined>(customRange?.end)

  const handlePeriodChange = (val: string) => {
    if (!val) return
    setPeriod(val as any)
    if (val === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
    }
  }

  const applyCustom = () => {
    if (start && end) {
      setCustomRange({ start, end })
    }
  }

  return (
    <div className="w-full flex flex-col items-center gap-4 py-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center w-full">
        <ToggleGroup
          type="single"
          value={period}
          onValueChange={handlePeriodChange}
          className="bg-[#1A3A52]/5 p-1 rounded-lg border border-[#1A3A52]/10 flex flex-wrap"
        >
          <ToggleGroupItem
            value="today"
            className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Hoje
          </ToggleGroupItem>
          <ToggleGroupItem
            value="week"
            className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Esta Semana
          </ToggleGroupItem>
          <ToggleGroupItem
            value="month"
            className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Este Mês
          </ToggleGroupItem>
          <ToggleGroupItem
            value="custom"
            className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Personalizado
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="h-8 w-px bg-gray-200 hidden sm:block mx-2"></div>

        <ToggleGroup
          type="single"
          value={transactionType}
          onValueChange={(v) => v && setTransactionType(v as any)}
          className="bg-blue-50/50 p-1 rounded-lg border border-blue-100 flex flex-wrap"
        >
          <ToggleGroupItem
            value="Todos"
            className="data-[state=on]:bg-blue-600 data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Todos
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Locação"
            className="data-[state=on]:bg-blue-600 data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Locação
          </ToggleGroupItem>
          <ToggleGroupItem
            value="Venda"
            className="data-[state=on]:bg-blue-600 data-[state=on]:text-white font-bold px-4 py-2 rounded-md transition-all"
          >
            Venda
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      {showCustom && (
        <div className="flex flex-col sm:flex-row items-center gap-4 animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <DatePicker date={start} setDate={setStart} placeholder="Data inicial" />
            <span className="text-gray-500 font-bold">até</span>
            <DatePicker date={end} setDate={setEnd} placeholder="Data final" />
          </div>
          <Button
            onClick={applyCustom}
            disabled={!start || !end}
            className="bg-[#1A3A52] text-white"
          >
            Aplicar Filtro
          </Button>
        </div>
      )}

      {period === 'custom' && customRange && !showCustom && (
        <div className="text-sm font-bold text-gray-600">
          Exibindo de {format(customRange.start, 'dd/MM/yyyy')} até{' '}
          {format(customRange.end, 'dd/MM/yyyy')}
        </div>
      )}
    </div>
  )
}
