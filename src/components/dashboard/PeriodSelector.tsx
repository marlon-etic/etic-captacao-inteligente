import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePeriodStore } from '@/stores/use-period-store'

export function PeriodSelector() {
  const { period, setPeriod } = usePeriodStore()

  return (
    <div className="w-full flex justify-center py-4 bg-white/50 backdrop-blur-sm rounded-xl border border-gray-100 mb-6 shadow-sm">
      <ToggleGroup
        type="single"
        value={period}
        onValueChange={(val) => val && setPeriod(val as any)}
        className="bg-[#1A3A52]/5 p-1 rounded-lg border border-[#1A3A52]/10"
      >
        <ToggleGroupItem
          value="today"
          className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-6 py-2 transition-all rounded-md"
        >
          Hoje
        </ToggleGroupItem>
        <ToggleGroupItem
          value="week"
          className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-6 py-2 transition-all rounded-md"
        >
          Esta Semana
        </ToggleGroupItem>
        <ToggleGroupItem
          value="month"
          className="data-[state=on]:bg-[#1A3A52] data-[state=on]:text-white font-bold px-6 py-2 transition-all rounded-md"
        >
          Este Mês
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  )
}
