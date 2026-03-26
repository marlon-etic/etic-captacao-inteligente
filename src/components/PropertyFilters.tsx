import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

interface Props {
  filters: any
  onChange: (f: any) => void
}

export function PropertyFilters({ filters, onChange }: Props) {
  const update = (key: string, val: string) => onChange({ ...filters, [key]: val })

  const activeCount = Object.entries(filters).filter(([k, v]) => {
    if (k === 'tipo' && v === 'Todos') return false
    if (k === 'status' && v === 'Todos') return false
    return v !== ''
  }).length

  return (
    <div className="bg-white p-4 rounded-xl border border-[#E5E5E5] shadow-[0_2px_8px_rgba(26,58,82,0.05)] flex flex-col gap-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-black text-[#1A3A52] text-sm uppercase tracking-wider flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filtros Rápidos
        </span>
        {activeCount > 0 && (
          <Badge className="bg-[#1A3A52] px-2 h-5 text-[10px] shadow-sm">
            {activeCount} ativos
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
        <div className="col-span-2 md:col-span-1 space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-0.5">
            Tipo
          </Label>
          <Select value={filters.tipo} onValueChange={(v) => update('tipo', v)}>
            <SelectTrigger className="h-[44px] text-sm font-medium border-[#E5E5E5] focus:ring-[#1A3A52]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Venda">Venda</SelectItem>
              <SelectItem value="Aluguel">Aluguel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 md:col-span-1 space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-0.5">
            Status
          </Label>
          <Select value={filters.status || 'Todos'} onValueChange={(v) => update('status', v)}>
            <SelectTrigger className="h-[44px] text-sm font-medium border-[#E5E5E5] focus:ring-[#1A3A52]">
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos</SelectItem>
              <SelectItem value="Disponível">Disponível</SelectItem>
              <SelectItem value="Em Negociação">Em Negociação</SelectItem>
              <SelectItem value="Fechado">Fechado</SelectItem>
              <SelectItem value="Perdido">Perdido</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2 md:col-span-2 space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-0.5">
            Bairro
          </Label>
          <Input
            placeholder="Buscar por bairro..."
            value={filters.bairro}
            onChange={(e) => update('bairro', e.target.value)}
            className="h-[44px] text-sm border-[#E5E5E5] focus-visible:ring-[#1A3A52]"
          />
        </div>
        <div className="col-span-1 space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-0.5">
            Dormitórios
          </Label>
          <Select
            value={filters.dormitorios}
            onValueChange={(v) => update('dormitorios', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-[44px] text-sm font-medium border-[#E5E5E5] focus:ring-[#1A3A52]">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-1 space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-0.5">
            Vagas
          </Label>
          <Select
            value={filters.vagas}
            onValueChange={(v) => update('vagas', v === 'all' ? '' : v)}
          >
            <SelectTrigger className="h-[44px] text-sm font-medium border-[#E5E5E5] focus:ring-[#1A3A52]">
              <SelectValue placeholder="Qualquer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Qualquer</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-2 md:col-span-1 space-y-1.5">
          <Label className="text-[11px] font-bold text-gray-500 uppercase tracking-wide ml-0.5">
            Valor Máximo
          </Label>
          <Input
            type="number"
            placeholder="Ex: 5000"
            value={filters.maxValor}
            onChange={(e) => update('maxValor', e.target.value)}
            className="h-[44px] text-sm border-[#E5E5E5] focus-visible:ring-[#1A3A52]"
          />
        </div>
      </div>
    </div>
  )
}
