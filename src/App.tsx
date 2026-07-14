import { useEffect, useRef, lazy, Suspense } from 'react'
import type { ReactNode, FC } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
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
import { supabase } from '@/lib/supabase/client'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import { PageLoader } from '@/components/common/PageLoader'
import { SdrStoreProvider } from '@/hooks/use-sdr-store'
import { useLandlordAuth } from '@/hooks/useLandlordAuth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { useAuth } from '@/hooks/use-auth'

const EsqueciSenha = lazy(() => import('@/pages/EsqueciSenha'))
const RedefinirSenha = lazy(() => import('@/pages/RedefinirSenha'))
const DashboardRedirect = lazy(() => import('@/pages/DashboardRedirect'))
const Demandas = lazy(() => import('@/pages/Demandas'))
const NovaDemanda = lazy(() => import('@/pages/NovaDemanda'))
const Ranking = lazy(() => import('@/pages/Ranking'))
const Perfil = lazy(() => import('@/pages/Perfil'))
const NotFound = lazy(() => import('@/pages/NotFound'))
const Notificacoes = lazy(() => import('@/pages/Notificacoes'))
const Ajuda = lazy(() => import('@/pages/Ajuda'))
const GestorDashboard = lazy(() =>
  import('@/pages/dashboard/GestorDashboard').then((m) => ({ default: m.GestorDashboard })),
)
const AnalyticsDashboard = lazy(() =>
  import('@/pages/analytics/AnalyticsDashboard').then((m) => ({ default: m.AnalyticsDashboard })),
)
const PerformanceDashboard = lazy(() =>
  import('@/pages/analytics/PerformanceDashboard').then((m) => ({
    default: m.PerformanceDashboard,
  })),
)
const Usuarios = lazy(() => import('@/pages/admin/Usuarios').then((m) => ({ default: m.Usuarios })))
const Auditoria = lazy(() =>
  import('@/pages/admin/Auditoria').then((m) => ({ default: m.Auditoria })),
)
const RLSTester = lazy(() => import('@/pages/admin/RLSTester'))
const E2ETester = lazy(() => import('@/pages/admin/E2ETester'))
const PerformanceTester = lazy(() => import('@/pages/admin/PerformanceTester'))
const RealtimeTester = lazy(() => import('@/pages/admin/RealtimeTester'))
const IntegrationTester = lazy(() => import('@/pages/admin/IntegrationTester'))
const ResilienceTester = lazy(() => import('@/pages/admin/ResilienceTester'))
const FunctionalTester = lazy(() => import('@/pages/admin/FunctionalTester'))
const GoLiveTester = lazy(() => import('@/pages/admin/GoLiveTester'))
const HealthCheckTester = lazy(() => import('@/pages/admin/HealthCheckTester'))
const DatabaseReset = lazy(() => import('@/pages/admin/DatabaseReset'))
const AdminProperties = lazy(() => import('@/pages/admin/AdminProperties'))
const PontuacaoPage = lazy(() => import('@/pages/dashboard/PontuacaoPage'))
const HistoricoPage = lazy(() => import('@/pages/dashboard/HistoricoPage'))
const PerdidosPage = lazy(() => import('@/pages/dashboard/PerdidosPage'))
const DisponivelGeralPage = lazy(() => import('@/pages/dashboard/DisponivelGeralPage'))
const TodosCaptadosPage = lazy(() => import('@/pages/dashboard/TodosCaptadosPage'))
const MeusCaptadosPage = lazy(() => import('@/pages/MeusCaptadosPage'))
const MatchInteligentes = lazy(() => import('@/pages/MatchInteligentes'))
const BuscarImoveisPage = lazy(() => import('@/pages/dashboard/BuscarImoveisPage'))
const SDRDashboard = lazy(() =>
  import('@/pages/dashboard/SDRDashboard').then((m) => ({ default: m.SDRDashboard })),
)
const CampanhasPage = lazy(() => import('@/pages/admin/CampanhasPage'))
const CampanhaHistoricoPage = lazy(() => import('@/pages/admin/CampanhaHistoricoPage'))

