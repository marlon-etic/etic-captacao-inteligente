import { useSdrStore } from '@/hooks/use-sdr-store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FilterBar() {
  const { periodo, setPeriodo } = useSdrStore()
  const periods = ['hoje', 'semana', 'mes', 'custom'] as const
  const labels = { hoje: 'Hoje', semana: 'Esta Semana', mes: 'Este Mês', custom: 'Personalizado' }

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm overflow-x-auto max-w-full">
      {periods.map((p) => (
        <Button
          key={p}
          variant="outline"
          onClick={() => setPeriodo(p)}
          className={cn(
            'text-sm font-bold h-8 px-4 rounded-md whitespace-nowrap border-none transition-all',
            periodo === p
              ? 'bg-[#1A3A52] text-white shadow-sm hover:bg-[#1A3A52]/90 hover:text-white'
              : 'text-gray-500 hover:text-[#1A3A52] hover:bg-gray-100 bg-transparent',
          )}
        >
          {labels[p]}
        </Button>
      ))}
    </div>
  )
}
