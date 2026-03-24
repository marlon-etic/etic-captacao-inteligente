import { useBairrosSelection } from '@/hooks/use-bairros-selection'
import { BairroSelector } from '@/components/BairroSelector'

interface LocationSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  error?: boolean
  demandId?: string
  demandType?: 'Aluguel' | 'Venda'
}

export function LocationSelector({
  value = [],
  onChange,
  error,
  demandId,
  demandType,
}: LocationSelectorProps) {
  const { selectedBairros, toggleAncora, toggleSatelite, clearAll, isSaving, saveStatus } =
    useBairrosSelection({
      initialBairros: value,
      onChange,
      demandId,
      demandType,
    })

  return (
    <BairroSelector
      selectedBairros={selectedBairros}
      toggleAncora={toggleAncora}
      toggleSatelite={toggleSatelite}
      onClear={clearAll}
      isSaving={isSaving}
      saveStatus={saveStatus}
      error={error}
    />
  )
}
