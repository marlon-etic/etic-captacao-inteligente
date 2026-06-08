import { useState, useMemo } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { ExpandableDemandCardCaptador } from '@/components/ExpandableDemandCardCaptador'
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useAllDemands } from '@/hooks/use-all-demands'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

export function DemandasAbertasView() {
  const location = useLocation()
  const { demands, loading, refresh } = useAllDemands()
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const filteredDemands = useMemo(() => {
    return demands
      .filter((d) => {
        const isAberta = d.status_demanda === 'aberta' || d.status_demanda === 'sem_resposta_24h'
        const isPrioritizada = !!d.is_prioritaria

        // Ensure we only show ACTIVE demands in this view
        // Lost demands (impossivel / PERDIDA_BAIXA) should never show here
        if (d.status_demanda === 'impossivel' || d.status_demanda === 'PERDIDA_BAIXA') {
          return false
        }

        if (!isAberta && !isPrioritizada) {
          return false
        }

        if (statusFilter === 'Aberta' && !isAberta) return false
        if (statusFilter === 'Priorizada' && !isPrioritizada) return false

        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const clientMatch = d.nome_cliente?.toLowerCase().includes(term)
          const locMatch = d.bairros?.some((b) => b.toLowerCase().includes(term))
          if (!clientMatch && !locMatch) return false
        }

        return true
      })
      .slice(0, 50)
  }, [demands, statusFilter, searchTerm])

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const demandaId = params.get('demanda_id')

    if (demandaId && !loading && filteredDemands.length > 0) {
      setHighlightedId(demandaId)
      console.log('[DEMANDAS_ABERTAS] Highlighting demand:', demandaId)

      setTimeout(() => {
        const el = itemRefs.current[demandaId]
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })

          const buttonToClick = el.querySelector('button') as HTMLButtonElement | null
          if (buttonToClick) {
            buttonToClick.click()
          } else {
            const firstChild = el.firstElementChild as HTMLElement
            if (firstChild) firstChild.click()
          }
        }
      }, 500)

      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [location.search, loading, filteredDemands])

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-[250px] w-full rounded-xl" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3 rounded-xl border border-[#E5E5E5] shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] font-bold h-11 border-[#E5E5E5] focus:ring-[#1A3A52]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">📋 Todas Ativas</SelectItem>
              <SelectItem value="Priorizada">🔴 Priorizadas</SelectItem>
              <SelectItem value="Aberta">🟢 Abertas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto relative">
          <Search className="w-4 h-4 absolute left-3 text-[#999999]" />
          <Input
            placeholder="Buscar cliente ou bairro..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 w-full sm:w-[250px] h-11"
          />
          <Button
            variant="outline"
            size="icon"
            onClick={refresh}
            title="Atualizar"
            className="h-11 w-11 shrink-0"
          >
            <RefreshCw className="w-4 h-4 text-[#1A3A52]" />
          </Button>
        </div>
      </div>

      {filteredDemands.length === 0 ? (
        <div className="text-center py-16 bg-[#F8FAFC] border-2 border-dashed border-[#E5E5E5] rounded-xl flex flex-col items-center justify-center shadow-sm">
          <span className="text-[48px] mb-4 opacity-50">📂</span>
          <p className="text-lg font-bold text-[#1A3A52]">
            Nenhuma demanda {statusFilter !== 'Todas' ? statusFilter.toLowerCase() : 'disponível'}{' '}
            no momento.
          </p>
          <p className="text-sm text-[#666666] mt-1 max-w-[400px]">
            Verifique seus filtros, acesse outras abas ou aguarde novas solicitações.
          </p>
          <Button
            variant="outline"
            onClick={refresh}
            className="mt-6 font-bold border-[#E5E5E5] hover:bg-[#F5F5F5] text-[#333333]"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar Lista
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-[16px]">
          {filteredDemands.map((demand, index) => {
            const isHighlighted = highlightedId === demand.id
            return (
              <div
                key={demand.id}
                ref={(el) => (itemRefs.current[demand.id] = el)}
                className={cn(
                  'opacity-0 animate-cascade-fade h-full transition-all duration-500 rounded-xl',
                  isHighlighted &&
                    'ring-4 ring-blue-500 ring-offset-2 bg-blue-50/50 scale-[1.02] shadow-xl z-10',
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <ExpandableDemandCardCaptador demand={demand} />
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
