import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import useAppStore from '@/stores/useAppStore'

export default function DisponivelGeralPage() {
  const { currentUser } = useAppStore()
  const filterType =
    currentUser?.role === 'corretor' ? 'Venda' : currentUser?.role === 'sdr' ? 'Aluguel' : undefined

  return (
    <div className="w-full animate-fade-in">
      <h1 className="text-[20px] font-bold text-[#1A3A52] mb-4">Disponível Geral</h1>
      <CapturedPropertiesView
        source="loose"
        filterType={filterType}
        emptyStateText="Nenhum imóvel solto disponível no momento."
      />
    </div>
  )
}
