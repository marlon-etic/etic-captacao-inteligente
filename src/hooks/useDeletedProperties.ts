import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'

let globalDeletedIds: string[] = []
const listeners: Set<() => void> = new Set()
let channelInstance: any = null

const notifyListeners = () => {
  listeners.forEach((listener) => listener())
}

export const addDeletedIds = (ids: string[]) => {
  let changed = false
  ids.forEach((id) => {
    if (!globalDeletedIds.includes(id)) {
      globalDeletedIds.push(id)
      changed = true
      window.dispatchEvent(new CustomEvent('global-delete-imovel', { detail: { id } }))
    }
  })
  if (changed) notifyListeners()
}

export function useDeletedProperties() {
  const [deletedIds, setDeletedIds] = useState<string[]>(globalDeletedIds)
  const { user } = useAuth()

  useEffect(() => {
    const handleUpdate = () => setDeletedIds([...globalDeletedIds])
    listeners.add(handleUpdate)

    if (!channelInstance && user) {
      channelInstance = supabase.channel('global-deletes')

      channelInstance.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'imoveis_captados' },
        (payload: any) => {
          console.group('[DELETE-PROPAGATED] Realtime Subscription')
          console.log('ID:', payload.old?.id)
          console.log('Timestamp:', new Date().toISOString())
          console.groupEnd()
          if (payload.old?.id) {
            addDeletedIds([payload.old.id])
          }
        },
      )

      channelInstance.on('broadcast', { event: 'DELETE_IMOVEL' }, (payload: any) => {
        console.group('[DELETE-PROPAGATED] Broadcast')
        console.log('Payload:', payload.payload)
        console.log('Timestamp:', new Date().toISOString())
        console.groupEnd()
        if (payload.payload?.ids) {
          addDeletedIds(payload.payload.ids)
        } else if (payload.payload?.id) {
          addDeletedIds([payload.payload.id])
        }
      })

      channelInstance.on('broadcast', { event: 'RESET_BASE' }, () => {
        console.log('[RESET-PROPAGATED] via broadcast', { timestamp: new Date().toISOString() })
        globalDeletedIds = []
        notifyListeners()
        window.dispatchEvent(new CustomEvent('force-refresh-data'))
      })

      channelInstance.subscribe()
    }

    return () => {
      listeners.delete(handleUpdate)
    }
  }, [user])

  return deletedIds
}
