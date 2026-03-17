import { useState, useMemo } from 'react'
import { LayoutGrid } from 'lucide-react'
import { Demand } from '@/types'
import { cn } from '@/lib/utils'
import useAppStore from '@/stores/useAppStore'
import { EncontreiGrupoModal } from '@/components/EncontreiGrupoModal'
import { NaoEncontreiModal } from '@/components/NaoEncontreiModal'
import { GroupedCard, IndividualCard, LooseCard } from './NewCapturesCards'

export function DemandasTab({ demands }: { demands: Demand[] }) {
  const { users, submitDemandResponse } = useAppStore()

  const [filterTipo, setFilterTipo] = useState<'Ambas' | 'Venda' | 'Aluguel'>('Ambas')
  const [filterPeriodo, setFilterPeriodo] = useState<'Todas' | 'Últimas 24h' | '7 dias'>('Todas')

  const [showCaptureModal, setShowCaptureModal] = useState(false)
  const [showNaoEncontreiModal, setShowNaoEncontreiModal] = useState(false)
  const [selectedDemandIds, setSelectedDemandIds] = useState<string[]>([])

  const filteredDemands = useMemo(() => {
    if (!demands) return []
    const now = Date.now()
    return demands.filter((d) => {
      if (d.status !== 'Pendente') return false
      if (filterTipo !== 'Ambas' && d.type !== filterTipo) return false
      const ageMs = now - new Date(d.createdAt).getTime()
      if (filterPeriodo === 'Últimas 24h' && ageMs > 24 * 3600000) return false
      if (filterPeriodo === '7 dias' && ageMs > 7 * 86400000) return false
      return true
    })
  }, [demands, filterTipo, filterPeriodo])

  const allCards = useMemo(() => {
    const toProcess = [...filteredDemands]
    const groupMap = new Map<string, Demand[]>()
    const looseList: Demand[] = []

    const hasLoose = filteredDemands.some(
      (d) => !d.clientName || d.clientName.toLowerCase() === 'geral',
    )
    if (!hasLoose && filterTipo !== 'Aluguel') {
      toProcess.push({
        id: 'mock-loose-1',
        clientName: '',
        location: 'Moema, Jardins',
        type: 'Venda',
        minBudget: 1500000,
        maxBudget: 2000000,
        bedrooms: 3,
        bathrooms: 2,
        parkingSpots: 2,
        description: 'Demanda geral do mercado',
        timeframe: 'Até 30 dias',
        status: 'Pendente',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      } as Demand)
    }

    toProcess.forEach((d) => {
      if (!d.clientName || d.clientName.toLowerCase() === 'geral') {
        looseList.push(d)
        return
      }
      const key = `${d.location}|${d.type}|${d.bedrooms || 0}|${d.parkingSpots || 0}`
      if (!groupMap.has(key)) groupMap.set(key, [])
      groupMap.get(key)!.push(d)
    })

    const finalGroups: { demands: Demand[]; clientCount: number; newestDate: number }[] = []
    const indivList: Demand[] = []

    groupMap.forEach((gDemands) => {
      const subGroups: Demand[][] = []
      gDemands.forEach((d) => {
        const dMax = d.maxBudget || d.budget || 0
        const dMin = d.minBudget || d.budget || 0
        let matched = false
        for (const sg of subGroups) {
          const sgMax = sg[0].maxBudget || sg[0].budget || 0
          const sgMin = sg[0].minBudget || sg[0].budget || 0
          if (dMax >= sgMin * 0.9 && dMin <= sgMax * 1.1) {
            sg.push(d)
            matched = true
            break
          }
        }
        if (!matched) subGroups.push([d])
      })
      subGroups.forEach((sg) => {
        if (sg.length > 1) {
          finalGroups.push({
            demands: sg,
            clientCount: sg.length,
            newestDate: Math.max(...sg.map((x) => new Date(x.createdAt).getTime())),
          })
        } else {
          indivList.push(sg[0])
        }
      })
    })

    const combined = [
      ...finalGroups.map((g) => {
        let p = 3
        if (g.clientCount >= 7) p = 1
        else if (g.clientCount >= 4) p = 2
        return { type: 'grouped' as const, priority: p, date: g.newestDate, data: g }
      }),
      ...indivList.map((d) => ({
        type: 'individual' as const,
        priority: 4,
        date: new Date(d.createdAt).getTime(),
        data: d,
      })),
      ...looseList.map((d) => ({
        type: 'loose' as const,
        priority: 5,
        date: new Date(d.createdAt).getTime(),
        data: d,
      })),
    ]

    combined.sort((a, b) => {
      if (a.priority !== b.priority) return a.priority - b.priority
      return b.date - a.date
    })

    return combined
  }, [filteredDemands, filterTipo])

  const handleEncontrei = (ids: string[]) => {
    setSelectedDemandIds(ids)
    setShowCaptureModal(true)
  }

  const handleNaoEncontreiClick = (ids: string[]) => {
    setSelectedDemandIds(ids)
    setShowNaoEncontreiModal(true)
  }

  const handleConfirmNaoEncontrei = (reason: string, continueSearch: boolean) => {
    selectedDemandIds.forEach((id) => {
      if (id !== 'mock-loose-1') {
        submitDemandResponse(id, 'nao_encontrei', {
          reason,
          continueSearch,
        })
      }
    })
    setShowNaoEncontreiModal(false)
  }

  const getUserName = (id?: string) => users.find((u) => u.id === id)?.name || 'Sistema'

  if (!demands) {
    return (
      <div className="text-center py-16 bg-[#FFFFFF] border-2 rounded-xl border-dashed border-[#F44336]/50">
        <p className="text-[16px] font-bold text-[#F44336]">
          Erro ao carregar demandas. Tente novamente.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 animate-fade-in w-full">
      <div className="flex flex-col gap-4 bg-white p-4 md:p-6 rounded-xl border-2 border-[#1A3A52] shadow-sm">
        <h2 className="text-[20px] md:text-[24px] font-black text-[#1A3A52] flex items-center gap-2 m-0 leading-none">
          🎯 NOVAS CAPTAÇÕES DISPONÍVEIS
        </h2>
        <p className="text-[14px] md:text-[16px] text-[#333333] font-medium m-0">
          <strong className="text-[#1A3A52]">{filteredDemands.length}</strong> demandas aguardando
          captação
        </p>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-[#F5F5F5] p-2 rounded-lg border border-[#E5E5E5] mt-2">
          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0 px-2">
              Tipo:
            </span>
            {['Ambas', 'Venda', 'Aluguel'].map((t) => (
              <button
                key={t}
                onClick={() => setFilterTipo(t as any)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-[13px] font-bold transition-all shrink-0',
                  filterTipo === t
                    ? 'bg-[#1A3A52] text-white shadow-sm'
                    : 'text-[#333333] hover:bg-[#E5E5E5]',
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="hidden sm:block w-[1px] h-6 bg-[#D4D4D4]" />

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto scrollbar-hide">
            <span className="text-[12px] font-bold text-[#999999] uppercase shrink-0 px-2">
              Período:
            </span>
            {['Todas', 'Últimas 24h', '7 dias'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterPeriodo(p as any)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-[13px] font-bold transition-all shrink-0',
                  filterPeriodo === p
                    ? 'bg-[#1A3A52] text-white shadow-sm'
                    : 'text-[#333333] hover:bg-[#E5E5E5]',
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {allCards.length === 0 ? (
        <div className="text-center py-16 bg-[#FFFFFF] border-2 rounded-xl border-dashed border-[#E5E5E5]">
          <LayoutGrid className="w-12 h-12 text-[#999999]/50 mx-auto mb-3" />
          <p className="text-[16px] font-bold text-[#333333]">Nenhuma demanda no momento.</p>
          <p className="text-[14px] text-[#999999]">Volte mais tarde!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {allCards.map((card) => {
            if (card.type === 'grouped') {
              const ids = card.data.demands.map((d) => d.id)
              return (
                <GroupedCard
                  key={card.data.demands[0].id}
                  group={card.data}
                  onEncontrei={() => handleEncontrei(ids)}
                  onNaoEncontrei={() => handleNaoEncontreiClick(ids)}
                />
              )
            }
            if (card.type === 'individual') {
              return (
                <IndividualCard
                  key={card.data.id}
                  demand={card.data}
                  creatorName={getUserName(card.data.createdBy)}
                  onEncontrei={() => handleEncontrei([card.data.id])}
                  onNaoEncontrei={() => handleNaoEncontreiClick([card.data.id])}
                />
              )
            }
            if (card.type === 'loose') {
              return (
                <LooseCard
                  key={card.data.id}
                  demand={card.data}
                  onEncontrei={() => handleEncontrei([card.data.id])}
                  onNaoEncontrei={() => handleNaoEncontreiClick([card.data.id])}
                />
              )
            }
          })}
        </div>
      )}

      <EncontreiGrupoModal
        isOpen={showCaptureModal}
        onClose={() => setShowCaptureModal(false)}
        demandIds={selectedDemandIds}
      />

      <NaoEncontreiModal
        isOpen={showNaoEncontreiModal}
        onClose={() => setShowNaoEncontreiModal(false)}
        onConfirm={handleConfirmNaoEncontrei}
      />
    </div>
  )
}
