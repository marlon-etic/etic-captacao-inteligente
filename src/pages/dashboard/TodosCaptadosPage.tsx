import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'
import useAppStore from '@/stores/useAppStore'

export default function TodosCaptadosPage() {
  const { currentUser } = useAppStore()
  const filterType =
    currentUser?.role === 'corretor' ? 'Venda' : currentUser?.role === 'sdr' ? 'Aluguel' : undefined

  return (
    <div className="w-full animate-fade-in">
      <h1 className="text-[20px] font-bold text-[#1A3A52] mb-4">Todos Captados</h1>
      <CapturedPropertiesView
        source="all"
        filterType={filterType}
        emptyStateText="Nenhum imóvel captado no momento."
      />
    </div>
  )
}
