import { BuscarDemandas } from '@/components/captador/BuscarDemandas'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export default function DisponivelGeralPage() {
  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link to="/app">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-[24px] md:text-[28px] font-black text-[#1A3A52] tracking-tight truncate">
            Buscar Oportunidades
          </h1>
        </div>
        <p className="text-gray-500 font-medium ml-12">
          Encontre demandas abertas de clientes e vincule seus imóveis captados para gerar matches.
        </p>
      </div>

      <BuscarDemandas />
    </div>
  )
}
