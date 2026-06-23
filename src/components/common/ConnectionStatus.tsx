import { useEffect } from 'react'
import { Wifi, WifiOff } from 'lucide-react'
import { useSystemStore } from '@/stores/useSystemStore'
import { supabase } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export function ConnectionStatus() {
  const { isOnline, setOnline } = useSystemStore()

  useEffect(() => {
    const handleOnline = () => setOnline(true)
    const handleOffline = () => setOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    const channel = supabase.channel('system-health-monitor')
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setOnline(true)
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setOnline(false)
      }
    })

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      supabase.removeChannel(channel)
    }
  }, [setOnline])

  return (
    <Badge
      variant="outline"
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 text-[11px] font-bold border-0 transition-colors shadow-none shrink-0',
        isOnline
          ? 'bg-emerald-500/20 text-emerald-100'
          : 'bg-red-500/20 text-red-100 animate-pulse',
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Sistema Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Conexão Perdida</span>
        </>
      )}
    </Badge>
  )
}
