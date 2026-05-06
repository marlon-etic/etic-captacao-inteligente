import { useEffect } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { Loader2 } from 'lucide-react'
import { GestorDashboard } from '@/pages/dashboard/GestorDashboard'
import { CaptadorDashboard } from '@/pages/dashboard/CaptadorDashboard'

export default function DashboardRedirect() {
  const navigate = useNavigate()
  const { currentUser, isRestoringUser } = useAppStore()

  useEffect(() => {
    if (!isRestoringUser && !currentUser) {
      navigate('/', { replace: true })
    }
  }, [currentUser, isRestoringUser, navigate])

  if (isRestoringUser) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-[#999999]">
          <Loader2 className="h-8 w-8 animate-spin text-[#1A3A52]" />
          <p className="font-medium">Carregando painel...</p>
        </div>
      </div>
    )
  }

  if (!currentUser) return null

  switch (currentUser.role) {
    case 'sdr':
    case 'corretor':
      return <Navigate to="/app/sdr-corretor/dashboard" replace />
    case 'gestor':
    case 'admin':
      return <GestorDashboard />
    case 'captador':
      return <CaptadorDashboard />
    default:
      return <Navigate to="/app/demandas" replace />
  }
}
