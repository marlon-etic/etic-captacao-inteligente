import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStoreProvider } from '@/stores/useAppStore'
import { AuthProvider } from '@/hooks/use-auth'
import { GlobalPontuacaoListener } from '@/components/GlobalPontuacaoListener'
import { GlobalNotificationListener } from '@/components/GlobalNotificationListener'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { ConnectionStatus } from '@/components/common/ConnectionStatus'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import EsqueciSenha from '@/pages/EsqueciSenha'
import RedefinirSenha from '@/pages/RedefinirSenha'
import DashboardRedirect from '@/pages/DashboardRedirect'
import Demandas from '@/pages/Demandas'
import NovaDemanda from '@/pages/NovaDemanda'
import Ranking from '@/pages/Ranking'
import Perfil from '@/pages/Perfil'
import NotFound from '@/pages/NotFound'
import Notificacoes from '@/pages/Notificacoes'
import Ajuda from '@/pages/Ajuda'
import { GestorDashboard } from '@/pages/dashboard/GestorDashboard'
import { AnalyticsDashboard } from '@/pages/analytics/AnalyticsDashboard'
import { PerformanceDashboard } from '@/pages/analytics/PerformanceDashboard'
import { Usuarios } from '@/pages/admin/Usuarios'
import { Auditoria } from '@/pages/admin/Auditoria'
import RLSTester from '@/pages/admin/RLSTester'
import E2ETester from '@/pages/admin/E2ETester'
import PerformanceTester from '@/pages/admin/PerformanceTester'
import RealtimeTester from '@/pages/admin/RealtimeTester'
import IntegrationTester from '@/pages/admin/IntegrationTester'
import ResilienceTester from '@/pages/admin/ResilienceTester'
import FunctionalTester from '@/pages/admin/FunctionalTester'
import PontuacaoPage from '@/pages/dashboard/PontuacaoPage'
import HistoricoPage from '@/pages/dashboard/HistoricoPage'
import PerdidosPage from '@/pages/dashboard/PerdidosPage'
import DisponivelGeralPage from '@/pages/dashboard/DisponivelGeralPage'
import TodosCaptadosPage from '@/pages/dashboard/TodosCaptadosPage'

// Landlord Panel Imports
import LandlordLogin from '@/pages/auth/LandlordLogin'
import LandlordSignup from '@/pages/auth/LandlordSignup'
import { LandlordLayout } from '@/components/landlord/LandlordLayout'
import LandlordDashboard from '@/pages/landlord/LandlordDashboard'
import LandlordProperties from '@/pages/landlord/LandlordProperties'
import LandlordProposals from '@/pages/landlord/LandlordProposals'
import LandlordSettings from '@/pages/landlord/LandlordSettings'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import React from 'react'

import { enableDebugLogging } from '@/debug'
import { useConnectionHeartbeat } from '@/hooks/useConnectionHeartbeat'

enableDebugLogging()

const LandlordProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useLandlordAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return <Navigate to="/landlord/login" replace />
  }

  return <>{children}</>
}

const AppContent = () => {
  useConnectionHeartbeat()

  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <ConnectionStatus />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

          {/* Landlord Auth Routes */}
          <Route path="/landlord/login" element={<LandlordLogin />} />
          <Route path="/landlord/signup" element={<LandlordSignup />} />

          {/* Landlord Protected Routes */}
          <Route
            path="/landlord"
            element={
              <LandlordProtectedRoute>
                <LandlordLayout />
              </LandlordProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/landlord/dashboard" replace />} />
            <Route path="dashboard" element={<LandlordDashboard />} />
            <Route path="properties" element={<LandlordProperties />} />
            <Route path="proposals" element={<LandlordProposals />} />
            <Route path="settings" element={<LandlordSettings />} />
          </Route>

          {/* Redirects for common root routes to avoid 404s */}
          <Route path="/demandas" element={<Navigate to="/app/demandas" replace />} />
          <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
          <Route path="/notificacoes" element={<Navigate to="/app/notificacoes" replace />} />
          <Route path="/ajuda" element={<Navigate to="/app/ajuda" replace />} />

          <Route path="/app" element={<Layout />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="demandas" element={<Demandas />} />
            <Route path="nova-demanda" element={<NovaDemanda />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="perfil" element={<Perfil />} />
            <Route path="notificacoes" element={<Notificacoes />} />
            <Route path="ajuda" element={<Ajuda />} />
            <Route path="gestor-dashboard" element={<GestorDashboard />} />
            <Route path="analytics" element={<AnalyticsDashboard />} />
            <Route path="performance" element={<PerformanceDashboard />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="auditoria" element={<Auditoria />} />
            <Route path="rls-tester" element={<RLSTester />} />
            <Route path="e2e-tester" element={<E2ETester />} />
            <Route path="performance-tester" element={<PerformanceTester />} />
            <Route path="realtime-tester" element={<RealtimeTester />} />
            <Route path="integration-tester" element={<IntegrationTester />} />
            <Route path="resilience-tester" element={<ResilienceTester />} />
            <Route path="functional-tester" element={<FunctionalTester />} />
            <Route path="pontuacao" element={<PontuacaoPage />} />
            <Route path="historico" element={<HistoricoPage />} />
            <Route path="perdidos" element={<PerdidosPage />} />
            <Route path="disponivel-geral" element={<DisponivelGeralPage />} />
            <Route path="todos-captados" element={<TodosCaptadosPage />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  )
}

const App = () => (
  <ErrorBoundary>
    <AuthProvider>
      <AppStoreProvider>
        <GlobalPontuacaoListener />
        <GlobalNotificationListener />
        <AppContent />
      </AppStoreProvider>
    </AuthProvider>
  </ErrorBoundary>
)

export default App
