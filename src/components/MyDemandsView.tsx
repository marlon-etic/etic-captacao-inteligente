import { useState, useMemo } from 'react'
import { FilterSidebar } from '@/components/FilterSidebar'
import { StickyFilterBar, FilterDef } from '@/components/StickyFilterBar'
import { useViewFilters } from '@/hooks/useViewFilters'
import { Skeleton } from '@/components/ui/skeleton'
import { Users, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useSupabaseDemands, SupabaseDemand } from '@/hooks/use-supabase-demands'
import { ExpandableDemandCardSDR } from '@/components/ExpandableDemandCardSDR'
import useAppStore from '@/stores/useAppStore'
import { DemandDetailModal } from '@/components/DemandDetailModal'
import { EditDemandModal } from '@/components/EditDemandModal'
import { LostModal } from '@/components/LostModal'
import { supabase } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'

interface Props {
  filterType?: 'Venda' | 'Aluguel'
}

const FILTERS: FilterDef[] = [
  {
    id: 'prioridade',
    label: 'Prioridade',
    options: [
      { value: 'Todos', label: 'Todas as Prioridades' },
      { value: 'prioritaria', label: 'Prioritárias (⭐)', icon: '⭐' },
      { value: 'normal', label: 'Normais' },
    ],
  },
  {
    id: 'status',
    label: 'Status',
    options: [
      { value: 'Todos', label: 'Todos os Status' },
      { value: 'aberta', label: 'Aberta', icon: '🟢' },
      { value: 'atendida', label: 'Ganho / Atendida', icon: '🔵' },
      { value: 'sem_resposta_24h', label: 'Sem Resposta', icon: '🟡' },
      { value: 'impossivel', label: 'Perdida', icon: '⚪' },
    ],
  },
  {
    id: 'urgencia',
    label: 'Urgência',
    options: [
      { value: 'Todos', label: 'Todas' },
      { value: 'Alta', label: 'Alta', icon: '🔴' },
      { value: 'Média', label: 'Média', icon: '🟡' },
      { value: 'Baixa', label: 'Baixa', icon: '⚪' },
    ],
  },
  {
    id: 'data',
    label: 'Data',
    options: [
      { value: 'Todos', label: 'Qualquer data', icon: '📅' },
      { value: '1', label: 'Últimas 24h', icon: '📅' },
      { value: '7', label: 'Últimos 7 dias', icon: '📅' },
      { value: '30', label: 'Últimos 30 dias', icon: '📅' },
      { value: '90', label: 'Últimos 90 dias', icon: '📅' },
    ],
  },
  { id: 'bairro', label: 'Bairro', isSearch: true, options: [] },
]

