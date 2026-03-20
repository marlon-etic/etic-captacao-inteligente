import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStoreProvider } from '@/stores/useAppStore'
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
import PontuacaoPage from '@/pages/dashboard/PontuacaoPage'
import HistoricoPage from '@/pages/dashboard/HistoricoPage'
import PerdidosPage from '@/pages/dashboard/PerdidosPage'
import DisponivelGeralPage from '@/pages/dashboard/DisponivelGeralPage'
import TodosCaptadosPage from '@/pages/dashboard/TodosCaptadosPage'

const App = () => (
  <AppStoreProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />

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
  </AppStoreProvider>
)

export default App
