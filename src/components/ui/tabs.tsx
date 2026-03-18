import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      'inline-flex h-auto items-center justify-center rounded-[8px] bg-[#F5F5F5] p-1 text-[#333333] shadow-[inset_0_1px_2px_rgba(26,58,82,0.05)] transition-all duration-200 ease-in-out',
      className,
    )}
    {...props}
  />
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      'inline-flex min-h-[44px] md:min-h-[48px] items-center justify-center whitespace-nowrap rounded-[6px] px-[16px] py-[8px] text-[14px] font-bold ring-offset-background transition-all duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-50 data-[state=inactive]:text-[#333333] data-[state=inactive]:bg-transparent data-[state=inactive]:hover:bg-[#FFFFFF] data-[state=active]:bg-[#1A3A52] data-[state=active]:text-[#FFFFFF] data-[state=active]:shadow-[0_2px_4px_rgba(26,58,82,0.15)] data-[state=active]:border-b-[2px] data-[state=active]:border-[#FFFFFF]',
      className,
    )}
    {...props}
  />
))
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1A3A52] focus-visible:ring-offset-0 data-[state=active]:animate-fade-in',
      className,
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
