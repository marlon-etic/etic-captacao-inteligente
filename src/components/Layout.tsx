import { useState, useEffect, useRef } from 'react'
import { Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { AddPropertyModal } from '@/components/AddPropertyModal'
import { NewDemandModal } from '@/components/NewDemandModal'
import { Plus, Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { useSmartSync } from '@/hooks/useSmartSync'

export default function Layout() {
  const { currentUser, sessionExpiresAt, logout, isRestoringUser } = useAppStore()
  const { session, loading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { enqueueMutation } = useSmartSync()

  const [isAddPropertyModalOpen, setAddPropertyModalOpen] = useState(false)
  const [isNewDemandModalOpen, setNewDemandModalOpen] = useState(false)

  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const isMountedRef = useRef(true)

  // Listen to global navigation events dispatched from outside router components (e.g. Hooks/Toasts)
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>
      if (customEvent.detail) {
        navigate(customEvent.detail)
      }
    }
    window.addEventListener('navigate-to', handleNavigate)
    return () => window.removeEventListener('navigate-to', handleNavigate)
  }, [navigate])

  useEffect(() => {
    isMountedRef.current = true
    if (!currentUser) return

    const updatePrazos = () => {
      if (!isMountedRef.current) return

      enqueueMutation(async () => {
        const { error } = await supabase.rpc('atualizar_prazos_vencidos')
        if (error) throw error
      })
    }

    // Delay inicial para evitar sobrecarga no startup da página
    timeoutRef.current = setTimeout(() => updatePrazos(), 5000)
    intervalRef.current = setInterval(() => updatePrazos(), 60000)

    return () => {
      isMountedRef.current = false
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [currentUser, enqueueMutation])

  useEffect(() => {
    // Only logout if auth is completely resolved, session is invalid, and user was previously logged in
    if (!loading && !isRestoringUser && !session && currentUser) {
      toast({
        title: 'Sessão inválida',
        description: 'Sua sessão expirou ou foi desconectada. Faça login novamente.',
        variant: 'destructive',
      })
      logout()
    }
  }, [loading, isRestoringUser, session, currentUser, logout, toast])

  useEffect(() => {
    if (!isRestoringUser && currentUser && sessionExpiresAt && Date.now() > sessionExpiresAt) {
      toast({
        title: 'Sessão expirada',
        description: 'Sua sessão atingiu o tempo limite. Faça login novamente.',
        variant: 'destructive',
      })
      logout()
    }
  }, [currentUser, isRestoringUser, sessionExpiresAt, logout, toast])

  useEffect(() => {
    if (
      !isRestoringUser &&
      currentUser &&
      (currentUser.status === 'bloqueado' || currentUser.status === 'inativo')
    ) {
      toast({
        title: 'Acesso Negado',
        description: 'Sua conta foi bloqueada ou inativada pelo administrador.',
        variant: 'destructive',
      })
      logout()
    }
  }, [currentUser, isRestoringUser, logout, toast])

  if (loading || isRestoringUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1A3A52]" />
      </div>
    )
  }

  // Prevent infinite loop by not checking session explicitly here - trust currentUser
  if (!currentUser && location.pathname !== '/') {
    return <Navigate to="/" replace />
  }

  if (!currentUser) {
    return (
      <main className="min-h-screen bg-[#F5F5F5]">
        <Outlet />
      </main>
    )
  }

  const canCreateDemand =
    currentUser?.role === 'sdr' || currentUser?.role === 'corretor' || currentUser?.role === 'admin'

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex flex-col min-h-[100dvh] overflow-hidden bg-[#F5F5F5] relative">
        <AppHeader onAddPropertyClick={() => setAddPropertyModalOpen(true)} />
        <main className="flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto px-[16px] min-[480px]:px-[24px] md:px-[32px] pt-[16px] pb-[100px] md:pb-[32px] animate-fade-in-up">
          <Outlet />
        </main>

        {currentUser?.role === 'captador' && (
          <>
            <button
              onClick={() => setAddPropertyModalOpen(true)}
              className="md:hidden fixed bottom-[80px] right-[16px] w-[56px] h-[56px] bg-[#10B981] hover:bg-[#059669] text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.15)] z-[1000] active:scale-95 transition-transform"
              aria-label="Adicionar Imóvel"
            >
              <Plus className="w-8 h-8" />
            </button>
            <button
              id="btn-add-property-trigger"
              className="hidden"
              onClick={() => setAddPropertyModalOpen(true)}
            />
            <AddPropertyModal
              isOpen={isAddPropertyModalOpen}
              onClose={() => setAddPropertyModalOpen(false)}
              onSuccess={() => {}}
            />
          </>
        )}

        {canCreateDemand && (
          <>
            <button
              onClick={() => setNewDemandModalOpen(true)}
              className="fixed bottom-[80px] right-[16px] md:bottom-[32px] md:right-[32px] w-[56px] h-[56px] rounded-full bg-[#10B981] hover:bg-[#059669] text-white shadow-[0_4px_12px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.2)] z-[1000] flex items-center justify-center transition-all duration-300 active:scale-95 group"
              aria-label="Registrar novo cliente"
              title="Registrar novo cliente"
            >
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform duration-300" />
            </button>

            <button
              id="btn-add-demand-trigger"
              className="hidden"
              onClick={() => setNewDemandModalOpen(true)}
            />
            <NewDemandModal
              isOpen={isNewDemandModalOpen}
              onClose={() => setNewDemandModalOpen(false)}
            />
          </>
        )}

        <BottomNav />
      </SidebarInset>
    </SidebarProvider>
  )
}
