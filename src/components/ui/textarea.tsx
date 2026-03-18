import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-[8px] border-[1.5px] border-[#2E5F8A]/30 bg-[#FFFFFF] px-[16px] py-[12px] text-[14px] ring-offset-background placeholder:text-[#999999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out shadow-[inset_0_1px_2px_rgba(26,58,82,0.05)] hover:border-[#2E5F8A]/60',
          className,
        )}
        ref={ref}
        onFocus={(e) => {
          props.onFocus?.(e)
          setTimeout(() => {
            e.target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 300)
        }}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
