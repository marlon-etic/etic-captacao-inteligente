import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import React from 'react'

export function Toaster() {
  const { toasts } = useToast()

  const renderAnimatedTitle = (text: React.ReactNode) => {
    if (typeof text !== 'string') return text
    // Extract emoji to animate as an icon
    const match = text.match(/^(\p{Emoji})(.*)/u)
    if (match) {
      return (
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block animate-bounce-scale origin-center"
            style={{ animationDuration: '400ms' }}
          >
            {match[1]}
          </span>
          {match[2]}
        </span>
      )
    }
    return text
  }

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{renderAnimatedTitle(title)}</ToastTitle>}
              {description && <ToastDescription>{description}</ToastDescription>}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
