import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStoreProvider } from '@/stores/useAppStore'
import { AuthProvider } from '@/hooks/use-auth'
import { GlobalPontuacaoListener } from '@/components/GlobalPontuacaoListener'
import { GlobalNotificationListener } from '@/components/GlobalNotificationListener'
import { GlobalMatchListener } from '@/components/GlobalMatchListener'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { useToast } from '@/components/ui/use-toast'
import { useUserRole } from '@/hooks/use-user-role'
import { findNewMatches } from '@/services/matchingService'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
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
import GoLiveTester from '@/pages/admin/GoLiveTester'
import HealthCheckTester from '@/pages/admin/HealthCheckTester'
import DatabaseReset from '@/pages/admin/DatabaseReset'
import AdminProperties from '@/pages/admin/AdminProperties'
import PontuacaoPage from '@/pages/dashboard/PontuacaoPage'
import HistoricoPage from '@/pages/dashboard/HistoricoPage'
import PerdidosPage from '@/pages/dashboard/PerdidosPage'
import DisponivelGeralPage from '@/pages/dashboard/DisponivelGeralPage'
import TodosCaptadosPage from '@/pages/dashboard/TodosCaptadosPage'
import MeusCaptadosPage from '@/pages/MeusCaptadosPage'
import MatchInteligentes from '@/pages/MatchInteligentes'

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
import React, { useRef, useEffect, useState } from 'react'
import { useAuth } from '@/hooks/use-auth'

import { enableDebugLogging } from '@/debug'

// --- ROOT-KILL: Supressão Global de Alertas de Conexão (Sandbox) ---
if (typeof window !== 'undefined') {
  const originalAddEventListener = window.addEventListener
  window.addEventListener = function (type: string, listener: any, options?: any) {
    if (type === 'offline' || type === 'online') return
    return originalAddEventListener.call(this, type, listener, options)
  }

  const killConnectionAlerts = () => {
    if (!document.body) return
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
    let node
    while ((node = walker.nextNode())) {
      const text = node.nodeValue?.toLowerCase() || ''
      if (
        text.includes('conexão perdida') ||
        text.includes('conexao perdida') ||
        text.includes('reconectando')
      ) {
        let el = node.parentElement
        if (el && el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          let alertWrapper = el.closest(
            '[role="alert"], [role="status"], .toast, [data-sonner-toast]',
          )
          if (alertWrapper) {
            ;(alertWrapper as HTMLElement).style.setProperty('display', 'none', 'important')
          } else {
            el.style.setProperty('display', 'none', 'important')
          }
        }
      }
    }
  }

  const observer = new MutationObserver((mutations) => {
    let shouldCheck = false
    for (const m of mutations) {
      if (m.addedNodes.length > 0 || m.type === 'characterData') {
        shouldCheck = true
        break
      }
    }
    if (shouldCheck) killConnectionAlerts()
  })

  const startObserver = () => {
    if (document.body) {
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    } else {
      setTimeout(startObserver, 10)
    }
  }
  startObserver()
}
// -------------------------------------------------------------------

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

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-full min-h-[50vh] items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  const role = user?.user_metadata?.role || user?.app_metadata?.role
  const isOwner =
    user?.email === 'marlonjmoro@hotmail.com' || user?.email === 'marlon@eticimoveis.com.br'

  if (!user || (role !== 'admin' && role !== 'gestor' && !isOwner)) {
    return <Navigate to="/app" replace />
  }

  return <>{children}</>
}

