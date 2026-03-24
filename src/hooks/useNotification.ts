import { useToast } from '@/hooks/use-toast'
import { useCallback } from 'react'

export interface NotificationOptions {
  type: 'success' | 'warning' | 'error' | 'info'
  title: string
  message: string
  icon?: string
  onClickAction?: () => void
  customColor?: string
}

export function useNotification() {
  const { toast, dismiss } = useToast()

  const showNotification = useCallback(
    ({ type, title, message, icon, onClickAction, customColor }: NotificationOptions) => {
      let bgColor =
        type === 'success'
          ? 'bg-[#10B981]'
          : type === 'warning'
            ? 'bg-[#FBBF24]'
            : type === 'error'
              ? 'bg-[#EF4444]'
              : 'bg-[#3B82F6]'

      let textColor = type === 'warning' ? 'text-[#854D0E]' : 'text-white'

      if (customColor) {
        const colors = customColor.split(' ')
        bgColor = colors[0]
        if (colors.length > 1) textColor = colors[1]
      }

      toast({
        title: `${icon ? icon + ' ' : ''}${title}`,
        description: message,
        className: `${bgColor} ${textColor} border-none shadow-xl cursor-pointer hover:opacity-90 transition-opacity w-[90vw] md:w-full`,
        duration: 1000000, // Persists until clicked or dismissed
        onClick: onClickAction,
      })
    },
    [toast],
  )

  return { showNotification, dismissNotification: dismiss }
}
