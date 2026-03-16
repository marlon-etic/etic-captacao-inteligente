import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-[6px] border px-[8px] py-[4px] text-[12px] font-bold transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#1A3A52] focus:ring-offset-2 shadow-[0_2px_4px_rgba(26,58,82,0.1)]',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-[#1A3A52] text-white',
        secondary: 'border-transparent bg-[#F5F5F5] text-[#333333]',
        destructive: 'border-transparent bg-[#F44336] text-white',
        outline: 'text-[#1A3A52] border-[#2E5F8A] bg-[#FFFFFF]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
