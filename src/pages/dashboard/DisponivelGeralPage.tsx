import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BuscarDemandas } from '@/components/captador/BuscarDemandas'
import { ExpandableDemandCardSDR } from '@/components/ExpandableDemandCardSDR'
import { DemandDetailsModal } from '@/components/DemandDetailsModal'
import { useAllDemands } from '@/hooks/use-all-demands'
import useAppStore from '@/stores/useAppStore'
import { isDemandLost } from '@/lib/demand-status'
import { SupabaseDemand } from '@/hooks/use-supabase-demands'

function mapDemandForModal(demand: SupabaseDemand) {
  return {
    id: demand.id,
    clientName: demand.nome_cliente,
    type: demand.tipo,
    location: demand.bairros,
    minBudget: demand.valor_minimo,
    maxBudget: demand.valor_maximo,
    bedrooms: demand.dormitorios,
    bathrooms: 0,
    parkingSpots: demand.vagas_estacionamento,
    timeframe: demand.nivel_urgencia,
    description: demand.observacoes,
    status: demand.status_demanda === 'aberta' ? 'Pendente' : 'Perdida',
    createdAt: demand.created_at,
    isPrioritized: demand.is_prioritaria,
    createdBy: demand.sdr_id || demand.corretor_id || '',
    capturedProperties: (demand.imoveis_captados || []).map((i: any) => ({
      id: i.id,
      code: i.codigo_imovel,
      value: i.preco,
      neighborhood: i.endereco,
      capturedAt: i.created_at,
      status: i.status_captacao,
      captador_id: i.user_captador_id,
      etapa_funil: i.etapa_funil || 'capturado',
      data_visita: i.data_visita,
      data_fechamento: i.data_fechamento,
      dormitorios: i.dormitorios,
      vagas: i.vagas,
      observacoes: i.observacoes,
    })),
  } as any
}

export default function DisponivelGeralPage() {
  const { demands, loading, refresh } = useAllDemands()
  const { currentUser } = useAppStore()
  const [selectedDemand, setSelectedDemand] = useState<SupabaseDemand | null>(null)

  useEffect(() => {
    const handleDemandUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (
        detail?.data?.status_demanda === 'perdida' ||
        detail?.data?.db_status_demanda === 'perdida'
      ) {
        refresh()
      }
    }
    window.addEventListener('demanda-updated', handleDemandUpdate)
    return () => window.removeEventListener('demanda-updated', handleDemandUpdate)
  }, [refresh])

  const role = currentUser?.role
  const isCaptador = role === 'captador'
  const isOwnerFiltered = role === 'sdr' || role === 'corretor'

  const filteredDemands = useMemo(() => {
    let result = demands.filter((d) => !isDemandLost(d.status_demanda))
    if (isOwnerFiltered) {
      result = result.filter(
        (d) => d.sdr_id === currentUser?.id || d.corretor_id === currentUser?.id,
      )
    }
    return result
  }, [demands, currentUser, isOwnerFiltered])

  if (isCaptador) {
    return (
      <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in duration-500">
        <div className="mb-6 flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
              <Link to="/app">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-[24px] md:text-[28px] font-black text-[#1A3A52] tracking-tight truncate">
              Buscar Oportunidades
            </h1>
          </div>
          <p className="text-gray-500 font-medium ml-12">
            Encontre demandas abertas de clientes e vincule seus imóveis captados para gerar
            matches.
          </p>
        </div>
        <BuscarDemandas />
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in duration-500">
      <div className="mb-6 flex flex-col gap-1">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-full shrink-0">
            <Link to="/app">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-[24px] md:text-[28px] font-black text-[#1A3A52] tracking-tight truncate">
            {isOwnerFiltered ? 'Minhas Demandas' : 'Demandas Disponíveis'}
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            className="ml-auto h-9 w-9 shrink-0"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-gray-500 font-medium ml-12">
          {isOwnerFiltered
            ? 'Gerencie suas demandas e marque como perdida quando necessário.'
            : 'Visualize e gerencie todas as demandas do sistema.'}
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px] w-full rounded-xl" />
          ))}
        </div>
      ) : filteredDemands.length === 0 ? (
        <div className="text-center py-16 bg-[#F8FAFC] border-2 border-dashed border-[#E5E5E5] rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[48px] mb-4 opacity-50 block">📋</span>
          <p className="text-lg font-bold text-[#1A3A52]">Nenhuma demanda disponível.</p>
          <p className="text-sm text-[#666666] mt-1 max-w-[400px]">
            {isOwnerFiltered
              ? 'Você não tem demandas ativas no momento.'
              : 'Não há demandas ativas no sistema.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredDemands.map((demand) => (
            <ExpandableDemandCardSDR
              key={demand.id}
              demand={demand}
              onAction={(action, d) => {
                if (action === 'details') setSelectedDemand(d)
              }}
            />
          ))}
        </div>
      )}

      <DemandDetailsModal
        open={!!selectedDemand}
        onOpenChange={(open) => !open && setSelectedDemand(null)}
        demand={selectedDemand ? mapDemandForModal(selectedDemand) : null}
      />
    </div>
  )
}
