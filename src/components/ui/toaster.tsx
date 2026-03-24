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
  const { toasts, dismiss } = useToast()

  const renderAnimatedTitle = (text: React.ReactNode) => {
    if (typeof text !== 'string') return text
    const match = text.match(/^(\p{Emoji})(.*)/u)
    if (match) {
      return (
        <span className="flex items-center gap-2">
          <span
            className="inline-block animate-bounce-scale origin-center text-[20px]"
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
    <ToastProvider duration={3000}>
      {toasts.map(function ({ id, title, description, action, duration, onClick, ...props }) {
        return (
          <Toast
            key={id}
            {...props}
            duration={duration}
            onClick={(e) => {
              if (onClick) onClick(e)
              dismiss(id)
            }}
          >
            <div className="grid gap-1">
              {title && <ToastTitle>{renderAnimatedTitle(title)}</ToastTitle>}
              {description && (
                <ToastDescription className="whitespace-pre-line leading-relaxed mt-1">
                  {description}
                </ToastDescription>
              )}
            </div>
            {action}
            <ToastClose
              onClick={(e) => {
                e.stopPropagation()
                dismiss(id)
              }}
            />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
