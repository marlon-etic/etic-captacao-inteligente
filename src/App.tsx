import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AppStoreProvider } from '@/stores/useAppStore'
import Layout from '@/components/Layout'
import Index from '@/pages/Index'
import DashboardRedirect from '@/pages/DashboardRedirect'
import Demandas from '@/pages/Demandas'
import NovaDemanda from '@/pages/NovaDemanda'
import Ranking from '@/pages/Ranking'
import Perfil from '@/pages/Perfil'
import NotFound from '@/pages/NotFound'

const App = () => (
  <AppStoreProvider>
    <BrowserRouter future={{ v7_startTransition: false, v7_relativeSplatPath: false }}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/app" element={<Layout />}>
            <Route index element={<DashboardRedirect />} />
            <Route path="demandas" element={<Demandas />} />
            <Route path="nova-demanda" element={<NovaDemanda />} />
            <Route path="ranking" element={<Ranking />} />
            <Route path="perfil" element={<Perfil />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </BrowserRouter>
  </AppStoreProvider>
)

export default App
