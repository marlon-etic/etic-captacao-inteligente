import { useRef, useState, useEffect, ReactNode } from 'react'
import { TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

interface ScrollableTabsProps {
  tabs: { value: string; label: ReactNode }[]
  activeTab: string
  onTabChange: (value: string) => void
  className?: string
}

export function ScrollableTabs({ tabs, activeTab, onTabChange, className }: ScrollableTabsProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth)
    }
  }

  useEffect(() => {
    checkScroll()
    window.addEventListener('resize', checkScroll)
    return () => window.removeEventListener('resize', checkScroll)
  }, [])

  useEffect(() => {
    if (scrollRef.current) {
      setTimeout(() => {
        if (!scrollRef.current) return
        const activeElement = scrollRef.current.querySelector(
          `[data-state="active"]`,
        ) as HTMLElement
        if (activeElement) {
          const containerWidth = scrollRef.current.clientWidth
          const elementOffset = activeElement.offsetLeft
          const elementWidth = activeElement.clientWidth
          const scrollTarget = elementOffset - containerWidth / 2 + elementWidth / 2

          scrollRef.current.scrollTo({
            left: scrollTarget,
            behavior: 'smooth',
          })
        }
      }, 50)
    }
  }, [activeTab])

  return (
    <div className={cn('relative w-full overflow-hidden', className)}>
      {canScrollLeft && (
        <div
          className="absolute left-0 top-0 bottom-0 w-[32px] z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to right, rgba(0,0,0,0.15), transparent)' }}
        />
      )}

      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="overflow-x-auto scrollbar-hide w-full flex items-center scroll-smooth relative z-0"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `.scrollbar-hide::-webkit-scrollbar { display: none; }`,
          }}
        />
        <TabsList className="inline-flex shrink-0 min-w-max bg-transparent p-0 gap-2 h-auto pb-2">
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              onClick={() => onTabChange(tab.value)}
              className={cn(
                'h-[48px] px-4 whitespace-nowrap rounded-[8px] font-bold transition-all data-[state=active]:bg-[#1A3A52] data-[state=active]:text-white data-[state=active]:shadow-[0_2px_4px_rgba(26,58,82,0.15)] data-[state=inactive]:bg-white data-[state=inactive]:text-[#999999] data-[state=inactive]:border data-[state=inactive]:border-[#E5E5E5] hover:data-[state=inactive]:text-[#1A3A52] hover:data-[state=inactive]:border-[#1A3A52]/30',
              )}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {canScrollRight && (
        <div
          className="absolute right-0 top-0 bottom-0 w-[32px] z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to left, rgba(0,0,0,0.15), transparent)' }}
        />
      )}
    </div>
  )
}
