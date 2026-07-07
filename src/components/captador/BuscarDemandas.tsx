import React, { useState, useEffect, useCallback, Suspense, lazy } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { PrioritizeModal } from '@/components/PrioritizeModal'
import { toggleDemandPriority } from '@/services/priority-service'

const ModalDetalhes = lazy(() =>
  import('./ModalDetalhes').then((m) => ({ default: m.ModalDetalhes })),
)
const ModalVinculador = lazy(() =>
  import('./ModalVinculador').then((m) => ({ default: m.ModalVinculador })),
)
import { ModalSugerirLinks } from './ModalSugerirLinks'
import useAppStore from '@/stores/useAppStore'
import { useTimeElapsed } from '@/hooks/use-time-elapsed'
import { useToast } from '@/hooks/use-toast'

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
  imoveis: { id: string; codigo_imovel: string; captador_id: string; user_captador_id: string }[]
  captadores_busca: any[]
  links_sugeridos?: string[]
  is_prioritaria?: boolean
  motivo_priorizacao?: string
  criador_nome: string
  criador_id: string
}

const DemandCard = React.memo(function DemandCard({
  demand,
  onVerDetalhes,
  onVincular,
  onDarPerdido,
  currentUser,
  onReload,
  onSugerirLinks,
  onTogglePriority,
}: {
  demand: Demand
  onVerDetalhes: () => void
  onVincular: () => void
  onDarPerdido: () => void
  currentUser: any
  onReload: () => void
  onSugerirLinks: () => void
  onTogglePriority: () => void
}) {
  const canPrioritizeDemand =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'gestor' ||
    (demand.criador_id === currentUser?.id &&
      (currentUser?.role === 'sdr' || currentUser?.role === 'corretor'))
  const timeInfo = useTimeElapsed(demand.created_at)
  const { toast } = useToast()

  const isMine = (imovel: any) =>
    imovel.captador_id === currentUser?.id || imovel.user_captador_id === currentUser?.id
  const isBuscando = demand.captadores_busca?.some((c: any) => c.captador_id === currentUser?.id)

  const handleBuscando = async () => {
    try {
      console.log(`[NOTIFICACAO] Atualizando status para Estou Buscando na demanda ${demand.id}`)
      await supabase.rpc('append_captador_busca', {
        p_demanda_id: demand.id,
        p_tipo_demanda: demand.tipo === 'locacao' ? 'Aluguel' : 'Venda',
        p_captador_id: currentUser?.id,
        p_nome: currentUser?.name || currentUser?.nome || 'Captador',
        p_regiao: demand.bairros[0] || 'Geral',
      })

      const updateData = { status_demanda: 'em busca' }
      if (demand.tipo === 'locacao') {
        await supabase.from('demandas_locacao').update(updateData).eq('id', demand.id)
      } else {
        await supabase.from('demandas_vendas').update(updateData).eq('id', demand.id)
      }

      toast({
        title: 'Status Atualizado',
        description: 'O criador da demanda foi notificado que você está buscando.',
        className: 'bg-[#10B981] text-white border-none',
      })
      onReload()
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' })
    }
  }

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
    <div
      id={`demand-card-${demand.id}`}
      className={`border-2 rounded-xl p-5 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col h-full bg-white hover:shadow-md hover:-translate-y-1 duration-200 ${demand.imoveiVinculados > 0 ? 'border-green-100/80' : 'border-blue-100/50'}`}
    >
      <div className="flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3 gap-2">
          <h4
            className="font-black text-[#1A3A52] text-[17px] truncate"
            title={demand.nome_cliente}
          >
            {demand.nome_cliente}
          </h4>
          <span className="text-[10px] font-bold text-gray-500 whitespace-nowrap bg-gray-100 px-2 py-1 rounded-md shrink-0 flex items-center gap-1">
            ⏱️ {timeInfo.text}
          </span>
        </div>

        <div className="flex gap-2 mb-4 flex-wrap">
          <span className="text-[11px] font-bold px-2.5 py-1 bg-[#F5F5F5] border border-[#E5E5E5] text-[#333333] rounded-md">
            {demand.tipo === 'locacao' ? '🏠 Locação' : '🏢 Venda'}
          </span>
          {demand.is_prioritaria && (
            <span className="text-[11px] font-bold px-2.5 py-1 bg-[#F44336] text-white rounded-md shadow-sm uppercase tracking-wider">
              🔴 PRIORITÁRIA
            </span>
          )}
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-md border ${getUrgencyColor(demand.urgencia)}`}
          >
            ⚡ {demand.urgencia}
          </span>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-white border border-[#E5E5E5] text-[#666666] rounded-md uppercase">
            {demand.status}
          </span>
        </div>

        <div className="bg-[#F8F9FA] p-3.5 rounded-lg border border-[#E5E5E5] mb-2 space-y-2.5 text-sm flex-1">
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

        {demand.imoveis && demand.imoveis.length > 0 && (
          <div className="mt-2 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
            <div className="text-[10px] font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Imóveis Vinculados:
            </div>
            <div className="flex flex-wrap gap-1.5">
              {demand.imoveis.map((imv) => {
                const mine = isMine(imv)
                return (
                  <span
                    key={imv.id}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold border ${mine ? 'bg-blue-100 text-blue-800 border-blue-300' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {imv.codigo_imovel || 'S/C'} {mine && '(Seu)'}
                  </span>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#E5E5E5]">
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
            className={`text-center px-3 py-1.5 rounded-lg ${demand.imoveiVinculados > 0 ? 'bg-green-50' : 'bg-gray-50'}`}
          >
            <div
              className={`text-[18px] font-black leading-none ${demand.imoveiVinculados > 0 ? 'text-green-600' : 'text-gray-500'}`}
            >
              {demand.imoveiVinculados}
            </div>
            <div className="text-[9px] font-bold uppercase tracking-wider text-[#666666] mt-1">
              Imóveis
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <Button
          onClick={onVincular}
          className="w-full text-[12px] h-9 font-bold bg-[#2E5F8A] hover:bg-[#1A3A52] text-white shadow-sm"
        >
          Vincular Imóvel
        </Button>
        <Button
          onClick={onVerDetalhes}
          variant="outline"
          className="w-full text-[12px] h-9 font-bold border-[#E5E5E5] text-[#333333] hover:bg-[#F5F5F5] shadow-sm"
        >
          Ver Detalhes
        </Button>
        {currentUser?.role === 'sdr' || currentUser?.role === 'corretor' ? (
          <Button
            onClick={(e) => {
              e.stopPropagation()
              onSugerirLinks()
            }}
            variant="outline"
            className="w-full text-[12px] h-9 font-bold border-blue-200 text-blue-700 hover:bg-blue-50 shadow-sm"
          >
            🔗 Sugerir Links de Captação
          </Button>
        ) : (
          <Button
            onClick={handleBuscando}
            disabled={isBuscando}
            variant={isBuscando ? 'secondary' : 'outline'}
            className={`w-full text-[12px] h-9 font-bold shadow-sm ${isBuscando ? 'bg-blue-50 text-blue-700 opacity-80' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
          >
            {isBuscando ? '✅ Buscando' : '🔍 Estou Buscando'}
          </Button>
        )}
        {canPrioritizeDemand && (
          <Button
            onClick={onTogglePriority}
            variant="outline"
            className={`w-full text-[12px] h-9 font-bold shadow-sm ${demand.is_prioritaria ? 'border-[#F44336] text-[#F44336] hover:bg-red-50' : 'border-[#F59E0B] text-[#B45309] hover:bg-amber-50'}`}
          >
            {demand.is_prioritaria ? '⭐ Despriorizar' : '⭐ Priorizar'}
          </Button>
        )}
        <Button
          onClick={onDarPerdido}
          variant="outline"
          className="w-full text-[12px] h-9 font-bold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-sm"
        >
          ❌ Dar Perdido
        </Button>
      </div>
    </div>
  )
})

