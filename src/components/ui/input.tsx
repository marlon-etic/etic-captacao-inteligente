import * as React from 'react'

import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex min-h-[48px] w-full rounded-[8px] border-[1.5px] border-[#2E5F8A]/30 bg-[#FFFFFF] px-[16px] py-[12px] text-[14px] font-medium text-[#1A3A52] ring-offset-background file:border-0 file:bg-transparent file:text-[14px] file:font-medium placeholder:text-[#999999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 ease-in-out shadow-[inset_0_1px_2px_rgba(26,58,82,0.05)] hover:border-[#2E5F8A]/60',
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
Input.displayName = 'Input'

export { Input }
