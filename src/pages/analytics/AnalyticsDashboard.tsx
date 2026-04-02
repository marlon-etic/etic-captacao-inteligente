import { useState, useMemo, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import useAppStore from '@/stores/useAppStore'
import { Loader2, AlertTriangle, Inbox, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import { enhanceDemands } from '@/lib/analytics-utils'

import { SummaryCards } from '@/components/analytics/SummaryCards'
import { NeighborhoodsChart } from '@/components/analytics/NeighborhoodsChart'
import { TypologyBarChart } from '@/components/analytics/TypologyBarChart'
import { PriceDonutChart } from '@/components/analytics/PriceDonutChart'
import { ProfileTable } from '@/components/analytics/ProfileTable'
import { RolePerformanceChart } from '@/components/analytics/RolePerformanceChart'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { supabase } from '@/lib/supabase/client'

const FILTERS: FilterDef[] = [
  {
    id: 'tipo',
    label: 'Tipo',
    options: [
      { value: 'Ambos', label: 'Ambos' },
      { value: 'Venda', label: 'Venda', icon: '🏢' },
      { value: 'Aluguel', label: 'Aluguel', icon: '🏠' },
    ],
  },
  {
    id: 'periodo',
    label: 'Período',
    options: [
      { value: 'Todas', label: 'Desde o início', icon: '📅' },
      { value: 'Hoje', label: 'Hoje', icon: '📅' },
      { value: '7 dias', label: 'Últimos 7 dias', icon: '📅' },
      { value: 'Mês Atual', label: 'Mês Atual', icon: '📅' },
    ],
  },
]

export function AnalyticsDashboard() {
  const { currentUser, logAuthEvent, updateDashboardPrefs } = useAppStore()

  const [filters, setFilters] = useViewFilters('analytics_view', {
    tipo: 'Ambos',
    periodo: 'Todas',
  })

  const [realDemands, setRealDemands] = useState<any[]>([])
  const [realImoveis, setRealImoveis] = useState<any[]>([])
  const [usuarios, setUsuarios] = useState<any[]>([])

  const [isLoading, setIsLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState(false)
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string | null>(null)

  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin' && currentUser.role !== 'gestor') {
      logAuthEvent('Acesso não autorizado', 'bloqueado', '/app/analytics')
    }
  }, [currentUser, logAuthEvent])

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [{ data: locacao }, { data: vendas }, { data: imoveis }, { data: users }] =
          await Promise.all([
            supabase.from('demandas_locacao').select('*'),
            supabase.from('demandas_vendas').select('*'),
            supabase.from('imoveis_captados').select('*'),
            supabase.from('users').select('id, nome, role'),
          ])

        const mappedLocacao = (locacao || []).map((d) => ({
          ...d,
          type: 'Aluguel',
          clientName: d.nome_cliente || d.cliente_nome || 'Desconhecido',
          location: d.bairros || d.localizacoes || [],
          budget: d.valor_maximo || d.orcamento_max || 0,
          bedrooms: d.dormitorios || d.quartos || 0,
          parkingSpots: d.vagas_estacionamento || d.vagas || 0,
          status: d.status_demanda || 'aberta',
          description: d.observacoes || '',
          createdAt: d.created_at || new Date().toISOString(),
        }))

        const mappedVendas = (vendas || []).map((d) => ({
          ...d,
          type: 'Venda',
          clientName: d.nome_cliente || d.cliente_nome || 'Desconhecido',
          location: d.bairros || d.localizacoes || [],
          budget: d.valor_maximo || d.orcamento_max || 0,
          bedrooms: d.dormitorios || d.quartos || 0,
          parkingSpots: d.vagas_estacionamento || d.vagas || 0,
          status: d.status_demanda || 'aberta',
          description: d.necessidades_especificas || '',
          createdAt: d.created_at || new Date().toISOString(),
        }))

        setRealDemands([...mappedLocacao, ...mappedVendas])
        setRealImoveis(imoveis || [])
        setUsuarios(users || [])
      } catch (err) {
        console.error(err)
        setError(true)
      } finally {
        setLoadingData(false)
      }
    }

    fetchAnalytics()

    const subLoc = supabase
      .channel('locacao_an_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_locacao' },
        fetchAnalytics,
      )
      .subscribe()
    const subVen = supabase
      .channel('vendas_an_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'demandas_vendas' },
        fetchAnalytics,
      )
      .subscribe()
    const subImov = supabase
      .channel('imoveis_an_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'imoveis_captados' },
        fetchAnalytics,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subLoc)
      supabase.removeChannel(subVen)
      supabase.removeChannel(subImov)
    }
  }, [])

  const enhancedAllDemands = useMemo(() => {
    return enhanceDemands(realDemands)
  }, [realDemands])

  const handleFilterChange = (newF: Record<string, string>) => {
    setIsLoading(true)
    setError(false)
    setFilters(newF)
    setTimeout(() => {
      setSelectedNeighborhood(null)
      setIsLoading(false)
    }, 400)
  }

  const filteredDemands = useMemo(() => {
    return enhancedAllDemands.filter((d) => {
      if (filters.tipo !== 'Ambos' && d.type !== filters.tipo) return false

      const dDate = new Date(d.createdAt).getTime()
      const now = Date.now()

      if (filters.periodo === 'Hoje' && now - dDate > 24 * 3600000) return false
      if (filters.periodo === '7 dias' && now - dDate > 7 * 86400000) return false
      if (filters.periodo === 'Mês Atual') {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
        if (dDate < monthStart) return false
      }
      return true
    })
  }, [enhancedAllDemands, filters])

  const filteredImoveis = useMemo(() => {
    return realImoveis.filter((i) => {
      const dDate = new Date(i.created_at).getTime()
      const now = Date.now()
      if (filters.periodo === 'Hoje' && now - dDate > 24 * 3600000) return false
      if (filters.periodo === '7 dias' && now - dDate > 7 * 86400000) return false
      if (filters.periodo === 'Mês Atual') {
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime()
        if (dDate < monthStart) return false
      }
      if (filters.tipo !== 'Ambos') {
        const type =
          i.tipo || (i.demanda_locacao_id ? 'Aluguel' : i.demanda_venda_id ? 'Venda' : 'Ambos')
        if (type !== 'Ambos' && type !== filters.tipo) return false
      }
      return true
    })
  }, [realImoveis, filters])

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
    return <Navigate to="/app" replace />
  }

  const defaultPrefs = {
    summary: true,
    performance: true,
    neighborhoods: true,
    typology: true,
    price: true,
    profile: true,
  }

  const prefs = { ...defaultPrefs, ...(currentUser?.dashboardPrefs || {}) }

  const handleTogglePref = (key: keyof typeof defaultPrefs, value: boolean) => {
    updateDashboardPrefs({ ...prefs, [key]: value })
  }

  return (
    <div className="flex flex-col space-y-6 pb-12 max-w-[1400px] mx-auto w-full animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#2E5F8A]/20 pb-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-black text-[#1A3A52] leading-tight">
            Analytics Dashboard
          </h1>
          <p className="text-[14px] text-[#999999] font-medium">
            Visualize dados agregados para guiar esforços estratégicos de captação.
          </p>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="font-bold shrink-0">
              <Settings2 className="w-4 h-4 mr-2" /> Configurar Dashboard
            </Button>
          </SheetTrigger>
          <SheetContent>
            <SheetHeader className="mb-6">
              <SheetTitle>Personalizar Dashboard</SheetTitle>
              <SheetDescription>
                Selecione quais gráficos e métricas você deseja visualizar.
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Resumo Geral (Cards)</Label>
                <Switch
                  checked={prefs.summary}
                  onCheckedChange={(v) => handleTogglePref('summary', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Gráfico: Performance por Usuário</Label>
                <Switch
                  checked={prefs.performance}
                  onCheckedChange={(v) => handleTogglePref('performance', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Gráfico: Top Bairros</Label>
                <Switch
                  checked={prefs.neighborhoods}
                  onCheckedChange={(v) => handleTogglePref('neighborhoods', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Gráfico: Tipologia</Label>
                <Switch
                  checked={prefs.typology}
                  onCheckedChange={(v) => handleTogglePref('typology', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Gráfico: Faixa de Valor</Label>
                <Switch
                  checked={prefs.price}
                  onCheckedChange={(v) => handleTogglePref('price', v)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Tabela: Perfil Mais Buscado</Label>
                <Switch
                  checked={prefs.profile}
                  onCheckedChange={(v) => handleTogglePref('profile', v)}
                />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <StickyFilterBar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={filteredDemands.length}
      />

      {error ? (
        <div className="flex flex-col h-[400px] items-center justify-center text-center bg-white rounded-xl border-[2px] border-[#F44336]/20">
          <AlertTriangle className="h-12 w-12 text-[#F44336] mb-4" />
          <h3 className="text-[18px] font-bold text-[#333333]">
            Erro ao carregar analytics. Tente novamente
          </h3>
          <Button className="mt-6" onClick={() => setError(false)}>
            Tentar Novamente
          </Button>
        </div>
      ) : loadingData || isLoading ? (
        <div className="flex flex-col h-[400px] items-center justify-center bg-white rounded-xl border-[2px] border-[#2E5F8A]/10">
          <Loader2 className="h-10 w-10 animate-spin text-[#1A3A52] mb-4" />
          <p className="text-[#999999] font-bold text-[14px] uppercase tracking-wider">
            Processando dados REAIS do sistema...
          </p>
        </div>
      ) : filteredDemands.length === 0 && filteredImoveis.length === 0 ? (
        <div className="flex flex-col h-[400px] items-center justify-center text-center bg-white rounded-xl border-[2px] border-dashed border-[#2E5F8A]/20">
          <div className="w-16 h-16 bg-[#F5F5F5] rounded-full flex items-center justify-center mb-4">
            <Inbox className="h-8 w-8 text-[#999999]" />
          </div>
          <h3 className="text-[18px] font-bold text-[#333333] mb-1">
            Nenhuma demanda ou imóvel neste período
          </h3>
          <p className="text-[14px] text-[#999999]">Altere os filtros para ver resultados reais.</p>
        </div>
      ) : (
        <div className="space-y-6 animate-fade-in">
          {prefs.summary && <SummaryCards demands={filteredDemands} imoveis={filteredImoveis} />}

          {prefs.performance && (
            <RolePerformanceChart
              demandas={filteredDemands}
              imoveis={filteredImoveis}
              usuarios={usuarios}
            />
          )}

          {(prefs.neighborhoods || prefs.typology) && (
            <div
              className={`grid grid-cols-1 ${prefs.neighborhoods && prefs.typology ? 'lg:grid-cols-2' : ''} gap-6`}
            >
              {prefs.neighborhoods && (
                <NeighborhoodsChart
                  demands={filteredDemands}
                  onBarClick={setSelectedNeighborhood}
                  selected={selectedNeighborhood}
                />
              )}
              {prefs.typology && <TypologyBarChart demands={filteredDemands} />}
            </div>
          )}

          {prefs.price && <PriceDonutChart demands={filteredDemands} type={filters.tipo as any} />}

          {prefs.profile && (
            <ProfileTable
              demands={filteredDemands}
              selectedNeighborhood={selectedNeighborhood}
              onClearNeighborhood={() => setSelectedNeighborhood(null)}
            />
          )}
        </div>
      )}
    </div>
  )
}
