import { useState, useMemo, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { supabase } from '@/lib/supabase/client'
import { ExpandableDemandCardCaptador } from '@/components/ExpandableDemandCardCaptador'
import { useAllDemands } from '@/hooks/use-all-demands'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RefreshCw, Search } from 'lucide-react'
import { isDemandGloballyLost, isDemandLocallyLost, isDemandTimeoutLost } from '@/lib/demand-status'
import { STANDARDIZED_LOST_REASONS, TIMEOUT_LOSS_REASON } from '@/lib/lost-reasons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

export function DemandasPerdidasView() {
  const { demands, loading, refresh } = useAllDemands()
  const [searchTerm, setSearchTerm] = useState('')
  const [motivoFilter, setMotivoFilter] = useState('todos')

  useEffect(() => {
    const channelVendas = supabase
      .channel('demandas_vendas_perdidas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_vendas' }, () => {
        refresh()
      })
      .subscribe()

    const channelLocacao = supabase
      .channel('demandas_locacao_perdidas_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demandas_locacao' }, () => {
        refresh()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channelVendas)
      supabase.removeChannel(channelLocacao)
    }
  }, [refresh])

  const filteredDemands = useMemo(() => {
    return demands
      .filter((d) => {
        const isGloballyLost =
          isDemandGloballyLost(d.db_status_demanda) || isDemandGloballyLost(d.status_demanda)
        const isLocallyLost = isDemandLocallyLost(d.status_demanda)
        if (!isGloballyLost && !isLocallyLost) return false

        if (searchTerm) {
          const term = searchTerm.toLowerCase()
          const clientMatch = d.nome_cliente?.toLowerCase().includes(term)
          const locMatch = d.bairros?.some((b) => b.toLowerCase().includes(term))
          if (!clientMatch && !locMatch) return false
        }

        if (motivoFilter === 'timeout' && !isDemandTimeoutLost(d.motivo_perda)) return false
        if (motivoFilter !== 'todos' && motivoFilter !== 'timeout' && d.motivo_perda !== motivoFilter) return false

        return true
      })
      .slice(0, 50)
  }, [demands, searchTerm, motivoFilter])

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
        <h2 className="text-[16px] font-black text-[#1A3A52] uppercase tracking-wider ml-2">
          Demandas Perdidas
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <Select value={motivoFilter} onValueChange={setMotivoFilter}>
            <SelectTrigger className="w-full sm:w-[200px] font-bold h-11 border-[#E5E5E5] focus:ring-[#1A3A52]">
              <SelectValue placeholder="Filtrar por motivo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">📋 Todos os motivos</SelectItem>
              <SelectItem value="timeout">⏰ Timeout (72h)</SelectItem>
              {STANDARDIZED_LOST_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <p className="text-lg font-bold text-[#1A3A52]">Nenhuma demanda perdida.</p>
          <p className="text-sm text-[#666666] mt-1 max-w-[400px]">
            As demandas marcadas como "Fora do mercado", canceladas ou fechadas por timeout
            aparecerão aqui.
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
