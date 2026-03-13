import { useState, useMemo } from 'react'
import { Demand } from '@/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from '@/components/ui/pagination'
import { Button } from '@/components/ui/button'

function getPriceRange(val: number) {
  if (val < 500000) return 'Até 500k'
  if (val < 1000000) return '500k - 1M'
  if (val < 2000000) return '1M - 2M'
  return 'Acima de 2M'
}

export function TopProfilesTable({
  demands,
  metric,
}: {
  demands: Demand[]
  metric: 'visits' | 'deals'
}) {
  const [page, setPage] = useState(1)
  const limit = 20
  const isVisits = metric === 'visits'

  const profiles = useMemo(() => {
    const map = new Map<string, any>()
    demands.forEach((d) => {
      const bairro = d.location.split(',')[0].trim() || 'Desconhecido'
      const val = d.maxBudget || d.budget || 0
      const faixa = getPriceRange(val)
      const key = `${bairro}-${faixa}-${d.bedrooms}-${d.parkingSpots}-${d.type}`

      if (!map.has(key)) {
        map.set(key, {
          bairro,
          faixa,
          dorm: d.bedrooms,
          vagas: d.parkingSpots,
          tipo: d.type,
          demandas: 0,
          visitas: 0,
          negocios: 0,
          valorTotal: 0,
        })
      }

      const p = map.get(key)
      p.demandas += 1

      let hasVisit = false
      let isDeal = false
      let dealValue = 0

      if (['Visita', 'Proposta', 'Negócio'].includes(d.status)) hasVisit = true
      if (d.status === 'Negócio') {
        isDeal = true
        dealValue = val
        d.capturedProperties?.forEach((cp) => {
          if (cp.fechamentoValue) dealValue = cp.fechamentoValue
        })
      }

      d.capturedProperties?.forEach((cp) => {
        if (cp.visitaDate) hasVisit = true
        if (cp.fechamentoDate) {
          isDeal = true
          if (cp.fechamentoValue) dealValue = cp.fechamentoValue
        }
      })

      if (hasVisit) p.visitas += 1
      if (isDeal) {
        p.negocios += 1
        p.valorTotal += dealValue
      }
    })
    return Array.from(map.values())
  }, [demands])

  const sorted = useMemo(
    () => profiles.sort((a, b) => (isVisits ? b.visitas - a.visitas : b.negocios - a.negocios)),
    [profiles, isVisits],
  )
  const paginated = sorted.slice((page - 1) * limit, page * limit)
  const pages = Math.max(1, Math.ceil(sorted.length / limit))

  const fmtCurrency = (v: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  return (
    <div className="bg-card border rounded-xl shadow-sm flex flex-col w-full overflow-hidden">
      <div className="p-4 md:p-6 border-b bg-muted/20">
        <h3 className="text-[16px] md:text-[18px] lg:text-[20px] font-bold text-foreground">
          {isVisits ? 'Bairros/Perfis com mais Visitas' : 'Bairros/Perfis com mais Negócios'}
        </h3>
      </div>
      <div className="w-full overflow-x-auto min-h-[300px]">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>Bairro</TableHead>
              <TableHead>Faixa de Valor</TableHead>
              <TableHead>Dorm</TableHead>
              <TableHead>Vagas</TableHead>
              <TableHead>Tipo</TableHead>
              {isVisits ? (
                <>
                  <TableHead>Visitas</TableHead>
                  <TableHead>Taxa Conv. (%)</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Negócios</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Médio</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginated.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                  Sem dados suficientes
                </TableCell>
              </TableRow>
            ) : (
              paginated.map((row, i) => (
                <TableRow key={i} className="min-h-[44px]">
                  <TableCell className="font-medium">{row.bairro}</TableCell>
                  <TableCell>{row.faixa}</TableCell>
                  <TableCell>{row.dorm}</TableCell>
                  <TableCell>{row.vagas}</TableCell>
                  <TableCell>{row.tipo}</TableCell>
                  {isVisits ? (
                    <>
                      <TableCell className="font-bold text-primary">{row.visitas}</TableCell>
                      <TableCell>
                        {row.demandas > 0 ? ((row.visitas / row.demandas) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </>
                  ) : (
                    <>
                      <TableCell className="font-bold text-emerald-600">{row.negocios}</TableCell>
                      <TableCell>{fmtCurrency(row.valorTotal)}</TableCell>
                      <TableCell>
                        {row.negocios > 0 ? fmtCurrency(row.valorTotal / row.negocios) : '-'}
                      </TableCell>
                    </>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {pages > 1 && (
        <div className="p-4 border-t bg-muted/10">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="min-h-[44px]"
                >
                  Anterior
                </Button>
              </PaginationItem>
              <span className="px-4 text-sm font-medium text-muted-foreground">
                Página {page} de {pages}
              </span>
              <PaginationItem>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  disabled={page === pages}
                  className="min-h-[44px]"
                >
                  Próxima
                </Button>
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