const LandlordLogin = lazy(() => import('@/pages/auth/LandlordLogin'))
const LandlordSignup = lazy(() => import('@/pages/auth/LandlordSignup'))
const LandlordLayout = lazy(() =>
  import('@/components/landlord/LandlordLayout').then((m) => ({ default: m.LandlordLayout })),
)
const LandlordDashboard = lazy(() => import('@/pages/landlord/LandlordDashboard'))
const LandlordProperties = lazy(() => import('@/pages/landlord/LandlordProperties'))
const LandlordProposals = lazy(() => import('@/pages/landlord/LandlordProposals'))
const LandlordSettings = lazy(() => import('@/pages/landlord/LandlordSettings'))

import { enableDebugLogging } from '@/debug'

enableDebugLogging()

// Global error logging
if (typeof window !== 'undefined') {
  const logErrorToDB = async (message: string, stack?: string) => {
    try {
      await supabase.rpc('fn_logar_falhas_api', {
        p_api: 'frontend',
        p_endpoint: window.location.pathname,
        p_message: message,
        p_payload: { stack },
      })
    } catch (e) {
      console.error('Failed to log error to DB', e)
    }
  }

  window.addEventListener('unhandledrejection', (event) => {
    const msg = event.reason?.message || String(event.reason)
    if (
      !msg.includes('stole it') &&
      !msg.includes('auth-token') &&
      !msg.includes('Failed to fetch')
    ) {
      logErrorToDB(msg, event.reason?.stack)
    }
  })

  window.addEventListener('error', (event) => {
    const msg = event.message || ''
    if (!msg.includes('stole it') && !msg.includes('auth-token')) {
      logErrorToDB(msg, event.error?.stack)
    }
  })
}

const LandlordProtectedRoute: FC<{ children: ReactNode }> = ({ children }) => {
  const { session, loading } = useLandlordAuth()

  if (loading) {
    return <LoadingSpinner />
  }

  if (!session) {
    return <Navigate to="/landlord/login" replace />
  }

  return <>{children}</>
}

