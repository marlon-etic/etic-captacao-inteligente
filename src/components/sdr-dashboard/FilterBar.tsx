import { useSdrStore } from '@/hooks/use-sdr-store'
import { Button } from '@/components/ui/button'

export function FilterBar() {
  const { periodo, setPeriodo } = useSdrStore()
  const periods = ['hoje', 'semana', 'mes', 'custom'] as const
  const labels = { hoje: 'Hoje', semana: 'Esta Semana', mes: 'Este Mês', custom: 'Personalizado' }

  return (
    <div className="flex items-center bg-white border border-gray-200 rounded-lg p-1 shadow-sm overflow-x-auto max-w-full">
      {periods.map((p) => (
        <Button
          key={p}
          variant={periodo === p ? 'default' : 'ghost'}
          onClick={() => setPeriodo(p)}
          className={`text-sm font-bold h-8 px-4 rounded-md whitespace-nowrap ${periodo === p ? 'bg-[#1A3A52] text-white shadow-sm' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
        >
          {labels[p]}
        </Button>
      ))}
    </div>
  )
}
