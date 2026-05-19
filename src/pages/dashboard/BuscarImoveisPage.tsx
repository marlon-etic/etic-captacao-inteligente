import { BuscarImoveisTab } from '@/components/BuscarImoveisTab'
import { BuscarDemandas } from '@/components/captador/BuscarDemandas'
import useAppStore from '@/stores/useAppStore'

export default function BuscarImoveisPage() {
  const { currentUser } = useAppStore()
  const isCaptador = currentUser?.role === 'captador'

  return (
    <div className="w-full max-w-7xl mx-auto pb-24 animate-in fade-in duration-500 px-4 sm:px-0 mt-4">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="text-[24px] md:text-[28px] font-black text-[#1A3A52] tracking-tight">
          {isCaptador ? 'Buscar Demandas' : 'Buscar Imóveis'}
        </h1>
        <p className="text-gray-500 font-medium">
          {isCaptador
            ? 'Hub central para localizar demandas ativas e vincular imóveis do seu portfólio.'
            : 'Hub central para localizar e vincular imóveis do sistema às suas demandas ativas.'}
        </p>
      </div>
      {isCaptador ? <BuscarDemandas /> : <BuscarImoveisTab />}
    </div>
  )
}
