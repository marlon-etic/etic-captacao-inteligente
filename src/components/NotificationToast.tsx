import React from 'react'
import { useNotification, NotificationOptions } from '@/hooks/useNotification'

export function NotificationToast(props: NotificationOptions) {
  const { showNotification } = useNotification()

  React.useEffect(() => {
    showNotification(props)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
