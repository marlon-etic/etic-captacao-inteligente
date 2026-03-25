import { CapturedPropertiesView } from '@/components/CapturedPropertiesView'

export default function MeusCaptadosPage() {
  return (
    <div className="w-full animate-fade-in space-y-4">
      <div className="flex flex-col gap-1.5 bg-white p-5 rounded-xl border border-[#E5E5E5] shadow-[0_2px_8px_rgba(26,58,82,0.05)]">
        <h1 className="text-[22px] font-black text-[#1A3A52] flex items-center gap-2">
          <span>🏢</span> Meus Captados
        </h1>
        <p className="text-sm text-gray-500 font-medium leading-relaxed">
          Gerencie todos os imóveis que você captou. Acompanhe o status e realize edições quando
          necessário.
        </p>
      </div>
      <CapturedPropertiesView emptyStateText="Você ainda não captou nenhum imóvel." />
    </div>
  )
}
