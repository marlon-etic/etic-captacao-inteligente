import { Navigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { SDRDashboard } from './dashboard/SDRDashboard'
import { CorretorDashboard } from './dashboard/CorretorDashboard'
import { CaptadorDashboard } from './dashboard/CaptadorDashboard'

export default function DashboardRedirect() {
  const { currentUser } = useAppStore()

  if (!currentUser) return <Navigate to="/" replace />

  if (currentUser.role === 'gestor' || currentUser.role === 'admin') {
    return <Navigate to="/app/gestor-dashboard" replace />
  }

  if (currentUser.role === 'corretor') return <CorretorDashboard />
  if (currentUser.role === 'captador') return <CaptadorDashboard />

  return <SDRDashboard />
}