function ModalDarPerdido({
  demanda,
  onClose,
  onConfirm,
}: {
  demanda: Demand
  onClose: () => void
  onConfirm: (motivo: string) => Promise<void>
}) {
  const [motivo, setMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!motivo.trim()) return
    setIsSubmitting(true)
    await onConfirm(motivo)
    setIsSubmitting(false)
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-md flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-red-50">
          <h3 className="text-lg font-bold text-red-900 flex items-center gap-2">
            ❌ Dar Perdido na Demanda
          </h3>
        </div>
        <div className="p-5 space-y-4">
          <p className="text-sm text-gray-700">
            Informe ao dono do card (<strong>{demanda.criador_nome}</strong>) o motivo de não
            conseguir atender este cliente. Ele receberá uma notificação.
          </p>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Motivo da desistência
            </label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500"
              placeholder="Ex: Não encontrei imóvel no perfil, imóveis da região não aceitam pets, etc."
            />
          </div>
        </div>
        <div className="p-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!motivo.trim() || isSubmitting}
            className="bg-red-600 hover:bg-red-700 text-white font-bold"
          >
            {isSubmitting ? 'Enviando...' : 'Confirmar Perdido'}
          </Button>
        </div>
      </div>
    </div>
  )
}

const DemandCardWrapper = React.memo(function DemandCardWrapper({
  demand,
  setSelectedDetalhes,
  setSelectedVinculador,
  setSelectedPerdido,
  setSelectedSugerirLinks,
  setSelectedPrioritize,
  onDeprioritize,
  currentUser,
  onReload,
}: any) {
  const handleVerDetalhes = useCallback(
    () => setSelectedDetalhes(demand),
    [demand, setSelectedDetalhes],
  )
  const handleVincular = useCallback(
    () => setSelectedVinculador(demand),
    [demand, setSelectedVinculador],
  )
  const handleDarPerdido = useCallback(
    () => setSelectedPerdido(demand),
    [demand, setSelectedPerdido],
  )
  const handleSugerirLinks = useCallback(
    () => setSelectedSugerirLinks(demand),
    [demand, setSelectedSugerirLinks],
  )
  const handleTogglePriority = useCallback(() => {
    if (demand.is_prioritaria) {
      onDeprioritize(demand)
    } else {
      setSelectedPrioritize(demand)
    }
  }, [demand, setSelectedPrioritize, onDeprioritize])

  return (
    <DemandCard
      demand={demand}
      onVerDetalhes={handleVerDetalhes}
      onVincular={handleVincular}
      onDarPerdido={handleDarPerdido}
      onSugerirLinks={handleSugerirLinks}
      onTogglePriority={handleTogglePriority}
      currentUser={currentUser}
      onReload={onReload}
    />
  )
})

