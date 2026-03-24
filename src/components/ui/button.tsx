import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-[8px] whitespace-nowrap rounded-[8px] text-[14px] font-bold ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] enabled:shadow-[0_1px_2px_rgba(0,0,0,0.05)] enabled:hover:shadow-[0_4px_6px_rgba(0,0,0,0.1)] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-[#1A3A52] text-white enabled:hover:bg-[#1f4866] enabled:active:bg-[#153045] border border-transparent',
        destructive:
          'bg-[#EF4444] text-white enabled:hover:bg-[#DC2626] enabled:active:bg-[#B91C1C] border border-transparent enabled:shadow-[0_1px_2px_rgba(239,68,68,0.1)] enabled:hover:shadow-[0_4px_6px_rgba(239,68,68,0.2)]',
        outline:
          'border-[2px] border-[#E5E5E5] bg-[#FFFFFF] text-[#333333] enabled:hover:bg-[#F5F5F5] enabled:active:bg-[#E5E5E5]',
        secondary:
          'bg-[#F5F5F5] text-[#333333] enabled:hover:bg-[#E5E5E5] enabled:active:bg-[#D4D4D4] border border-transparent',
        ghost:
          'text-[#333333] enabled:hover:bg-[#F5F5F5] enabled:active:bg-[#E5E5E5] shadow-none enabled:hover:shadow-none border border-transparent',
        link: 'text-[#1A3A52] underline-offset-4 enabled:hover:underline shadow-none enabled:hover:shadow-none border border-transparent',
      },
      size: {
        default: 'min-h-[44px] px-[16px] py-[10px]',
        sm: 'min-h-[44px] rounded-[8px] px-[12px] text-[13px]',
        lg: 'min-h-[52px] rounded-[8px] px-[20px] md:min-h-[56px] md:px-[24px] text-[16px]',
        icon: 'min-h-[44px] min-w-[44px] w-[44px] h-[44px]',
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
  isLoading?: boolean
  loadingText?: string
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      isLoading,
      loadingText = 'Processando...',
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props}>
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {loadingText && <span>{loadingText}</span>}
          </>
        ) : (
          children
        )}
      </button>
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
