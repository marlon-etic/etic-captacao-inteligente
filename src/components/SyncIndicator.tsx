import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncIndicator({ isSyncing }: { isSyncing: boolean }) {
  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 bg-white/90 backdrop-blur-md border border-[#E5E5E5] shadow-[0_4px_16px_rgba(0,0,0,0.1)] rounded-full px-4 py-2.5 flex items-center gap-2.5 text-[13px] font-bold text-[#1A3A52] z-[100] transition-all duration-300 pointer-events-none',
        isSyncing ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95',
      )}
    >
      <Loader2 className="w-4 h-4 animate-spin text-[#10B981]" />
      Sincronizando...
    </div>
  )
}
