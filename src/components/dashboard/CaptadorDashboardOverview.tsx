import { useState, useMemo } from 'react'
import { useAuth } from '@/hooks/use-auth'
import useAppStore from '@/stores/useAppStore'
import { useAllDemands } from '@/hooks/use-all-demands'
import { useSupabaseProperties } from '@/hooks/use-supabase-properties'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Home, Target, XCircle, Award, TrendingUp, Search, Building, MapPin } from 'lucide-react'
import { ChartLegend, ChartLegendContent } from '@/components/ui/chart'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { differenceInDays } from 'date-fns'
import { Demand } from '@/types'
import { PropertyDetailsModal } from '@/components/PropertyDetailsModal'

export function CaptadorDashboardOverview({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const navigate = useNavigate()
  const { currentUser } = useAppStore()
  const { demands } = useAllDemands()
  const { properties } = useSupabaseProperties()

  const myProperties = useMemo(
    () => properties.filter((p) => p.user_captador_id === currentUser?.id),
    [properties, currentUser],
  )
  const activeDemands = useMemo(
    () =>
      demands.filter(
        (d) =>
          d.status_demanda === 'aberta' ||
          d.status_demanda === 'prioritaria' ||
          d.status_demanda === 'sem_resposta_24h',
      ),
    [demands],
  )
  const lostProperties = useMemo(
    () =>
      myProperties.filter((p) => p.status_captacao === 'perdido' || p.etapa_funil === 'perdido'),
    [myProperties],
  )

  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)
  const props7d = myProperties.filter((p) => new Date(p.created_at) >= last7Days).length

  const visitados = myProperties.filter(
    (p) => p.etapa_funil === 'visitado' || p.etapa_funil === 'fechado',
  ).length
  const totalCaptados = myProperties.length || 1
  const successRate = Math.round((visitados / totalCaptados) * 100)

  const chartByTipo = useMemo(() => {
    const counts: Record<string, number> = {}
    activeDemands.forEach((d) => {
      const t = d.tipo_imovel || 'Outro'
      counts[t] = (counts[t] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, qtd]) => ({ name, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 5)
  }, [activeDemands])

  const chartByBairro = useMemo(() => {
    const counts: Record<string, number> = {}
    activeDemands.forEach((d) => {
      const bArr = d.bairros || []
      bArr.forEach((b: string) => {
        counts[b] = (counts[b] || 0) + 1
      })
    })
    return Object.entries(counts)
      .map(([name, qtd]) => ({ name, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 10)
  }, [activeDemands])

  const chartVendaLocacao = useMemo(() => {
    const loc = activeDemands.filter((d) => d.tipo === 'Aluguel' || d.tipo === 'Locação').length
    const ven = activeDemands.filter((d) => d.tipo === 'Venda').length
    return [
      { name: 'Locação', value: loc, fill: '#0070f3' },
      { name: 'Venda', value: ven, fill: '#10b981' },
    ]
  }, [activeDemands])

  const [selectedProperty, setSelectedProperty] = useState<any>(null)

  const handleChartClick = () => {
    onTabChange('demandas-abertas')
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* SEÇÃO 1: MÉTRICAS */}
      <section>
        <h2 className="text-xl font-black text-[#1A3A52] mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-blue-600" /> Seu Desempenho Esta Semana
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-blue-600"
            onClick={() => onTabChange('meus-captados')}
          >
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-blue-100 p-3 rounded-xl text-blue-600">
                  <Home className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Imóveis Captados</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-gray-800">{props7d}</span>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  7 dias
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-emerald-500"
            onClick={() => onTabChange('demandas-abertas')}
          >
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600">
                  <Target className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Demandas Abertas</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-gray-800">{activeDemands.length}</span>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Ativas
                </span>
              </div>
            </CardContent>
          </Card>

          <Card
            className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-red-500"
            onClick={() => onTabChange('perdidos')}
          >
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-red-100 p-3 rounded-xl text-red-600">
                  <XCircle className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Imóveis Perdidos</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-gray-800">{lostProperties.length}</span>
                <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                  Total
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4 border-l-purple-500">
            <CardContent className="p-6 flex flex-col justify-center">
              <div className="flex justify-between items-start mb-2">
                <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
                  <Award className="w-6 h-6" />
                </div>
              </div>
              <p className="text-sm font-bold text-gray-500 uppercase">Taxa de Sucesso</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-4xl font-black text-gray-800">{successRate}%</span>
                <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Visitas/Captações
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SEÇÃO 5: GRÁFICOS */}
      <section>
        <h2 className="text-xl font-black text-[#1A3A52] mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-indigo-600" /> Maiores Demandas (Direcione sua Busca)
        </h2>
        <Card>
          <CardContent className="p-2 sm:p-6 pt-6">
            <Tabs defaultValue="tipo" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
                <TabsTrigger
                  value="tipo"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold"
                >
                  Por Tipo
                </TabsTrigger>
                <TabsTrigger
                  value="bairro"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold"
                >
                  Por Bairro
                </TabsTrigger>
                <TabsTrigger
                  value="venda_locacao"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold"
                >
                  Venda x Locação
                </TabsTrigger>
              </TabsList>

              <TabsContent value="tipo" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartByTipo}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="qtd"
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                      onClick={() => handleChartClick()}
                    >
                      {chartByTipo.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#059669' : '#34d399'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent value="bairro" className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartByBairro}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                    <XAxis type="number" axisLine={false} tickLine={false} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={120}
                      tick={{ fontSize: 12 }}
                    />
                    <Tooltip
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <Bar
                      dataKey="qtd"
                      fill="#3b82f6"
                      radius={[0, 4, 4, 0]}
                      onClick={() => handleChartClick()}
                    >
                      {chartByBairro.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#2563eb' : '#60a5fa'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>

              <TabsContent
                value="venda_locacao"
                className="h-[300px] flex items-center justify-center"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartVendaLocacao}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      onClick={() => handleChartClick()}
                    >
                      {chartVendaLocacao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                    />
                    <ChartLegend content={<ChartLegendContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </section>

      {/* SEÇÃO 3: DEMANDAS ABERTAS */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-[#1A3A52] flex items-center gap-2">
            <Search className="w-6 h-6 text-emerald-600" /> Demandas Abertas (Foco Rápido)
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTabChange('demandas-abertas')}
            className="font-bold hidden sm:flex"
          >
            Ver Todas
          </Button>
        </div>

        {activeDemands.length === 0 ? (
          <Card className="bg-emerald-50 border-emerald-200 border-dashed">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-emerald-800">
                ✅ Sem demandas! Você está em dia!
              </h3>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-bold">Cliente / Tipo</th>
                    <th className="px-4 py-3 font-bold">Localização</th>
                    <th className="px-4 py-3 font-bold">Budget</th>
                    <th className="px-4 py-3 font-bold text-center">Tempo Aberto</th>
                    <th className="px-4 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDemands.slice(0, 5).map((demand) => {
                    const daysOpen = differenceInDays(new Date(), new Date(demand.created_at))
                    return (
                      <tr
                        key={demand.id}
                        className="border-b border-gray-100 hover:bg-blue-50 transition-colors group cursor-pointer"
                        onClick={() => {
                          navigate(`/app/demandas?id=${demand.id}`)
                        }}
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">
                            {demand.nome_cliente || demand.clientName || 'Cliente'}
                          </div>
                          <div className="flex items-center mt-1">
                            <Badge
                              variant="outline"
                              className={
                                demand.tipo === 'Aluguel' || demand.tipo === 'Locação'
                                  ? 'bg-blue-50 text-blue-700'
                                  : 'bg-emerald-50 text-emerald-700'
                              }
                            >
                              {demand.tipo}
                            </Badge>
                            <span className="text-xs text-gray-500 ml-2">
                              {demand.tipo_imovel || 'Outro'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 max-w-[200px] truncate">
                          <div className="flex gap-1 flex-wrap">
                            {(demand.bairros || demand.location || [])
                              .slice(0, 2)
                              .map((b: string, i: number) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md truncate max-w-[120px]"
                                >
                                  {b}
                                </span>
                              ))}
                            {(demand.bairros || demand.location || []).length > 2 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-md">
                                +{demand.bairros.length - 2}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 font-semibold text-gray-700">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(demand.valor_maximo || demand.maxBudget || 0)}
                        </td>
                        <td className="px-4 py-4 text-center">
                          <Badge
                            className={`
                            ${
                              daysOpen < 2
                                ? 'bg-emerald-100 text-emerald-800'
                                : daysOpen <= 4
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800 font-bold'
                            }
                          `}
                          >
                            {daysOpen === 0 ? 'Hoje' : `${daysOpen} dia${daysOpen > 1 ? 's' : ''}`}
                            {daysOpen > 5 && ' URGENTE'}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            size="sm"
                            className="bg-[#1A3A52] hover:bg-[#2E5F8A] text-white font-bold"
                            onClick={(e) => {
                              e.stopPropagation()
                              navigate(
                                `/app/disponivel-geral?tipo=${demand.tipo}&bairro=${demand.bairros?.[0] || ''}`,
                              )
                            }}
                          >
                            Buscar Imóvel
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {activeDemands.length > 5 && (
              <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                <Button
                  variant="link"
                  onClick={() => onTabChange('demandas-abertas')}
                  className="font-bold text-[#1A3A52]"
                >
                  Ver mais {activeDemands.length - 5} demandas abertas
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEÇÃO 2: IMÓVEIS CADASTRADOS */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-[#1A3A52] flex items-center gap-2">
            <Building className="w-6 h-6 text-blue-600" /> Últimos Imóveis Cadastrados
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTabChange('meus-captados')}
            className="font-bold hidden sm:flex"
          >
            Ver Todos
          </Button>
        </div>

        {myProperties.length === 0 ? (
          <Card className="bg-gray-50 border-gray-200 border-dashed">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <Building className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-bold text-gray-700">Nenhum imóvel captado</h3>
              <p className="text-gray-500 mt-1 mb-4">
                Você ainda não registrou captações no sistema.
              </p>
              <Button onClick={() => navigate('/app/disponivel-geral')} className="font-bold">
                Buscar Imóveis Disponíveis
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myProperties.slice(0, 3).map((prop) => (
              <Card
                key={prop.id}
                className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer overflow-hidden group"
                onClick={() => setSelectedProperty(prop)}
              >
                <div className="h-32 bg-gray-200 relative overflow-hidden">
                  {prop.fotos && prop.fotos.length > 0 ? (
                    <img
                      src={prop.fotos[0]}
                      alt="Imóvel"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                      <Home className="w-10 h-10 text-blue-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Badge
                      className={
                        prop.status_captacao === 'disponivel'
                          ? 'bg-emerald-500'
                          : prop.etapa_funil === 'visitado'
                            ? 'bg-amber-500'
                            : prop.etapa_funil === 'fechado'
                              ? 'bg-purple-600'
                              : 'bg-gray-500'
                      }
                    >
                      {prop.etapa_funil === 'fechado'
                        ? 'Vendido/Alugado'
                        : prop.etapa_funil === 'visitado'
                          ? 'Em Visita'
                          : 'Disponível'}
                    </Badge>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="font-black text-lg text-gray-900 mb-1 truncate">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      maximumFractionDigits: 0,
                    }).format(prop.preco || prop.valor || 0)}
                  </div>
                  <p className="text-sm font-bold text-gray-600 truncate flex items-center gap-1 mb-2">
                    <MapPin className="w-3.5 h-3.5" /> {prop.endereco || 'Endereço não informado'}
                  </p>
                  <div className="flex gap-2 text-xs text-gray-500 font-medium">
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {prop.tipo_imovel || 'Outro'}
                    </span>
                    {(prop.dormitorios || 0) > 0 && (
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {prop.dormitorios} Dorms
                      </span>
                    )}
                    {(prop.vagas || 0) > 0 && (
                      <span className="bg-gray-100 px-2 py-1 rounded">{prop.vagas} Vagas</span>
                    )}
                  </div>
                  {prop.demanda && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] w-full justify-center"
                      >
                        ✅ Sob Demanda: {prop.demanda.clientName}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SEÇÃO 4: IMÓVEIS PERDIDOS */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-black text-[#1A3A52] flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" /> Imóveis Perdidos (Acompanhar)
          </h2>
        </div>

        {lostProperties.length === 0 ? (
          <Card className="bg-blue-50 border-blue-200 border-dashed">
            <CardContent className="p-8 text-center flex flex-col items-center">
              <h3 className="text-lg font-bold text-blue-800">🎉 Nenhum imóvel perdido!</h3>
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3 font-bold">Endereço / Imóvel</th>
                    <th className="px-4 py-3 font-bold">Demanda Relacionada</th>
                    <th className="px-4 py-3 font-bold">Data Perda</th>
                    <th className="px-4 py-3 font-bold text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lostProperties.slice(0, 5).map((prop) => {
                    return (
                      <tr
                        key={prop.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-4">
                          <div className="font-bold text-gray-900">{prop.codigo_imovel}</div>
                          <div className="text-xs text-gray-500">{prop.endereco}</div>
                        </td>
                        <td className="px-4 py-4 text-gray-700 font-medium">
                          {prop.demanda ? prop.demanda.clientName : 'Nenhuma'}
                        </td>
                        <td className="px-4 py-4 text-gray-500 font-medium">
                          {new Date(prop.updated_at || prop.created_at).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-300 font-bold"
                            onClick={() => setSelectedProperty(prop)}
                          >
                            Reanalisar
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {lostProperties.length > 5 && (
              <div className="p-3 text-center border-t border-gray-100 bg-gray-50">
                <Button
                  variant="link"
                  onClick={() => onTabChange('perdidos')}
                  className="font-bold text-[#1A3A52]"
                >
                  Ver todos os {lostProperties.length} imóveis perdidos
                </Button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* SEÇÃO 6: AÇÕES RÁPIDAS (RODAPÉ) */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-gray-200">
        <Button
          size="lg"
          className="h-16 text-lg font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200"
          onClick={() => navigate('/app/disponivel-geral')}
        >
          🎯 Começar Busca Agora
        </Button>
        <Button
          size="lg"
          className="h-16 text-lg font-black bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-200"
          onClick={() => navigate('/app/ranking')}
        >
          📊 Ver Meu Ranking
        </Button>
        <Button
          size="lg"
          variant="outline"
          className="h-16 text-lg font-black border-gray-300 text-gray-700 hover:bg-gray-50"
          onClick={() => navigate('/app/ajuda')}
        >
          📞 Suporte GoSkip
        </Button>
      </section>

      {selectedProperty && (
        <PropertyDetailsModal
          property={{
            id: selectedProperty.id,
            codigo_imovel: selectedProperty.codigo_imovel,
            endereco: selectedProperty.endereco,
            preco: selectedProperty.preco,
            valor: selectedProperty.valor,
            tipo: selectedProperty.tipo,
            dormitorios: selectedProperty.dormitorios,
            vagas: selectedProperty.vagas,
            captador_nome: selectedProperty.captador_nome,
            created_at: selectedProperty.created_at,
            observacoes: selectedProperty.observacoes,
            demanda: selectedProperty.demanda,
          }}
          onClose={() => setSelectedProperty(null)}
        />
      )}
    </div>
  )
}