export function MyDemandsView({ filterType }: Props) {
  const { currentUser } = useAppStore()
  const { toast } = useToast()

  const activeType = filterType || (currentUser?.role === 'corretor' ? 'Venda' : 'Aluguel')
  const { demands, loading, refresh } = useSupabaseDemands(activeType)

  const [filters, setFilters] = useViewFilters('my_demands_view_supabase_' + activeType, {
    prioridade: 'Todos',
    status: 'Todos',
    urgencia: 'Todos',
    data: 'Todos',
    bairro: '',
  })

  const [actionDemand, setActionDemand] = useState<SupabaseDemand | null>(null)
  const [modalType, setModalType] = useState<'details' | 'edit' | 'lost' | null>(null)

  const handleAction = async (
    action: 'details' | 'edit' | 'lost' | 'prioritize',
    d: SupabaseDemand,
  ) => {
    if (action === 'prioritize') {
      const newStatus = !d.is_prioritaria
      const table = d.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

      try {
        const { error } = await supabase
          .from(table)
          .update({ is_prioritaria: newStatus })
          .eq('id', d.id)
        if (error) throw error
        toast({
          title: newStatus ? '⭐ Demanda Priorizada' : 'Prioridade Removida',
          description: newStatus
            ? 'A demanda subiu para o topo do feed dos captadores.'
            : 'A demanda voltou à posição normal.',
          className: newStatus ? 'bg-[#FCD34D] text-[#854D0E] border-none' : '',
        })
      } catch (err: any) {
        toast({
          title: 'Erro',
          description: 'Não foi possível alterar a prioridade.',
          variant: 'destructive',
        })
      }
    } else {
      setActionDemand(d)
      setModalType(action)
    }
  }

  const handleLostConfirm = async (reason: string, obs: string) => {
    if (!actionDemand) return
    const table = actionDemand.tipo === 'Aluguel' ? 'demandas_locacao' : 'demandas_vendas'

    // Fallback if DB doesn't have specific lost reason columns: append to observations
    const currentObs =
      actionDemand.tipo === 'Aluguel'
        ? actionDemand.observacoes
        : (actionDemand as any).necessidades_especificas
    const newObs = currentObs
      ? `${currentObs}\n\n[PERDIDO - ${new Date().toLocaleDateString()}]: ${reason} - ${obs}`
      : `[PERDIDO - ${new Date().toLocaleDateString()}]: ${reason} - ${obs}`

    const updateData: any = { status_demanda: 'impossivel' }
    if (actionDemand.tipo === 'Aluguel') {
      updateData.observacoes = newObs
    } else {
      updateData.necessidades_especificas = newObs
    }

    try {
      const { error } = await supabase.from(table).update(updateData).eq('id', actionDemand.id)
      if (error) throw error
      toast({
        title: 'Demanda Marcada como Perdida',
        description: `Motivo: ${reason}`,
        className: 'bg-[#EF4444] text-white border-none',
      })
    } catch (e: any) {
      toast({ title: 'Erro ao atualizar demanda', description: e.message, variant: 'destructive' })
    }
    setModalType(null)
  }

  const handleFilterChange = (newF: Record<string, string>) => {
    setFilters(newF)
  }

  const filteredDemands = useMemo(() => {
    return demands.filter((d) => {
      // Isolamento por usuário criador: SDR/Corretor veem apenas as SUAS demandas (exceto Admin/Gestor)
      if (currentUser?.role !== 'admin' && currentUser?.role !== 'gestor') {
        if (d.sdr_id !== currentUser?.id && d.corretor_id !== currentUser?.id) {
          return false
        }
      }

      if (filters.prioridade && filters.prioridade !== 'Todos') {
        const isPrio = filters.prioridade === 'prioritaria'
        if (!!d.is_prioritaria !== isPrio) return false
      }
      if (filters.status && filters.status !== 'Todos') {
        if (d.status_demanda !== filters.status) return false
      }
      if (filters.urgencia && filters.urgencia !== 'Todos') {
        if (d.nivel_urgencia !== filters.urgencia) return false
      }
      if (filters.bairro && filters.bairro !== '') {
        const bArr = filters.bairro.toLowerCase().split(',')
        const dBairros = d.bairros.map((b) => b.toLowerCase())
        if (!bArr.some((b) => dBairros.includes(b))) return false
      }
      if (filters.data && filters.data !== 'Todos') {
        const days = parseInt(filters.data)
        const dateLimit = new Date()
        dateLimit.setDate(dateLimit.getDate() - days)
        const dDate = new Date(d.created_at)
        if (dDate < dateLimit) return false
      }

      // Ocultar demandas perdidas por padrão se não estiver filtrando explicitamente por elas
      if (
        filters.status !== 'impossivel' &&
        filters.status !== 'Todos' &&
        d.status_demanda === 'impossivel'
      ) {
        return false
      }

      return true
    })
  }, [demands, filters, currentUser])

  const handleClear = () =>
    handleFilterChange({
      prioridade: 'Todos',
      status: 'Todos',
      urgencia: 'Todos',
      data: 'Todos',
      bairro: '',
    })

  const isAnyFilterActive = Object.values(filters).some((v) => v !== 'Todos' && v !== '')

  const MOBILE_CHIPS = [
    {
      label: 'Prioritárias',
      apply: {
        prioridade: 'prioritaria',
        status: 'Todos',
        urgencia: 'Todos',
        data: 'Todos',
        bairro: '',
      },
    },
    {
      label: 'Abertas',
      apply: {
        prioridade: 'Todos',
        status: 'aberta',
        urgencia: 'Todos',
        data: 'Todos',
        bairro: '',
      },
    },
    {
      label: 'Atendidas',
      apply: {
        prioridade: 'Todos',
        status: 'atendida',
        urgencia: 'Todos',
        data: 'Todos',
        bairro: '',
      },
    },
    {
      label: 'Perdidas',
      apply: {
        prioridade: 'Todos',
        status: 'impossivel',
        urgencia: 'Todos',
        data: 'Todos',
        bairro: '',
      },
    },
  ]

  return (
    <div className="flex flex-col lg:flex-row gap-[24px] items-start w-full animate-fade-in transition-opacity duration-150 ease-in relative z-0">
      <FilterSidebar
        filters={FILTERS}
        values={filters}
        onChange={handleFilterChange}
        resultsCount={filteredDemands.length}
      />

      <div className="flex-1 w-full flex flex-col gap-[16px] min-w-0">
        <div className="lg:hidden w-full space-y-3 relative z-10">
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide px-1">
            {MOBILE_CHIPS.map((chip) => {
              const isActive = JSON.stringify(filters) === JSON.stringify(chip.apply)
              return (
                <button
                  key={chip.label}
                  onClick={() => handleFilterChange(chip.apply)}
                  className={cn(
                    'h-[36px] px-[16px] rounded-[18px] whitespace-nowrap font-bold text-[13px] border shadow-sm transition-all flex items-center justify-center shrink-0',
                    isActive
                      ? 'bg-[#1A3A52] text-white border-[#1A3A52]'
                      : 'bg-white text-[#333333] border-[#E5E5E5] hover:border-[#1A3A52]/30',
                  )}
                >
                  {chip.label}
                </button>
              )
            })}
          </div>
          <StickyFilterBar
            filters={FILTERS}
            values={filters}
            onChange={handleFilterChange}
            resultsCount={filteredDemands.length}
            stickyTop="top-[128px]"
          />
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px] w-full items-stretch">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[250px] w-full rounded-[16px] animate-fast-pulse" />
            ))}
          </div>
        ) : filteredDemands.length === 0 ? (
          <div className="text-center py-[64px] px-4 bg-[#FFFFFF] border-[2px] rounded-[12px] border-dashed border-[#E5E5E5] flex flex-col items-center justify-center shadow-sm">
            {isAnyFilterActive ? (
              <>
                <Users className="w-16 h-16 text-[#999999]/30 mb-4" />
                <p className="text-[18px] font-bold text-[#333333]">
                  Nenhuma demanda com estes filtros.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full max-w-[200px]">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    className="font-bold min-h-[48px] w-full"
                  >
                    Limpar filtros
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-[#E8F0F8] rounded-full flex items-center justify-center mb-4">
                  <Users className="w-10 h-10 text-[#1A3A52]" />
                </div>
                <h3 className="text-[22px] font-black text-[#1A3A52]">
                  Nenhuma demanda registrada
                </h3>
                <p className="text-[15px] text-[#666666] mt-2 mb-8 max-w-[360px] leading-relaxed">
                  Você ainda não criou nenhuma demanda. Crie uma para acompanhá-la.
                </p>
                <Button onClick={refresh} variant="outline" className="gap-2">
                  <RefreshCw className="w-4 h-4" /> Atualizar
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-[16px] w-full items-stretch relative z-0">
            {filteredDemands.map((demand) => (
              <ExpandableDemandCardSDR key={demand.id} demand={demand} onAction={handleAction} />
            ))}
          </div>
        )}
      </div>

      <DemandDetailModal
        demand={actionDemand}
        isOpen={modalType === 'details'}
        onClose={() => setModalType(null)}
        onEdit={() => setModalType('edit')}
        onPrioritize={() => actionDemand && handleAction('prioritize', actionDemand)}
        onLost={() => setModalType('lost')}
      />

      <EditDemandModal
        demand={actionDemand}
        isOpen={modalType === 'edit'}
        onClose={() => setModalType(null)}
      />

      <LostModal
        open={modalType === 'lost'}
        onOpenChange={(o) => !o && setModalType(null)}
        onConfirm={handleLostConfirm}
      />
    </div>
  )
}
