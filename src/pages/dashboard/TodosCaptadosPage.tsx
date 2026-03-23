import { PropertyList } from '@/components/PropertyList'
import useAppStore from '@/stores/useAppStore'

export default function TodosCaptadosPage() {
  const { currentUser } = useAppStore()
  const filterType =
    currentUser?.role === 'corretor' ? 'Venda' : currentUser?.role === 'sdr' ? 'Aluguel' : undefined

  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="flex flex-col gap-1.5 bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-[0_2px_8px_rgba(26,58,82,0.05)]">
        <h1 className="text-[22px] font-black text-[#1A3A52] flex items-center gap-2">
          <span>📋</span> Catálogo Geral de Imóveis
        </h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Acompanhe todos os imóveis captados em tempo real com vinculações, perfis completos e
          filtros de busca avançada.
        </p>
      </div>
      <PropertyList initialType={filterType} />
    </div>
  )
}
