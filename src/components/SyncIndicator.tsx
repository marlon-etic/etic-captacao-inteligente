import { Loader2 } from 'lucide-react'

export function SyncIndicator({ isSyncing }: { isSyncing?: boolean }) {
  if (!isSyncing) return null

  return (
    <div className="fixed bottom-4 left-4 bg-white shadow-lg rounded-full px-4 py-2 flex items-center gap-2 border border-gray-100 z-50 animate-fade-in pointer-events-none">
      <Loader2 className="w-4 h-4 text-[#10B981] animate-spin" />
      <span className="text-xs font-bold text-gray-600">Sincronizando...</span>
    </div>
  )
}
