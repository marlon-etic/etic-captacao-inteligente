import { Filter } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface HistoricoFiltersProps {
  filterTipo: string
  setFilterTipo: (v: string) => void
  filterPeriodo: string
  setFilterPeriodo: (v: string) => void
}

export function HistoricoFilters({
  filterTipo,
  setFilterTipo,
  filterPeriodo,
  setFilterPeriodo,
}: HistoricoFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-xl shadow-sm border border-[#E5E5E5]">
      <div className="flex items-center gap-2 text-[#666666] font-bold text-sm">
        <Filter className="w-4 h-4" /> Filtrar:
      </div>
      <Select value={filterTipo} onValueChange={setFilterTipo}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Tipologia" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todos">Todas as Tipologias</SelectItem>
          <SelectItem value="apartamento">Apartamento</SelectItem>
          <SelectItem value="casa">Casa</SelectItem>
          <SelectItem value="galpao">Galpão</SelectItem>
          <SelectItem value="comercial">Comercial</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
        <SelectTrigger className="w-full sm:w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7">Últimos 7 dias</SelectItem>
          <SelectItem value="30">Últimos 30 dias</SelectItem>
          <SelectItem value="90">Últimos 90 dias</SelectItem>
          <SelectItem value="todos">Todo o histórico</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
