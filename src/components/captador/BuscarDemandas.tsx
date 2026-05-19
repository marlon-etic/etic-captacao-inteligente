import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { ModalDetalhes } from './ModalDetalhes'
import { ModalVinculador } from './ModalVinculador'

export interface Demand {
  id: string
  nome_cliente: string
  telefone?: string
  email?: string
  tipo: 'locacao' | 'venda'
  valor_minimo: number
  valor_maximo: number
  bairros: string[]
  dormitorios?: number
  banheiros?: number
  vagas?: number
  urgencia: string
  status: string
  created_at: string
  imoveiVinculados: number
  criador_nome: string
  criador_id: string
}

export function BuscarDemandas() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterType, setFilterType] = useState<'todos' | 'locacao' | 'venda'>('todos')
  const [filterUrgency, setFilterUrgency] = useState<'todos' | 'Normal' | 'Alta' | 'Crítica'>(
    'todos',
  )
  const [filterBairro, setFilterBairro] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [selectedDetalhes, setSelectedDetalhes] = useState<Demand | null>(null)
  const [selectedVinculador, setSelectedVinculador] = useState<Demand | null>(null)

  const loadDemands = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: demandsLoc, error: errLoc } = await supabase
        .from('demandas_locacao')
        .select(`
          id, nome_cliente, telefone, email, sdr_id, created_at, valor_minimo, valor_maximo, bairros, dormitorios, banheiros, vagas_estacionamento, urgencia, status_demanda,
          criador:users!fk_demandas_locacao_sdr(nome, email),
          imoveis_captados!imoveis_captados_demanda_locacao_id_fkey(id)
        `)
        .in('status_demanda', ['aberta', 'em busca'])
        .order('created_at', { ascending: false })

      if (errLoc) throw errLoc

      const { data: demandsVen, error: errVen } = await supabase
        .from('demandas_vendas')
        .select(`
          id, nome_cliente, telefone, email, corretor_id, created_at, valor_minimo, valor_maximo, bairros, dormitorios, banheiros, vagas_estacionamento, urgencia, status_demanda,
          criador:users!demandas_vendas_corretor_id_fkey(nome, email),
          imoveis_captados!imoveis_captados_demanda_venda_id_fkey(id)
        `)
        .in('status_demanda', ['aberta', 'em busca'])
        .order('created_at', { ascending: false })

      if (errVen) throw errVen

      const enriched: Demand[] = []

      for (const demand of demandsLoc || []) {
        enriched.push({
          id: demand.id,
          nome_cliente: demand.nome_cliente || 'Cliente não identificado',
          telefone: demand.telefone || '',
          email: demand.email || '',
          tipo: 'locacao',
          valor_minimo: demand.valor_minimo || 0,
          valor_maximo: demand.valor_maximo || 0,
          bairros: demand.bairros || [],
          dormitorios: demand.dormitorios || 0,
          banheiros: demand.banheiros || 0,
          vagas: demand.vagas_estacionamento || 0,
          urgencia: demand.urgencia || 'Normal',
          status: demand.status_demanda || 'aberta',
          created_at: demand.created_at || new Date().toISOString(),
          imoveiVinculados: Array.isArray(demand.imoveis_captados)
            ? demand.imoveis_captados.length
            : 0,
          criador_nome:
            (demand.criador as any)?.nome || (demand.criador as any)?.email || 'Desconhecido',
          criador_id: demand.sdr_id || '',
        })
      }

      for (const demand of demandsVen || []) {
        enriched.push({
          id: demand.id,
          nome_cliente: demand.nome_cliente || 'Cliente não identificado',
          telefone: demand.telefone || '',
          email: demand.email || '',
          tipo: 'venda',
          valor_minimo: demand.valor_minimo || 0,
          valor_maximo: demand.valor_maximo || 0,
          bairros: demand.bairros || [],
          dormitorios: demand.dormitorios || 0,
          banheiros: demand.banheiros || 0,
          vagas: demand.vagas_estacionamento || 0,
          urgencia: demand.urgencia || 'Normal',
          status: demand.status_demanda || 'aberta',
          created_at: demand.created_at || new Date().toISOString(),
          imoveiVinculados: Array.isArray(demand.imoveis_captados)
            ? demand.imoveis_captados.length
            : 0,
          criador_nome:
            (demand.criador as any)?.nome || (demand.criador as any)?.email || 'Desconhecido',
          criador_id: demand.corretor_id || '',
        })
      }

      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setDemands(enriched)
    } catch (err) {
      console.error('[BuscarDemandas] ❌ Erro:', err)
      setError('Erro ao carregar demandas. Verifique a conexão ou tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDemands()
  }, [loadDemands])

  // Realtime subscription para atualizar contadores
  useEffect(() => {
    const channel = supabase
      .channel('public:imoveis_captados')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imoveis_captados' }, () => {
        console.log(
          '[REALTIME] Imóvel atualizado, recarregando demandas para atualizar contadores...',
        )
        loadDemands()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadDemands])

  useEffect(() => {
    let filtered = demands

    if (filterType !== 'todos') {
      filtered = filtered.filter((d) => d.tipo === filterType)
    }

    if (filterUrgency !== 'todos') {
      filtered = filtered.filter(
        (d) =>
          d.urgencia === filterUrgency || (filterUrgency === 'Crítica' && d.urgencia === 'Urgente'),
      )
    }

    if (filterBairro) {
      filtered = filtered.filter((d) =>
        d.bairros.some((b) => b.toLowerCase().includes(filterBairro.toLowerCase())),
      )
    }

    if (searchQuery) {
      filtered = filtered.filter((d) =>
        d.nome_cliente.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    setFilteredDemands(filtered)
  }, [demands, filterType, filterUrgency, filterBairro, searchQuery])

  const getUrgencyColor = (urgencia: string) => {
    switch (urgencia) {
      case 'Crítica':
      case 'Urgente':
        return 'bg-red-100 text-red-800 border-red-300'
      case 'Alta':
        return 'bg-orange-100 text-orange-800 border-orange-300'
      default:
        return 'bg-green-100 text-green-800 border-green-300'
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border rounded-xl p-5 space-y-4 shadow-[0_2px_8px_rgba(26,58,82,0.05)] border-[#E5E5E5]">
        <h3 className="font-bold text-[#1A3A52] flex items-center gap-2 text-[18px]">
          <span>🔍</span> Filtros de Busca
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#E5E5E5] rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#2E5F8A] focus:ring-1 focus:ring-[#2E5F8A] w-full"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="border border-[#E5E5E5] rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#2E5F8A] focus:ring-1 focus:ring-[#2E5F8A] w-full bg-white"
          >
            <option value="todos">Todos os tipos</option>
            <option value="locacao">Locação</option>
            <option value="venda">Venda</option>
          </select>

          <select
            value={filterUrgency}
            onChange={(e) => setFilterUrgency(e.target.value as any)}
            className="border border-[#E5E5E5] rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#2E5F8A] focus:ring-1 focus:ring-[#2E5F8A] w-full bg-white"
          >
            <option value="todos">Todas urgências</option>
            <option value="Normal">Normal</option>
            <option value="Alta">Alta</option>
            <option value="Crítica">Crítica / Urgente</option>
          </select>

          <input
            type="text"
            placeholder="Filtrar por bairro..."
            value={filterBairro}
            onChange={(e) => setFilterBairro(e.target.value)}
            className="border border-[#E5E5E5] rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#2E5F8A] focus:ring-1 focus:ring-[#2E5F8A] w-full"
          />
        </div>

        <div className="text-[13px] font-medium text-[#666666]">
          {filteredDemands.length} demanda(s) encontrada(s)
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E5E5E5] flex flex-col items-center">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-[#2E5F8A] border-t-transparent rounded-full mb-4"></div>
          <p className="text-[15px] font-medium text-[#333333]">Buscando oportunidades...</p>
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500 bg-red-50 rounded-xl border border-red-200">
          <p className="font-bold text-[15px]">{error}</p>
          <Button
            onClick={loadDemands}
            variant="outline"
            className="mt-4 border-red-200 hover:bg-red-100"
          >
            Tentar novamente
          </Button>
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E5E5E5] flex flex-col items-center">
          <span className="text-5xl mb-4 opacity-70">🔍</span>
          <p className="font-bold text-[16px] text-[#333333]">Nenhuma demanda encontrada</p>
          <p className="text-[14px] text-[#999999] mt-1">
            Tente ajustar seus filtros para encontrar mais resultados.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDemands.map((demand) => (
            <div
              key={demand.id}
              className={`border-2 rounded-xl p-5 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col h-full bg-white hover:shadow-md hover:-translate-y-1 duration-200 ${
                demand.imoveiVinculados > 0 ? 'border-green-100/80' : 'border-orange-100/80'
              }`}
            >
              <div className="flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <h4
                    className="font-black text-[#1A3A52] text-[17px] truncate flex-1"
                    title={demand.nome_cliente}
                  >
                    {demand.nome_cliente}
                  </h4>
                </div>

                <div className="flex gap-2 mb-4 flex-wrap">
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-[#F5F5F5] border border-[#E5E5E5] text-[#333333] rounded-md">
                    {demand.tipo === 'locacao' ? '🏠 Locação' : '🏢 Venda'}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getUrgencyColor(demand.urgencia)}`}
                  >
                    ⚡ {demand.urgencia}
                  </span>
                  <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-[#E5E5E5] text-[#666666] rounded-md uppercase">
                    {demand.status}
                  </span>
                </div>

                <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E5E5E5] mb-5 space-y-2.5 text-sm flex-1">
                  <div className="flex items-start gap-2.5">
                    <span className="text-[#999999] text-[15px] mt-0.5">💰</span>
                    <span className="font-bold text-[#333333]">
                      R$ {demand.valor_minimo.toLocaleString('pt-BR')}{' '}
                      <span className="text-[#999999] font-normal mx-1">até</span> R${' '}
                      {demand.valor_maximo.toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="text-[#999999] text-[15px] mt-0.5">📍</span>
                    <span className="text-[#333333] font-medium leading-tight">
                      {demand.bairros.length > 0 ? demand.bairros.join(', ') : 'Qualquer bairro'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#E5E5E5]">
                  <div className="text-[12px] text-[#666666] space-y-0.5">
                    <div>
                      De: <strong className="text-[#333333]">{demand.criador_nome}</strong>
                    </div>
                    <div>
                      Em:{' '}
                      <span className="font-medium">
                        {new Date(demand.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`text-center px-3 py-1.5 rounded-lg ${demand.imoveiVinculados > 0 ? 'bg-green-50' : 'bg-orange-50'}`}
                  >
                    <div
                      className={`text-[20px] font-black leading-none ${demand.imoveiVinculados > 0 ? 'text-green-600' : 'text-orange-500'}`}
                    >
                      {demand.imoveiVinculados}
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#666666] mt-1">
                      Imóveis
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <Button
                  onClick={() => setSelectedVinculador(demand)}
                  className="w-full text-[13px] h-[38px] font-bold bg-[#2E5F8A] hover:bg-[#1A3A52] text-white shadow-sm transition-colors"
                >
                  Vincular Imóvel
                </Button>
                <Button
                  onClick={() => setSelectedDetalhes(demand)}
                  variant="outline"
                  className="w-full text-[13px] h-[38px] font-bold border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5] shadow-sm transition-colors"
                >
                  Ver Detalhes
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals rendering */}
      {selectedDetalhes && (
        <ModalDetalhes demanda={selectedDetalhes} onClose={() => setSelectedDetalhes(null)} />
      )}

      {selectedVinculador && (
        <ModalVinculador
          demanda={selectedVinculador}
          onClose={() => setSelectedVinculador(null)}
          onVinculoSucesso={() => {
            setSelectedVinculador(null)
            loadDemands()
          }}
        />
      )}
    </div>
  )
}
