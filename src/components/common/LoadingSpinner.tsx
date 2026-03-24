import { Loader2 } from 'lucide-react'

export const LoadingSpinner = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-4 text-[#999999]">
      <Loader2 className="w-10 h-10 animate-spin text-[#1A3A52]" />
      <p className="font-bold text-sm uppercase tracking-wider">Carregando...</p>
    </div>
  </div>
)
