import * as React from 'react'

import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-[8px] border border-[#E0E0E0] bg-[#FFFFFF] px-[16px] py-[12px] text-[16px] font-medium text-[#333333] placeholder:text-[#999999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:border-transparent focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Textarea.displayName = 'Textarea'

export { Textarea }
