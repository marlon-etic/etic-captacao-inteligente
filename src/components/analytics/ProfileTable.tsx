import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, Building2, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EnhancedDemand {
  id: string
  clientName: string
  location: string | string[]
  budget?: number
  minBudget?: number
  maxBudget?: number
  bedrooms?: number
  bathrooms?: number
  parkingSpots?: number
  type: string
  status: string
}

interface Props {
  demands: EnhancedDemand[]
  selectedNeighborhood: string | null
  onClearNeighborhood: () => void
}

export function ProfileTable({ demands, selectedNeighborhood, onClearNeighborhood }: Props) {
  const tableData = useMemo(() => {
    const map = new Map<string, any>()

    demands.forEach((d) => {
      let locs: string[] = []
      if (Array.isArray(d.location)) {
        locs = d.location
      } else if (typeof d.location === 'string') {
        locs = d.location.split(',').map((s) => s.trim())
      } else {
        locs = ['Desconhecido']
      }

      if (selectedNeighborhood && !locs.includes(selectedNeighborhood)) return

      locs.forEach((loc) => {
        const key = `${loc}-${d.type}-${d.bedrooms || 0}-${d.parkingSpots || 0}`
        if (!map.has(key)) {
          map.set(key, {
            id: key,
            bairro: loc,
            tipo: d.type,
            dormitorios: d.bedrooms || 0,
            vagas: d.parkingSpots || 0,
            count: 0,
            avgBudget: 0,
            sumBudget: 0,
          })
        }
        const item = map.get(key)
        item.count += 1
        item.sumBudget += d.budget || d.maxBudget || 0
        item.avgBudget = item.sumBudget / item.count
      })
    })

    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [demands, selectedNeighborhood])

  return (
    <Card className="shadow-md border-0 ring-1 ring-[#2E5F8A]/10 overflow-hidden">
      <CardHeader className="bg-[#F5F5F5] border-b pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-[#1A3A52]">
              Top 10 Perfis Mais Buscados
            </CardTitle>
            <CardDescription className="text-[#666666]">
              Agrupamento de demandas por tipologia e região.
            </CardDescription>
          </div>
          {selectedNeighborhood && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearNeighborhood}
              className="text-[#F44336] border-[#F44336]/30 hover:bg-[#F44336]/10 font-bold"
            >
              <X className="w-4 h-4 mr-2" />
              Remover filtro: {selectedNeighborhood}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#FFFFFF]">
              <TableRow className="border-b border-[#E5E5E5]">
                <TableHead className="font-bold text-[#1A3A52] w-[80px]">Posição</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Bairro</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Tipo</TableHead>
                <TableHead className="font-bold text-[#1A3A52]">Perfil</TableHead>
                <TableHead className="text-right font-bold text-[#1A3A52]">Valor Médio</TableHead>
                <TableHead className="text-right font-bold text-[#1A3A52]">Volume</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-[200px] text-center text-[#999999]">
                    Nenhum perfil encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                tableData.map((row, index) => (
                  <TableRow key={row.id} className="hover:bg-[#F5F5F5] transition-colors">
                    <TableCell className="font-bold text-[#999999]">#{index + 1}</TableCell>
                    <TableCell className="font-bold text-[#333333]">{row.bairro}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={cn(
                          'border-transparent font-bold',
                          row.tipo === 'Venda'
                            ? 'bg-[#FF9800]/10 text-[#FF9800]'
                            : 'bg-[#1A3A52]/10 text-[#1A3A52]',
                        )}
                      >
                        {row.tipo === 'Venda' ? (
                          <Building2 className="w-3 h-3 mr-1" />
                        ) : (
                          <Home className="w-3 h-3 mr-1" />
                        )}
                        {row.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[#666666] font-medium">
                      {row.dormitorios} dorms, {row.vagas} vagas
                    </TableCell>
                    <TableCell className="text-right font-bold text-[#4CAF50]">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        maximumFractionDigits: 0,
                      }).format(row.avgBudget)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="font-black text-[16px] text-[#1A3A52]">{row.count}</span>
                        <span className="text-[12px] text-[#999999]">buscas</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
