import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[8px] text-[14px] font-bold ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] shadow-[0_2px_4px_rgba(26,58,82,0.1)] hover:shadow-[0_4px_8px_rgba(26,58,82,0.15)] [&_svg]:pointer-events-none [&_svg]:size-5 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-[#1A3A52] text-white hover:bg-[#1f4866]',
        destructive: 'bg-[#F44336] text-white hover:bg-[#d32f2f]',
        outline: 'border-[2px] border-[#2E5F8A] bg-transparent text-[#1A3A52] hover:bg-[#F5F5F5]',
        secondary: 'bg-[#F5F5F5] text-[#333333] hover:bg-[#FFFFFF]',
        ghost:
          'text-[#1A3A52] hover:bg-[#F5F5F5] hover:text-[#1A3A52] shadow-none hover:shadow-none',
        link: 'text-[#1A3A52] underline-offset-4 hover:underline shadow-none hover:shadow-none',
      },
      size: {
        default: 'min-h-[44px] px-[16px] py-[10px] md:min-h-[48px] md:py-[12px]',
        sm: 'min-h-[40px] rounded-[8px] px-[12px] md:min-h-[44px] md:px-[16px]',
        lg: 'min-h-[52px] rounded-[8px] px-[20px] md:min-h-[56px] md:px-[24px]',
        icon: 'min-h-[44px] min-w-[44px] w-[44px] h-[44px] md:min-h-[48px] md:min-w-[48px] md:w-[48px] md:h-[48px] px-0 py-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