export function BuscarDemandas() {
  const [demands, setDemands] = useState<Demand[]>([])
  const [filteredDemands, setFilteredDemands] = useState<Demand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filterStatusDemanda, setFilterStatusDemanda] = useState<'ativas' | 'inativas' | 'todas'>(
    'ativas',
  )
  const [filterType, setFilterType] = useState<'todos' | 'locacao' | 'venda'>('todos')
  const [filterUrgency, setFilterUrgency] = useState<'todos' | 'Normal' | 'Alta' | 'Crítica'>(
    'todos',
  )
  const [filterBairro, setFilterBairro] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  const [selectedDetalhes, setSelectedDetalhes] = useState<Demand | null>(null)
  const [selectedVinculador, setSelectedVinculador] = useState<Demand | null>(null)
  const [selectedPerdido, setSelectedPerdido] = useState<Demand | null>(null)
  const [selectedSugerirLinks, setSelectedSugerirLinks] = useState<Demand | null>(null)
  const [selectedPrioritize, setSelectedPrioritize] = useState<Demand | null>(null)
  const [isPrioritizing, setIsPrioritizing] = useState(false)

  const { currentUser } = useAppStore()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const loadDemands = useCallback(async (useCache = true) => {
    try {
      if (useCache) {
        const cached = sessionStorage.getItem('buscar_demandas_cache')
        if (cached) {
          setDemands(JSON.parse(cached))
          setLoading(false)
        } else {
          setLoading(true)
        }
      } else {
        setLoading(true)
      }
      setError(null)

      const { data: demandsLoc, error: errLoc } = await supabase
        .from('demandas_locacao')
        .select(`
          id, nome_cliente, telefone, email, sdr_id, created_at, valor_minimo, valor_maximo, bairros, dormitorios, banheiros, vagas_estacionamento, urgencia, status_demanda, captadores_busca, links_sugeridos, is_prioritaria, motivo_priorizacao,
          criador:users!fk_demandas_locacao_sdr(nome, email),
          imoveis_captados!imoveis_captados_demanda_locacao_id_fkey(id, codigo_imovel, user_captador_id, captador_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (errLoc) throw errLoc

      const { data: demandsVen, error: errVen } = await supabase
        .from('demandas_vendas')
        .select(`
          id, nome_cliente, telefone, email, corretor_id, created_at, valor_minimo, valor_maximo, bairros, dormitorios, banheiros, vagas_estacionamento, urgencia, status_demanda, captadores_busca, links_sugeridos, is_prioritaria, motivo_priorizacao,
          criador:users!demandas_vendas_corretor_id_fkey(nome, email),
          imoveis_captados!imoveis_captados_demanda_venda_id_fkey(id, codigo_imovel, user_captador_id, captador_id)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (errVen) throw errVen

      const enriched: Demand[] = []

      for (const demand of demandsLoc || []) {
        const imoveis = Array.isArray(demand.imoveis_captados) ? demand.imoveis_captados : []
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
          imoveiVinculados: imoveis.length,
          imoveis: imoveis as any,
          captadores_busca: demand.captadores_busca || [],
          links_sugeridos: demand.links_sugeridos || [],
          is_prioritaria: demand.is_prioritaria || false,
          motivo_priorizacao: demand.motivo_priorizacao || null,
          criador_nome:
            (demand.criador as any)?.nome || (demand.criador as any)?.email || 'Desconhecido',
          criador_id: demand.sdr_id || '',
        })
      }

      for (const demand of demandsVen || []) {
        const imoveis = Array.isArray(demand.imoveis_captados) ? demand.imoveis_captados : []
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
          imoveiVinculados: imoveis.length,
          imoveis: imoveis as any,
          captadores_busca: demand.captadores_busca || [],
          links_sugeridos: demand.links_sugeridos || [],
          is_prioritaria: demand.is_prioritaria || false,
          motivo_priorizacao: demand.motivo_priorizacao || null,
          criador_nome:
            (demand.criador as any)?.nome || (demand.criador as any)?.email || 'Desconhecido',
          criador_id: demand.corretor_id || '',
        })
      }

      enriched.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      const filteredEnriched = enriched.filter(
        (d) => d.status !== 'Perdida' && d.status !== 'PERDIDA_BAIXA',
      )

      setDemands(filteredEnriched)
      sessionStorage.setItem('buscar_demandas_cache', JSON.stringify(filteredEnriched))
    } catch (err) {
      console.error('[BuscarDemandas] ❌ Erro:', err)
      setError('Erro ao carregar demandas. Verifique a conexão ou tente novamente.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDemands(true)
  }, [loadDemands])

  // Realtime subscription para atualizar contadores e status
  useEffect(() => {
    const channel1 = supabase
      .channel('public:imoveis_captados_bd')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'imoveis_captados' }, () => {
        loadDemands(false)
      })
      .subscribe()

    const channel2 = supabase
      .channel('public:demandas_bd')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_locacao' }, () => {
        loadDemands(false)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_vendas' }, () => {
        loadDemands(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel1)
      supabase.removeChannel(channel2)
    }
  }, [loadDemands])

  // Lidar com o click na notificação (redirect para o card)
  useEffect(() => {
    const id = searchParams.get('demanda_id') || searchParams.get('id')
    if (!id || loading) return

    const openAndScroll = (demand: Demand) => {
      // 1. Limpar filtros para garantir que a demanda seja visível
      setFilterStatusDemanda('todas')
      setFilterType('todos')
      setFilterUrgency('todos')
      setSearchQuery('')
      setFilterBairro('')

      // 2. Abrir Modal de Detalhes
      if (!selectedDetalhes || selectedDetalhes.id !== demand.id) {
        setSelectedDetalhes(demand)
      }

      // 3. Limpar param da URL
      const newParams = new URLSearchParams(searchParams)
      newParams.delete('id')
      newParams.delete('demanda_id')
      setSearchParams(newParams, { replace: true })

      // 4. Scroll para o card
      setTimeout(() => {
        const el = document.getElementById(`demand-card-${demand.id}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
          el.classList.add(
            'ring-4',
            'ring-blue-500',
            'bg-blue-50',
            'transition-all',
            'duration-500',
          )
          setTimeout(() => {
            el.classList.remove('ring-4', 'ring-blue-500', 'bg-blue-50')
          }, 4000)
        }
      }, 500)
    }

    const targetDemand = demands.find((d) => d.id === id)
    if (targetDemand) {
      openAndScroll(targetDemand)
    } else {
      // Buscar do banco caso não esteja na listagem inicial (paginação/limite)
      const fetchMissingDemand = async () => {
        try {
          const { data: locData } = await supabase
            .from('demandas_locacao')
            .select(`
              id, nome_cliente, telefone, email, sdr_id, created_at, valor_minimo, valor_maximo, bairros, dormitorios, banheiros, vagas_estacionamento, urgencia, status_demanda, captadores_busca, links_sugeridos,
              criador:users!fk_demandas_locacao_sdr(nome, email),
              imoveis_captados!imoveis_captados_demanda_locacao_id_fkey(id, codigo_imovel, user_captador_id, captador_id)
            `)
            .eq('id', id)
            .single()

          if (locData) {
            const imoveis = Array.isArray(locData.imoveis_captados) ? locData.imoveis_captados : []
            const newDemand: Demand = {
              id: locData.id,
              nome_cliente: locData.nome_cliente || 'Cliente',
              telefone: locData.telefone || '',
              email: locData.email || '',
              tipo: 'locacao',
              valor_minimo: locData.valor_minimo || 0,
              valor_maximo: locData.valor_maximo || 0,
              bairros: locData.bairros || [],
              dormitorios: locData.dormitorios || 0,
              banheiros: locData.banheiros || 0,
              vagas: locData.vagas_estacionamento || 0,
              urgencia: locData.urgencia || 'Normal',
              status: locData.status_demanda || 'aberta',
              created_at: locData.created_at || new Date().toISOString(),
              imoveiVinculados: imoveis.length,
              imoveis: imoveis as any,
              captadores_busca: locData.captadores_busca || [],
              links_sugeridos: locData.links_sugeridos || [],
              criador_nome:
                (locData.criador as any)?.nome || (locData.criador as any)?.email || 'Desconhecido',
              criador_id: locData.sdr_id || '',
            }
            setDemands((prev) => [newDemand, ...prev])
            openAndScroll(newDemand)
            return
          }

          const { data: venData } = await supabase
            .from('demandas_vendas')
            .select(`
              id, nome_cliente, telefone, email, corretor_id, created_at, valor_minimo, valor_maximo, bairros, dormitorios, banheiros, vagas_estacionamento, urgencia, status_demanda, captadores_busca, links_sugeridos,
              criador:users!demandas_vendas_corretor_id_fkey(nome, email),
              imoveis_captados!imoveis_captados_demanda_venda_id_fkey(id, codigo_imovel, user_captador_id, captador_id)
            `)
            .eq('id', id)
            .single()

          if (venData) {
            const imoveis = Array.isArray(venData.imoveis_captados) ? venData.imoveis_captados : []
            const newDemand: Demand = {
              id: venData.id,
              nome_cliente: venData.nome_cliente || 'Cliente',
              telefone: venData.telefone || '',
              email: venData.email || '',
              tipo: 'venda',
              valor_minimo: venData.valor_minimo || 0,
              valor_maximo: venData.valor_maximo || 0,
              bairros: venData.bairros || [],
              dormitorios: venData.dormitorios || 0,
              banheiros: venData.banheiros || 0,
              vagas: venData.vagas_estacionamento || 0,
              urgencia: venData.urgencia || 'Normal',
              status: venData.status_demanda || 'aberta',
              created_at: venData.created_at || new Date().toISOString(),
              imoveiVinculados: imoveis.length,
              imoveis: imoveis as any,
              captadores_busca: venData.captadores_busca || [],
              links_sugeridos: venData.links_sugeridos || [],
              criador_nome:
                (venData.criador as any)?.nome || (venData.criador as any)?.email || 'Desconhecido',
              criador_id: venData.corretor_id || '',
            }
            setDemands((prev) => [newDemand, ...prev])
            openAndScroll(newDemand)
          }
        } catch (e) {
          console.error('[BuscarDemandas] Erro ao buscar demanda via param id:', e)
        }
      }
      fetchMissingDemand()
    }
  }, [searchParams, demands, loading, selectedDetalhes, setSearchParams])

  useEffect(() => {
    let filtered = demands

    filtered = filtered.filter((d) => {
      const isActiveStatus = ['aberta', 'atendida', 'em busca', 'sem_resposta_24h'].includes(
        d.status,
      )

      const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
      const isRecent = Date.now() - new Date(d.created_at).getTime() <= THIRTY_DAYS_MS
      const isEmBusca = d.status === 'em busca'
      const hasInteraction = d.captadores_busca?.length > 0 || d.imoveiVinculados > 0
      const hasEngagement = isEmBusca || hasInteraction

      const isActiveAndValid = isActiveStatus && (isRecent || hasEngagement)

      if (filterStatusDemanda === 'ativas') {
        return isActiveAndValid
      } else if (filterStatusDemanda === 'inativas') {
        return !isActiveAndValid
      }
      return true // todas
    })

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
  }, [demands, filterStatusDemanda, filterType, filterUrgency, filterBairro, searchQuery])

  const handleDarPerdidoConfirm = async (motivo: string) => {
    if (!selectedPerdido || !currentUser) return
    try {
      console.log(`[NOTIFICACAO] Atualizando status para Perdido na demanda ${selectedPerdido.id}`)
      const { error } = await supabase.from('respostas_captador').insert({
        captador_id: currentUser.id,
        resposta: 'nao_encontrei',
        motivo: motivo,
        demanda_locacao_id: selectedPerdido.tipo === 'locacao' ? selectedPerdido.id : null,
        demanda_venda_id: selectedPerdido.tipo === 'venda' ? selectedPerdido.id : null,
      })
      if (error) throw error
      toast({
        title: 'Perdido Registrado',
        description: 'O dono da demanda foi notificado com sucesso.',
        className: 'bg-[#10B981] text-white border-none',
      })
      setSelectedPerdido(null)
      loadDemands(false)
    } catch (err: any) {
      toast({ title: 'Erro ao dar perdido', description: err.message, variant: 'destructive' })
    }
  }

  const handlePrioritizeConfirm = async (reason: string) => {
    if (!selectedPrioritize) return
    setIsPrioritizing(true)
    try {
      const demandType = selectedPrioritize.tipo === 'venda' ? 'Venda' : 'Aluguel'
      const { error } = await toggleDemandPriority(selectedPrioritize.id, demandType, false, reason)
      if (error) throw error

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demandType,
            data: { id: selectedPrioritize.id, is_prioritaria: true, motivo_priorizacao: reason },
          },
        }),
      )

      toast({
        title: '⭐ Demanda Priorizada',
        description: 'A demanda subiu para o topo do feed dos captadores.',
        className: 'bg-[#FCD34D] text-[#854D0E] border-none',
      })
      setSelectedPrioritize(null)
      loadDemands(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao priorizar',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsPrioritizing(false)
    }
  }

  const handleDeprioritize = async (demand: Demand) => {
    setIsPrioritizing(true)
    try {
      const demandType = demand.tipo === 'venda' ? 'Venda' : 'Aluguel'
      const { error } = await toggleDemandPriority(demand.id, demandType, true)
      if (error) throw error

      window.dispatchEvent(
        new CustomEvent('demanda-updated', {
          detail: {
            tipo: demandType,
            data: { id: demand.id, is_prioritaria: false },
          },
        }),
      )

      toast({ title: 'Prioridade Removida', description: 'A demanda voltou à posição normal.' })
      loadDemands(false)
    } catch (err: any) {
      toast({
        title: 'Erro ao despriorizar',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsPrioritizing(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white border rounded-xl p-5 space-y-4 shadow-[0_2px_8px_rgba(26,58,82,0.05)] border-[#E5E5E5]">
        <h3 className="font-bold text-[#1A3A52] flex items-center gap-2 text-[18px]">
          <span>🔍</span> Filtros de Busca
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <input
            type="text"
            placeholder="Buscar cliente..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border border-[#E5E5E5] rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#2E5F8A] focus:ring-1 focus:ring-[#2E5F8A] w-full"
          />

          <select
            value={filterStatusDemanda}
            onChange={(e) => setFilterStatusDemanda(e.target.value as any)}
            className="border border-[#E5E5E5] rounded-lg px-4 py-2.5 text-[14px] focus:outline-none focus:border-[#2E5F8A] focus:ring-1 focus:ring-[#2E5F8A] w-full bg-white font-semibold text-[#1A3A52]"
          >
            <option value="ativas">🟢 Demandas Ativas</option>
            <option value="inativas">🔴 Demandas Inativas</option>
            <option value="todas">Ver Todas</option>
          </select>

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
            onClick={() => loadDemands(false)}
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
        <div className="grid grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-5">
          {filteredDemands.map((demand) => (
            <DemandCardWrapper
              key={demand.id}
              demand={demand}
              setSelectedDetalhes={setSelectedDetalhes}
              setSelectedVinculador={setSelectedVinculador}
              setSelectedPerdido={setSelectedPerdido}
              setSelectedSugerirLinks={setSelectedSugerirLinks}
              setSelectedPrioritize={setSelectedPrioritize}
              onDeprioritize={handleDeprioritize}
              currentUser={currentUser}
              onReload={() => loadDemands(false)}
            />
          ))}
        </div>
      )}

      {/* Modals rendering */}
      <Suspense fallback={null}>
        {selectedDetalhes && (
          <ModalDetalhes
            demanda={selectedDetalhes}
            onClose={() => setSelectedDetalhes(null)}
            onReload={() => loadDemands(false)}
            onVincular={() => {
              setSelectedDetalhes(null)
              setSelectedVinculador(selectedDetalhes)
            }}
            onTogglePriority={() => {
              const d = selectedDetalhes
              setSelectedDetalhes(null)
              if (d.is_prioritaria) {
                handleDeprioritize(d)
              } else {
                setSelectedPrioritize(d)
              }
            }}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {selectedVinculador && (
          <ModalVinculador
            demanda={selectedVinculador}
            onClose={() => setSelectedVinculador(null)}
            onVinculoSucesso={() => {
              setSelectedVinculador(null)
              loadDemands(false)
            }}
          />
        )}
      </Suspense>

      {selectedPerdido && (
        <ModalDarPerdido
          demanda={selectedPerdido}
          onClose={() => setSelectedPerdido(null)}
          onConfirm={handleDarPerdidoConfirm}
        />
      )}

      {selectedSugerirLinks && (
        <ModalSugerirLinks
          demanda={selectedSugerirLinks}
          onClose={() => setSelectedSugerirLinks(null)}
          onSuccess={() => {
            setSelectedSugerirLinks(null)
            loadDemands(false)
          }}
        />
      )}

      {selectedPrioritize && (
        <PrioritizeModal
          open={!!selectedPrioritize}
          onOpenChange={(open) => !open && setSelectedPrioritize(null)}
          onConfirm={handlePrioritizeConfirm}
          similarCount={0}
        />
      )}
    </div>
  )
}
