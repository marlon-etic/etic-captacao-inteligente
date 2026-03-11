import { Navigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { SDRDashboard } from './dashboard/SDRDashboard'
import { CorretorDashboard } from './dashboard/CorretorDashboard'

export default function DashboardRedirect() {
  const { currentUser } = useAppStore()

  if (!currentUser) return <Navigate to="/" replace />

  if (currentUser.role === 'corretor') return <CorretorDashboard />

  // Default to SDRDashboard for other roles (SDR, etc.)
  // If there are specific dashboards for other roles, they should be routed here.
  return <SDRDashboard />
}