const AdminRoute = ({ children }: { children: ReactNode }) => {
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
        reasonStr.includes('auth-token') ||
        reasonMsg.includes('auth-token') ||
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
        event.stopPropagation()
      }
    }

    window.addEventListener('unhandledrejection', handleUnhandledRejection)
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection)
  }, [])

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route
        path="/esqueci-senha"
        element={
          <Suspense fallback={<PageLoader />}>
            <EsqueciSenha />
          </Suspense>
        }
      />
      <Route
        path="/redefinir-senha"
        element={
          <Suspense fallback={<PageLoader />}>
            <RedefinirSenha />
          </Suspense>
        }
      />
      <Route
        path="/diagnostico"
        element={
          <Suspense fallback={<PageLoader />}>
            <HealthCheckTester />
          </Suspense>
        }
      />

      {/* Landlord Auth Routes */}
      <Route
        path="/landlord/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LandlordLogin />
          </Suspense>
        }
      />
      <Route
        path="/landlord/signup"
        element={
          <Suspense fallback={<PageLoader />}>
            <LandlordSignup />
          </Suspense>
        }
      />

      {/* Landlord Protected Routes */}
      <Route
        path="/landlord"
        element={
          <LandlordProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <LandlordLayout />
            </Suspense>
          </LandlordProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/landlord/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <LandlordDashboard />
            </Suspense>
          }
        />
        <Route
          path="properties"
          element={
            <Suspense fallback={<PageLoader />}>
              <LandlordProperties />
            </Suspense>
          }
        />
        <Route
          path="proposals"
          element={
            <Suspense fallback={<PageLoader />}>
              <LandlordProposals />
            </Suspense>
          }
        />
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <LandlordSettings />
            </Suspense>
          }
        />
      </Route>

      {/* Redirects for common root routes to avoid 404s */}
      <Route path="/demandas" element={<Navigate to="/app/demandas" replace />} />
      <Route path="/perfil" element={<Navigate to="/app/perfil" replace />} />
      <Route path="/notificacoes" element={<Navigate to="/app/notificacoes" replace />} />
      <Route path="/ajuda" element={<Navigate to="/app/ajuda" replace />} />
      <Route path="/admin/properties" element={<Navigate to="/app/admin/properties" replace />} />
      <Route path="/buscar-imoveis" element={<Navigate to="/app/buscar-imoveis" replace />} />

      <Route path="/app" element={<Layout />}>
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardRedirect />
            </Suspense>
          }
        />
        <Route path="demandas" element={<Navigate to="/app" replace />} />
        <Route
          path="nova-demanda"
          element={
            <Suspense fallback={<PageLoader />}>
              <NovaDemanda />
            </Suspense>
          }
        />
        <Route
          path="ranking"
          element={
            <Suspense fallback={<PageLoader />}>
              <Ranking />
            </Suspense>
          }
        />
        <Route
          path="perfil"
          element={
            <Suspense fallback={<PageLoader />}>
              <Perfil />
            </Suspense>
          }
        />
        <Route
          path="notificacoes"
          element={
            <Suspense fallback={<PageLoader />}>
              <Notificacoes />
            </Suspense>
          }
        />
        <Route
          path="ajuda"
          element={
            <Suspense fallback={<PageLoader />}>
              <Ajuda />
            </Suspense>
          }
        />
        <Route
          path="gestor-dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <GestorDashboard />
            </Suspense>
          }
        />
        <Route
          path="sdr-corretor/dashboard"
          element={
            <Suspense fallback={<PageLoader />}>
              <SDRDashboard />
            </Suspense>
          }
        />
        <Route
          path="analytics"
          element={
            <Suspense fallback={<PageLoader />}>
              <AnalyticsDashboard />
            </Suspense>
          }
        />
        <Route
          path="performance"
          element={
            <Suspense fallback={<PageLoader />}>
              <PerformanceDashboard />
            </Suspense>
          }
        />
        <Route
          path="usuarios"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Usuarios />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="auditoria"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <Auditoria />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="rls-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <RLSTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="e2e-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <E2ETester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="performance-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <PerformanceTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="realtime-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <RealtimeTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="integration-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <IntegrationTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="resilience-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <ResilienceTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="functional-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <FunctionalTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="go-live-tester"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <GoLiveTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="health-check"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <HealthCheckTester />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="database-reset"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <DatabaseReset />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="admin/properties"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <AdminProperties />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="pontuacao"
          element={
            <Suspense fallback={<PageLoader />}>
              <PontuacaoPage />
            </Suspense>
          }
        />
        <Route
          path="historico"
          element={
            <Suspense fallback={<PageLoader />}>
              <HistoricoPage />
            </Suspense>
          }
        />
        <Route
          path="perdidos"
          element={
            <Suspense fallback={<PageLoader />}>
              <PerdidosPage />
            </Suspense>
          }
        />
        <Route
          path="meus-captados"
          element={
            <Suspense fallback={<PageLoader />}>
              <MeusCaptadosPage />
            </Suspense>
          }
        />
        <Route
          path="disponivel-geral"
          element={
            <Suspense fallback={<PageLoader />}>
              <DisponivelGeralPage />
            </Suspense>
          }
        />
        <Route
          path="todos-captados"
          element={
            <Suspense fallback={<PageLoader />}>
              <TodosCaptadosPage />
            </Suspense>
          }
        />
        <Route
          path="match-inteligentes"
          element={
            <Suspense fallback={<PageLoader />}>
              <MatchInteligentes />
            </Suspense>
          }
        />
        <Route
          path="buscar-imoveis"
          element={
            <Suspense fallback={<PageLoader />}>
              <BuscarImoveisPage />
            </Suspense>
          }
        />
        <Route
          path="campanhas"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <CampanhasPage />
              </Suspense>
            </AdminRoute>
          }
        />
        <Route
          path="campanhas/historico"
          element={
            <AdminRoute>
              <Suspense fallback={<PageLoader />}>
                <CampanhaHistoricoPage />
              </Suspense>
            </AdminRoute>
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <Suspense fallback={<PageLoader />}>
            <NotFound />
          </Suspense>
        }
      />
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
        <SdrStoreProvider>
          <GlobalPontuacaoListener />
          <GlobalNotificationListener />
          <AppContent />
        </SdrStoreProvider>
      </AppStoreProvider>
    </AuthProvider>
  </ErrorBoundary>
)

export default App
