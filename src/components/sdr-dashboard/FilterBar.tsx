import { useState } from 'react'
import { useSdrStore } from '@/hooks/use-sdr-store'
import { Button } from '@/components/ui/button'
import { DatePicker } from '@/components/ui/date-picker'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

export function FilterBar() {
  const store = useSdrStore()
  const { periodo, setPeriodo } = store
  const periods = ['hoje', 'semana', 'mes', 'sempre', 'custom'] as const
  const labels = {
    hoje: 'Hoje',
    semana: 'Esta Semana',
    mes: 'Este Mês',
    sempre: 'Sempre',
    custom: 'Personalizado',
  }

  const [showCustom, setShowCustom] = useState(periodo === 'custom')
  const [start, setStart] = useState<Date | undefined>(
    store.dataCustomStart ? new Date(store.dataCustomStart) : undefined,
  )
  const [end, setEnd] = useState<Date | undefined>(
    store.dataCustomEnd ? new Date(store.dataCustomEnd) : undefined,
  )

  const handlePeriodChange = (val: string) => {
    setPeriodo(val as any)
    if (val === 'custom') {
      setShowCustom(true)
    } else {
      setShowCustom(false)
    }
  }

  const applyCustom = () => {
    if (start && end && store.setDataCustomStart && store.setDataCustomEnd) {
      store.setDataCustomStart(start.toISOString())
      store.setDataCustomEnd(end.toISOString())
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-gray-500">Filtrar por:</span>
        <Select value={periodo} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px] bg-white font-bold h-9">
            <SelectValue placeholder="Selecione o período" />
          </SelectTrigger>
          <SelectContent>
            {periods.map((p) => (
              <SelectItem key={p} value={p} className="font-medium">
                {labels[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {showCustom && (
        <div className="flex flex-col sm:flex-row items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 px-2">
            <DatePicker date={start} setDate={setStart} placeholder="Início" />
            <span className="text-gray-400 font-bold text-sm">até</span>
            <DatePicker date={end} setDate={setEnd} placeholder="Fim" />
          </div>
          <Button
            size="sm"
            onClick={applyCustom}
            disabled={!start || !end}
            className="bg-[#1A3A52] text-white font-bold h-8"
          >
            Aplicar
          </Button>
        </div>
      )}
    </div>
  )
}