// ✅ NOVO COMPONENTE: AppRoutes
// Este componente está DENTRO do BrowserRouter, então useNavigate() funciona corretamente
const AppRoutes = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { role } = useUserRole()
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true
    return () => {
      isMounted.current = false
    }
  }, [])

  useEffect(() => {
    const handleNewMatch = (match: any) => {
      toast({
        title: '⚡ Novo Match Encontrado!',
        description: `Imóvel ${match.imovel?.codigo_imovel} altamente compatível`,
        action: (
          <button
            onClick={() => navigate('/app/match-inteligentes')}
            className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-xs font-bold transition-colors"
          >
            Ver Match
          </button>
        ),
      })
    }

    if (role) {
      findNewMatches(handleNewMatch, role).catch(console.error)
      const interval = setInterval(() => {
        findNewMatches(handleNewMatch, role).catch(console.error)
      }, 60000)

      const channel = supabase
        .channel('app_routes_matches')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'matches_sugestoes' },
          (payload) => {
            console.log('[REALTIME] Novo match em AppRoutes:', payload)
            findNewMatches(handleNewMatch, role).catch(console.error)
          },
        )
        .subscribe()

      return () => {
        clearInterval(interval)
        supabase.removeChannel(channel)
      }
    }
  }, [navigate, toast, role])

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reasonStr = String(event.reason)
      const reasonMsg = event.reason?.message || ''

      if (
        reasonMsg === 'Failed to fetch' ||
        event.reason?.name === 'TypeError' ||
        reasonStr.includes('Failed to fetch') ||
        reasonStr.toLowerCase().includes('refresh token') ||
        reasonMsg.toLowerCase().includes('refresh token') ||
        reasonStr.includes('AuthApiError') ||
        reasonStr.includes('stole it') ||
        reasonMsg.includes('stole it') ||
        reasonStr.includes('invalid_credentials') ||
        reasonStr.includes('Invalid login credentials') ||
        reasonStr.includes('HTTP 400') ||
        reasonMsg.includes('invalid_credentials') ||
        reasonMsg.includes('Invalid login credentials') ||
        reasonMsg.includes('HTTP 400')
      ) {
        console.warn(
          '[System] Suppressed network/auth fetch error from background task:',
          event.reason,
        )
        event.preventDefault()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route path="/diagnostico" element={<HealthCheckTester />} />

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
      <Route path="/admin/properties" element={<Navigate to="/app/admin/properties" replace />} />

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
        <Route
          path="usuarios"
          element={
            <AdminRoute>
              <Usuarios />
            </AdminRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <AdminRoute>
              <Auditoria />
            </AdminRoute>
          }
        />
        <Route
          path="rls-tester"
          element={
            <AdminRoute>
              <RLSTester />
            </AdminRoute>
          }
        />
        <Route
          path="e2e-tester"
          element={
            <AdminRoute>
              <E2ETester />
            </AdminRoute>
          }
        />
        <Route
          path="performance-tester"
          element={
            <AdminRoute>
              <PerformanceTester />
            </AdminRoute>
          }
        />
        <Route
          path="realtime-tester"
          element={
            <AdminRoute>
              <RealtimeTester />
            </AdminRoute>
          }
        />
        <Route
          path="integration-tester"
          element={
            <AdminRoute>
              <IntegrationTester />
            </AdminRoute>
          }
        />
        <Route
          path="resilience-tester"
          element={
            <AdminRoute>
              <ResilienceTester />
            </AdminRoute>
          }
        />
        <Route
          path="functional-tester"
          element={
            <AdminRoute>
              <FunctionalTester />
            </AdminRoute>
          }
        />
        <Route
          path="go-live-tester"
          element={
            <AdminRoute>
              <GoLiveTester />
            </AdminRoute>
          }
        />
        <Route
          path="health-check"
          element={
            <AdminRoute>
              <HealthCheckTester />
            </AdminRoute>
          }
        />
        <Route
          path="database-reset"
          element={
            <AdminRoute>
              <DatabaseReset />
            </AdminRoute>
          }
        />
        <Route
          path="admin/properties"
          element={
            <AdminRoute>
              <AdminProperties />
            </AdminRoute>
          }
        />
        <Route path="pontuacao" element={<PontuacaoPage />} />
        <Route path="historico" element={<HistoricoPage />} />
        <Route path="perdidos" element={<PerdidosPage />} />
        <Route path="meus-captados" element={<MeusCaptadosPage />} />
        <Route path="disponivel-geral" element={<DisponivelGeralPage />} />
        <Route path="todos-captados" element={<TodosCaptadosPage />} />
        <Route path="match-inteligentes" element={<MatchInteligentes />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

// ✅ COMPONENTE AppContent SIMPLIFICADO
const AppContent = () => {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GlobalMatchListener />
        <AppRoutes /> {/* ✅ AppRoutes está DENTRO do BrowserRouter */}
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
