import { useState, useEffect, useCallback, useRef } from 'react'

export function useKeyboard() {
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false)
  const [viewportHeight, setViewportHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 0,
  )
  const isOpenRef = useRef(false)

  const scrollToActiveField = useCallback(() => {
    setTimeout(() => {
      const activeField = document.activeElement
      if (activeField && (activeField.tagName === 'INPUT' || activeField.tagName === 'TEXTAREA')) {
        activeField.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 150)
  }, [])

  useEffect(() => {
    const handleViewportChange = () => {
      const viewport = window.visualViewport
      if (viewport) {
        setViewportHeight(viewport.height)
        // A height less than 85% of the inner height usually indicates a keyboard is open
        const isOpen = viewport.height < window.innerHeight * 0.85

        if (isOpen !== isOpenRef.current) {
          isOpenRef.current = isOpen
          setIsKeyboardOpen(isOpen)
          if (isOpen) {
            scrollToActiveField()
          }
        }
      }
    }

    window.visualViewport?.addEventListener('resize', handleViewportChange)
    window.visualViewport?.addEventListener('scroll', handleViewportChange)

    // Initial check
    handleViewportChange()

    return () => {
      window.visualViewport?.removeEventListener('resize', handleViewportChange)
      window.visualViewport?.removeEventListener('scroll', handleViewportChange)
    }
  }, [scrollToActiveField])

  return { isKeyboardOpen, viewportHeight }
}
