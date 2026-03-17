import { useState, useMemo } from 'react'
import { EnhancedDemand } from '@/lib/analytics-utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'

interface Props {
  demands: EnhancedDemand[]
  selectedNeighborhood: string | null
  onClearNeighborhood: () => void
}

export function ProfileTable({ demands, selectedNeighborhood, onClearNeighborhood }: Props) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const limit = 15

  const grouped = useMemo(() => {
    const map = new Map<string, any>()
    const filtered = demands.filter((d) => {
      if (selectedNeighborhood && d.location.split(',')[0].trim() !== selectedNeighborhood)
        return false
      if (search) {
        const term = search.toLowerCase()
        const b = d.location.toLowerCase()
        const t = d.tipologia.toLowerCase()
        if (!b.includes(term) && !t.includes(term)) return false
      }
      return true
    })

    filtered.forEach((d) => {
      const b = d.location.split(',')[0].trim() || 'Desconhecido'
      const key = `${b}-${d.tipologia}-${d.faixaValor}-${d.bedrooms}-${d.parkingSpots}-${d.type}`
      if (!map.has(key)) {
        map.set(key, {
          bairro: b,
          tipologia: d.tipologia,
          faixa: d.faixaValor,
          dorm: d.bedrooms || 0,
          vagas: d.parkingSpots || 0,
          tipo: d.type,
          qtd: 0,
        })
      }
      map.get(key).qtd++
    })

    return Array.from(map.values()).sort((a, b) => b.qtd - a.qtd)
  }, [demands, selectedNeighborhood, search])

  const pages = Math.max(1, Math.ceil(grouped.length / limit))
  const paginated = grouped.slice((page - 1) * limit, page * limit)

  return (
    <div className="bg-white p-6 rounded-xl border-[2px] border-[#2E5F8A]/20 shadow-sm flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h3 className="text-[18px] font-bold text-[#1A3A52] mb-1">
            Perfil de Imóvel Mais Buscado
          </h3>
          <p className="text-[12px] text-[#999999] font-medium">
            Agrupamento detalhado de demandas
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedNeighborhood && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearNeighborhood}
              className="h-[36px] font-bold"
            >
              <X className="w-4 h-4 mr-2 text-[#F44336]" />
              Filtro: {selectedNeighborhood}
            </Button>
          )}
          <div className="relative w-full sm:w-[250px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#999999]" />
            <Input
              placeholder="Buscar bairro ou tipologia..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              className="pl-9 h-[36px] text-[12px]"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-lg border border-[#E5E5E5]">
        <Table>
          <TableHeader className="bg-[#F5F5F5]">
            <TableRow>
              <TableHead className="font-bold text-[#333333]">Bairro</TableHead>
              <TableHead className="font-bold text-[#333333]">Tipologia</TableHead>
              <TableHead className="font-bold text-[#333333]">Faixa de Valor</TableHead>
              <TableHead className="font-bold text-[#333333] text-center">Dorm.</TableHead>
              <TableHead className="font-bold text-[#333333] text-center">Vagas</TableHead>
              <TableHead className="font-bold text-[#333333]">Tipo</TableHead>
              <TableHead className="font-bold text-[#1A3A52] text-center">Qtd</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-[#999999] font-medium">
                  Nenhum perfil encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={i} className="hover:bg-[#F5F5F5]/50">
                  <TableCell className="font-semibold text-[#1A3A52]">{row.bairro}</TableCell>
                  <TableCell className="text-[#333333] font-medium">{row.tipologia}</TableCell>
                  <TableCell className="text-[#333333]">{row.faixa}</TableCell>
                  <TableCell className="text-center text-[#333333]">{row.dorm}</TableCell>
                  <TableCell className="text-center text-[#333333]">{row.vagas}</TableCell>
                  <TableCell>
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded-sm ${row.tipo === 'Venda' ? 'bg-[#FF9800]/10 text-[#FF9800]' : 'bg-[#1A3A52]/10 text-[#1A3A52]'}`}
                    >
                      {row.tipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-center font-black text-[#1A3A52]">{row.qtd}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <Button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            variant="outline"
            className="h-[36px]"
          >
            Anterior
          </Button>
          <span className="text-[12px] font-bold text-[#999999]">
            Página {page} de {pages}
          </span>
          <Button
            onClick={() => setPage((p) => Math.min(pages, p + 1))}
            disabled={page === pages}
            variant="outline"
            className="h-[36px]"
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
