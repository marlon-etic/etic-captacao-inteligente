import { useEffect } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'

export default function Layout() {
  const { currentUser, sessionExpiresAt, logout } = useAppStore()
  const location = useLocation()
  const { toast } = useToast()

  useEffect(() => {
    if (currentUser && sessionExpiresAt && Date.now() > sessionExpiresAt) {
      toast({
        title: 'Sessão expirada',
        description: 'Sessão expirada. Faça login novamente.',
        variant: 'destructive',
      })
      logout()
    }
  }, [currentUser, sessionExpiresAt, logout, toast])

  if (!currentUser && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-muted/30">
        <Outlet />
      </main>
    )
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-[100dvh] overflow-hidden bg-muted/20">
        <AppHeader />
        <main className="flex-1 overflow-y-auto w-full max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-4 md:py-5 lg:py-6 animate-fade-in-up pb-safe-offset-4">
          <Outlet />
        </main>
        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
