import { Suspense, type ReactNode } from 'react'

export function LazyModalBoundary({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>
}
