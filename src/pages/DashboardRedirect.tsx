import useAppStore from '@/stores/useAppStore'
import { CaptadorDashboard } from './dashboard/CaptadorDashboard'
import { SDRDashboard } from './dashboard/SDRDashboard'
import { GestorDashboard } from './dashboard/GestorDashboard'
import { Navigate } from 'react-router-dom'

export default function DashboardRedirect() {
  const { currentUser } = useAppStore()

  if (!currentUser) return <Navigate to="/" replace />

  switch (currentUser.role) {
    case 'captador':
      return <CaptadorDashboard />
    case 'sdr':
    case 'corretor':
      return <SDRDashboard />
    case 'gestor':
    case 'admin':
      return <GestorDashboard />
    default:
      return <div>Papel não reconhecido</div>
  }
}
