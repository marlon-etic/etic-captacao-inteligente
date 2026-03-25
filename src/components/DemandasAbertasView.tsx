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
import { useAllDemands } from '@/hooks/use-all-demands'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search, Frown } from 'lucide-react'

export function DemandasAbertasView() {
  const { demands, loading, refresh } = useAllDemands()
  const [statusFilter, setStatusFilter] = useState('Todas')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredDemands = useMemo(() => {
    return demands
      .filter((d) => {
        const isAberta = d.status_demanda === 'aberta' || d.status_demanda === 'sem_resposta_24h'
        const isPerdida = d.status_demanda === 'impossivel'
        const isPrioritizada = !!d.is_prioritaria

        if (statusFilter === 'Aberta' && !isAberta) return false
        if (statusFilter === 'Priorizada' && !isPrioritizada) return false
        if (statusFilter === 'Perdidas' && !isPerdida) return false

        if (statusFilter === 'Todas' && !isAberta && !isPrioritizada && !isPerdida) {
          return false
        }

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
            <SelectTrigger className="w-full sm:w-[180px] font-bold h-11">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas</SelectItem>
              <SelectItem value="Priorizada">Priorizadas</SelectItem>
              <SelectItem value="Aberta">Abertas</SelectItem>
              <SelectItem value="Perdidas">Perdidas</SelectItem>
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
        <div className="text-center py-16 bg-white border-2 border-dashed border-[#E5E5E5] rounded-xl flex flex-col items-center justify-center">
          <Frown className="w-12 h-12 text-[#999999]/50 mb-3" />
          <p className="text-lg font-bold text-[#333333]">
            Nenhuma demanda {statusFilter !== 'Todas' ? statusFilter.toLowerCase() : 'disponível'}{' '}
            no momento.
          </p>
          <p className="text-sm text-[#666666] mt-1">
            Verifique outras abas ou aguarde novas demandas.
          </p>
          <Button variant="outline" onClick={refresh} className="mt-4 font-bold">
            <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4">
          {filteredDemands.map((demand, index) => (
            <div
              key={demand.id}
              className="opacity-0 animate-cascade-fade h-full"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <ExpandableDemandCardCaptador demand={demand} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
