import { Loader2 } from 'lucide-react'

export function PageLoader() {
  return (
    <div className="flex min-h-[400px] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A3A52]" />
        <p className="text-sm font-medium text-[#999999]">Carregando...</p>
      </div>
    </div>
  )
}
