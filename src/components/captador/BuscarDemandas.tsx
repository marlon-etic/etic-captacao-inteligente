import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, Loader2, Home, Building, Clock, CheckCircle2, User } from 'lucide-react'
import { DemandDetailModal } from '@/components/DemandDetailModal'

interface Demand {
  id: string
  nome_cliente: string
  tipo: 'locacao' | 'venda'
  valor_minimo: number
  valor_maximo: number
  bairros: string[]
  created_at: string
  imoveiVinculados: number
  criador_nome: string
  criador_id: string
  urgencia: string
  status: string
  raw_demand: any
}

export function BuscarDemandas() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [filterType, setFilterType] = useState<string>('todos')
  const [filterUrgency, setFilterUrgency] = useState<string>('todos')
  const [filterBairro, setFilterBairro] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals
  const [selectedDemandDetail, setSelectedDemandDetail] = useState<Demand | null>(null)
  const [selectedDemandLink, setSelectedDemandLink] = useState<Demand | null>(null)

  useEffect(() => {
    loadDemands()
  }, [])

  useEffect(() => {
    let filtered = demands

    if (filterType !== 'todos') {
      filtered = filtered.filter((d) => d.tipo === filterType)
    }

    if (filterUrgency !== 'todos') {
      if (filterUrgency === 'Urgente') {
        filtered = filtered.filter((d) => d.urgencia === 'Urgente' || d.urgencia === 'Crítica')
      } else if (filterUrgency === 'Normal') {
        filtered = filtered.filter((d) => d.urgencia === 'Normal' || d.urgencia === 'Baixa')
      } else {
        filtered = filtered.filter((d) => d.urgencia === filterUrgency)
      }
    }

    if (filterBairro) {
      filtered = filtered.filter((d) =>
        (d.bairros || []).some((b) => b.toLowerCase().includes(filterBairro.toLowerCase())),
      )
    }

    if (searchQuery) {
      filtered = filtered.filter((d) =>
        (d.nome_cliente || '').toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDemands(filtered)
  }, [demands, filterType, filterUrgency, filterBairro, searchQuery])

  const loadDemands = async () => {
    try {
      setLoading(true)
      setError(null)

      const [resLoc, resVen] = await Promise.all([
        supabase
          .from('demandas_locacao')
          .select(`
            *,
            imoveis_captados(*),
            sdr:users!demandas_locacao_sdr_id_fkey(nome)
          `)
          .in('status_demanda', ['aberta', 'prioritaria', 'sem_resposta_24h', 'Pausada']),
        supabase
          .from('demandas_vendas')
          .select(`
            *,
            imoveis_captados(*),
            corretor:users!demandas_vendas_corretor_id_fkey(nome)
          `)
          .in('status_demanda', ['aberta', 'prioritaria', 'sem_resposta_24h', 'Pausada']),
      ])

      if (resLoc.error) throw resLoc.error
      if (resVen.error) throw resVen.error

      const formattedLoc: Demand[] = (resLoc.data || []).map((d: any) => ({
        id: d.id,
        nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
        tipo: 'locacao' as const,
        valor_minimo: d.valor_minimo || 0,
        valor_maximo: d.valor_maximo || d.orcamento_max || 0,
        bairros: d.bairros || d.localizacoes || [],
        urgencia: d.nivel_urgencia || d.urgencia || 'Normal',
        status: d.status_demanda || 'aberta',
        created_at: d.created_at || new Date().toISOString(),
        imoveiVinculados: d.imoveis_captados?.length || 0,
        criador_nome: d.sdr?.nome || 'SDR',
        criador_id: d.sdr_id,
        raw_demand: { ...d, tipo: 'Aluguel' },
      }))

      const formattedVen: Demand[] = (resVen.data || []).map((d: any) => ({
        id: d.id,
        nome_cliente: d.nome_cliente || d.cliente_nome || 'Cliente',
        tipo: 'venda' as const,
        valor_minimo: d.valor_minimo || 0,
        valor_maximo: d.valor_maximo || d.orcamento_max || 0,
        bairros: d.bairros || d.localizacoes || [],
        urgencia: d.nivel_urgencia || d.urgencia || 'Normal',
        status: d.status_demanda || 'aberta',
        created_at: d.created_at || new Date().toISOString(),
        imoveiVinculados: d.imoveis_captados?.length || 0,
        criador_nome: d.corretor?.nome || 'Corretor',
        criador_id: d.corretor_id,
        raw_demand: { ...d, tipo: 'Venda' },
      }))

      const allDemands = [...formattedLoc, ...formattedVen].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )

      setDemands(allDemands)
    } catch (err: any) {
      console.error('[BuscarDemandas] Erro:', err)
      setError('Erro ao carregar demandas')
    } finally {
      setLoading(false)
    }
  }

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Urgente':
      case 'Crítica':
      case 'Alta':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Média':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      {/* HEADER E FILTROS */}
      <div className="bg-white border border-gray-200 shadow-sm rounded-xl p-5 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2 text-lg">
          <Search className="w-5 h-5 text-blue-600" /> Explorar Oportunidades
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar por cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todos os tipos</option>
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="todos">Todas urgências</option>
            <option value="Normal">Normal / Baixa</option>
            <option value="Média">Média</option>
            <option value="Urgente">Alta / Urgente</option>
          </select>

          <input
            type="text"
            placeholder="Filtrar por bairro..."
            value={filterBairro}
            onChange={(e) => setFilterBairro(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider flex justify-between items-center">
          <span>{filteredDemands.length} demanda(s) encontrada(s)</span>
        </div>
      </div>

      {/* LISTA */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500 bg-white border border-gray-200 rounded-xl">
          <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
          <p className="font-medium">Carregando oportunidades...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center">
          <p className="font-bold">{error}</p>
          <Button
            onClick={loadDemands}
            variant="outline"
            className="mt-4 border-red-200 text-red-700 hover:bg-red-100"
          >
            Tentar Novamente
          </Button>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Nenhuma demanda atende aos critérios.</p>
          <Button
            onClick={() => {
              setSearchQuery('')
              setFilterType('todos')
              setFilterUrgency('todos')
              setFilterBairro('')
            }}
            variant="link"
            className="mt-2 text-blue-600"
          >
            Limpar filtros
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredDemands.map((demand) => (
            <div
              key={demand.id}
              className={`bg-white border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                demand.imoveiVinculados > 0
                  ? 'border-emerald-200'
                  : 'border-red-200 hover:border-red-300'
              }`}
            >
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex-1 min-w-0 w-full">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <h4
                      className="font-black text-lg text-gray-900 truncate max-w-full"
                      title={demand.nome_cliente}
                    >
                      {demand.nome_cliente}
                    </h4>
                    <Badge
                      className={
                        demand.tipo === 'locacao'
                          ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                          : 'bg-purple-100 text-purple-800 hover:bg-purple-100'
                      }
                    >
                      {demand.tipo === 'locacao' ? (
                        <Home className="w-3 h-3 mr-1" />
                      ) : (
                        <Building className="w-3 h-3 mr-1" />
                      )}
                      {demand.tipo === 'locacao' ? 'Locação' : 'Venda'}
                    </Badge>
                    <Badge
                      variant="outline"
                      className={`font-bold ${getUrgencyColor(demand.urgencia)}`}
                    >
                      {demand.urgencia}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-gray-100 p-1.5 rounded-md text-gray-500">
                        <MapPin className="w-4 h-4" />
                      </span>
                      <span
                        className="font-medium text-gray-700 truncate"
                        title={(demand.bairros || []).join(', ')}
                      >
                        {(demand.bairros || []).join(', ') || 'Indiferente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-emerald-50 p-1.5 rounded-md text-emerald-600 font-black">
                        R$
                      </span>
                      <span className="font-bold text-emerald-700 truncate">
                        {demand.valor_minimo > 0
                          ? `${demand.valor_minimo.toLocaleString('pt-BR')} - `
                          : ''}
                        {demand.valor_maximo.toLocaleString('pt-BR')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="bg-gray-100 p-1.5 rounded-md text-gray-500">
                        <User className="w-4 h-4" />
                      </span>
                      <span className="text-gray-600 text-xs leading-tight">
                        Por <strong className="text-gray-800">{demand.criador_nome}</strong>
                        <br />
                        {new Date(demand.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center md:flex-col gap-4 w-full md:w-auto shrink-0 md:pl-4 md:border-l border-gray-100">
                  <div className="text-center bg-gray-50 p-3 rounded-lg min-w-[100px] border border-gray-100">
                    <div
                      className={`text-2xl font-black ${
                        demand.imoveiVinculados > 0 ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {demand.imoveiVinculados}
                    </div>
                    <p className="text-[10px] font-bold text-gray-500 uppercase">Imóveis Vinc.</p>
                  </div>

                  <div className="flex flex-col gap-2 flex-1 md:w-full">
                    <Button
                      className="w-full bg-blue-600 hover:bg-blue-700 font-bold shadow-md shadow-blue-500/20"
                      onClick={() => setSelectedDemandLink(demand)}
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Vincular Imóvel
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full font-bold border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => setSelectedDemandDetail(demand)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDemandDetail && (
        <DemandDetailModal
          demand={selectedDemandDetail.raw_demand}
          isOpen={true}
          onClose={() => setSelectedDemandDetail(null)}
        />
      )}

      {selectedDemandLink && (
        <VincularImovelModal
          isOpen={true}
          onClose={() => setSelectedDemandLink(null)}
          demand={selectedDemandLink}
          onSuccess={loadDemands}
        />
      )}
    </div>
  )
}

function VincularImovelModal({
  isOpen,
  onClose,
  demand,
  onSuccess,
}: {
  isOpen: boolean
  onClose: () => void
  demand: Demand
  onSuccess: () => void
}) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [imoveis, setImoveis] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [linking, setLinking] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && user) {
      loadImoveis()
    }
  }, [isOpen, user])

  const loadImoveis = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('imoveis_captados')
        .select(
          'id, codigo_imovel, endereco, preco, valor, tipo_imovel, demanda_locacao_id, demanda_venda_id, fotos',
        )
        .eq('user_captador_id', user?.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Filtrar imóveis que já não estejam vinculados a essa demanda específica
      const available = (data || []).filter((i) => {
        if (demand.tipo === 'locacao') return i.demanda_locacao_id !== demand.id
        return i.demanda_venda_id !== demand.id
      })

      setImoveis(available)
    } catch (err) {
      console.error('Erro ao carregar imóveis:', err)
      toast({ title: 'Erro ao carregar seus imóveis', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async (imovelId: string) => {
    try {
      setLinking(imovelId)
      const isLocacao = demand.tipo === 'locacao'
      const updateData = isLocacao
        ? { demanda_locacao_id: demand.id }
        : { demanda_venda_id: demand.id }

      const { error } = await supabase
        .from('imoveis_captados')
        .update(updateData)
        .eq('id', imovelId)

      if (error) throw error

      toast({
        title: '✓ Imóvel vinculado com sucesso!',
        className: 'bg-emerald-500 text-white border-none font-bold',
      })
      onSuccess()
      onClose()
    } catch (err: any) {
      console.error(err)
      toast({ title: 'Erro ao vincular', description: err.message, variant: 'destructive' })
    } finally {
      setLinking(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col bg-white overflow-hidden p-0 rounded-2xl">
        <DialogHeader className="p-6 border-b border-gray-100 bg-gray-50/50">
          <DialogTitle className="text-xl font-black text-gray-900">
            Vincular Imóvel à Demanda
          </DialogTitle>
          <p className="text-sm text-gray-500 mt-1">
            Selecione um dos seus imóveis captados para atender ao cliente{' '}
            <strong className="text-blue-600">{demand.nome_cliente}</strong>.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-500 font-medium">Buscando seus imóveis...</p>
            </div>
          ) : imoveis.length === 0 ? (
            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 rounded-xl">
              <Building className="w-12 h-12 mx-auto text-gray-300 mb-3" />
              <p className="font-medium text-gray-700">Nenhum imóvel disponível</p>
              <p className="text-sm mt-1">
                Você não tem imóveis captados que possam ser vinculados a esta demanda.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {imoveis.map((imovel) => (
                <div
                  key={imovel.id}
                  className="bg-white border border-gray-200 hover:border-blue-300 rounded-xl p-4 flex items-center justify-between gap-4 transition-all hover:shadow-sm group"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center border border-gray-200">
                      {imovel.fotos?.[0] ? (
                        <img
                          src={imovel.fotos[0]}
                          alt="Imóvel"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Home className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 truncate" title={imovel.endereco}>
                        {imovel.endereco || 'Endereço não informado'}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-sm text-gray-600">
                        <Badge
                          variant="secondary"
                          className="text-[10px] bg-gray-100 font-bold tracking-wider"
                        >
                          {imovel.codigo_imovel}
                        </Badge>
                        <span className="font-black text-emerald-600">
                          R$ {(imovel.preco || imovel.valor || 0).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleLink(imovel.id)}
                    disabled={linking === imovel.id}
                    className="shrink-0 bg-[#1A3A52] hover:bg-[#2E5F8A] font-bold"
                  >
                    {linking === imovel.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Vincular'
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
