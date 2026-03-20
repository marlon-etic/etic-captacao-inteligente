import { useEffect, useState } from 'react'
import { Outlet, Navigate, useLocation } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'
import { useToast } from '@/hooks/use-toast'
import useAppStore from '@/stores/useAppStore'
import { AddPropertyModal } from '@/components/AddPropertyModal'
import { NewDemandModal } from '@/components/NewDemandModal'
import { Plus, UserPlus } from 'lucide-react'
import { Button } from './ui/button'

export default function Layout() {
  const { currentUser, sessionExpiresAt, logout } = useAppStore()
  const location = useLocation()
  const { toast } = useToast()

  const [isAddPropertyModalOpen, setAddPropertyModalOpen] = useState(false)
  const [isNewDemandModalOpen, setNewDemandModalOpen] = useState(false)

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

  useEffect(() => {
    if (currentUser && (currentUser.status === 'bloqueado' || currentUser.status === 'inativo')) {
      toast({
        title: 'Acesso Negado',
        description: 'Sua conta foi bloqueada ou inativada pelo administrador.',
        variant: 'destructive',
      })
      logout()
    }
  }, [currentUser, logout, toast])

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
        <AppHeader
          onAddPropertyClick={() => setAddPropertyModalOpen(true)}
          onAddDemandClick={() => setNewDemandModalOpen(true)}
        />
        <main className="flex-1 overflow-y-auto w-full max-w-[1400px] mx-auto px-[16px] min-[480px]:px-[24px] md:px-[32px] pt-[16px] pb-[100px] md:pb-[32px] animate-fade-in-up">
          <Outlet />
        </main>

        {currentUser?.role === 'captador' && (
          <>
            <button
              onClick={() => setAddPropertyModalOpen(true)}
              className="md:hidden fixed bottom-[76px] right-[16px] w-[56px] h-[56px] bg-[#4CAF50] text-white rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(76,175,80,0.4)] z-[1000] active:scale-95 transition-transform"
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
            />
          </>
        )}

        {canCreateDemand && (
          <>
            {/* Desktop Fixed Button */}
            <Button
              onClick={() => setNewDemandModalOpen(true)}
              className="hidden md:flex fixed bottom-8 right-8 h-14 px-8 rounded-full bg-[#4CAF50] hover:bg-[#388E3C] text-white shadow-[0_4px_12px_rgba(76,175,80,0.4)] z-[1000] text-base font-bold transition-transform hover:scale-105 group"
            >
              <UserPlus className="w-5 h-5 mr-2 transition-transform group-hover:scale-110" />{' '}
              Registrar Novo Cliente
            </Button>

            {/* Mobile Fixed Button */}
            <Button
              onClick={() => setNewDemandModalOpen(true)}
              className="md:hidden fixed bottom-[76px] left-4 right-4 h-14 rounded-xl bg-[#4CAF50] hover:bg-[#388E3C] text-white shadow-[0_4px_12px_rgba(76,175,80,0.4)] z-[1000] text-base font-bold transition-transform active:scale-95 group"
            >
              <UserPlus className="w-5 h-5 mr-2" /> Registrar Novo Cliente
            </Button>

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
