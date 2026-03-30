import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

// Estado global mantido em memória para sincronia instantânea
let globalDeletedIds: string[] = []
const listeners = new Set<() => void>()

const notifyListeners = () => {
  listeners.forEach((l) => l())
}

let isSubscribed = false
let globalChannel: any = null

export function useDeletedProperties() {
  const [deletedIds, setDeletedIds] = useState<string[]>(globalDeletedIds)

  useEffect(() => {
    const listener = () => setDeletedIds([...globalDeletedIds])
    listeners.add(listener)

    if (!isSubscribed) {
      isSubscribed = true

      globalChannel = supabase.channel('global_imoveis_sync')

      globalChannel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
        (payload: any) => {
          console.log('🔴 [GLOBAL REALTIME] Imóvel deletado (DB):', payload.old?.id)
          if (payload.old?.id && !globalDeletedIds.includes(payload.old.id)) {
            globalDeletedIds.push(payload.old.id)
            notifyListeners()
          }
        },
      )

      globalChannel.on('broadcast', { event: 'imovel_deleted' }, (payload: any) => {
        console.log('⚡ [GLOBAL BROADCAST] Imóveis deletados:', payload.payload?.ids)
        if (payload.payload?.ids && Array.isArray(payload.payload.ids)) {
          let changed = false
          payload.payload.ids.forEach((id: string) => {
            if (id && !globalDeletedIds.includes(id)) {
              globalDeletedIds.push(id)
              changed = true
            }
          })
          if (changed) notifyListeners()
        }
      })

      globalChannel.subscribe((status: string) => {
        console.log('📡 [GLOBAL REALTIME] Sync de Deleções Status:', status)
      })
    }

    return () => {
      listeners.delete(listener)
    }
  }, [])

  return deletedIds
}
